<script setup lang="ts">
import path from 'path'
import { storeToRefs } from 'pinia'
import { defineProps, onMounted, ref } from 'vue'
import WaveSurfer from 'wavesurfer.js'
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js'
import RecordPlugin from 'wavesurfer.js/dist/plugins/record.esm.js'
import Pitchfinder from 'pitchfinder'

import { useAppStore } from '../stores'
const appStore = useAppStore()
const { isPlaying, loopRegion, playRegion, activatedSurferName } = storeToRefs(appStore)
// const pitchWorker = new Worker(path.resolve(__dirname, 'workers', 'pitch-worker.js'));

let ws:any = null
let record:any = null
let activeRegion:any = null;
const containerEl = ref(null)
const micEl = ref(null)
const wsPeaks = ref(null)
const filled = ref(false)
const isRecording = ref(false)

const props = defineProps({
  name: {
    type: String,
    default: 'main',
  },
  useRecord: {
    type: Boolean,
    default: false,
  }
})

const isActivated = computed(() => {
  return props.name === activatedSurferName.value
})

watch(() => isPlaying.value, (v) => {
  if (ws) {
    if (v) {
      if (isActivated.value) {
        ws.play()
      }
    } else {
      ws.pause()
    }
  }
})

watch(() => wsPeaks.value, (v) => {
  updatePeaks()
})

function createWs(container:any, audio: any, url: string) {
  const opts:any = {
    container: container as any,
    waveColor: 'rgba(200, 200, 200, 0.5)',
    progressColor: 'rgba(100, 100, 100, 0.5)',
    minPxPerSec: 100,
    hideScrollbar: true,
    autoCenter: false,
    height: container.clientHeight,
  }

  if (audio) {
    opts.media = audio
  } else {
    opts.url = url
  }

  console.log(opts);

  const _ws = WaveSurfer.create(opts)

  record = _ws.registerPlugin(RecordPlugin.create())

  // Initialize the Regions plugin
  const wsRegions = _ws.registerPlugin(RegionsPlugin.create())
  const random = (min:number, max:number) => Math.random() * (max - min) + min
  const randomColor = () => `rgba(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)}, 0.1)`
  wsRegions.enableDragSelection({
    color: 'rgba(255, 0, 0, 0.1)',
  })

  _ws.once('decode', () => {
    wsPeaks.value = ws.getDecodedData().getChannelData(0)
    console.log('decoded!')
  })

  _ws.on('interaction', () => {
    _ws.pause()
    activeRegion = null
  })

  _ws.on('decode', () => {
    // Regions
    wsRegions.addRegion({
      start: 0.2,
      end: 5,
      // content: 'Resize me',
      color: randomColor(),
      drag: true,
      resize: true,
    })
  })

  wsRegions.on('region-in', (region:any) => {
    activeRegion = region
  })

  wsRegions.on('region-out', (region:any) => {
    if (activeRegion === region) {
      if (playRegion.value) {
        if (loopRegion.value) {
          region.play()
        } else {
          activeRegion = null
          _ws.pause()
        }
      }
    }
  })

  wsRegions.on('region-clicked', (region:any, e:any) => {
    e.stopPropagation() // prevent triggering a click on the waveform
    console.log(region);
    _ws.seekTo(region.start / _ws.getDuration())
    activeRegion = region
  })

  return _ws;
}

function updatePeaks() {
  const sampleRate = ws.options.sampleRate
  const peaks:any = wsPeaks.value
  const algo = 'AMDF'
  const detectPitch = Pitchfinder[algo]({ sampleRate })
  const duration = peaks.length / sampleRate
  const bpm = peaks.length / duration / 60

  const frequencies = Pitchfinder.frequencies(detectPitch, peaks, {
    tempo: bpm,
    quantization: bpm,
  })

  // Find the baseline frequency (the value that appears most often)
  const frequencyMap:any = {}
  let maxAmount = 0
  let baseFrequency = 0
  frequencies.forEach((frequency) => {
    if (!frequency) return
    const tolerance = 10
    frequency = Math.round(frequency * tolerance) / tolerance
    if (!frequencyMap[frequency]) frequencyMap[frequency] = 0
    frequencyMap[frequency] += 1
    if (frequencyMap[frequency] > maxAmount) {
      maxAmount = frequencyMap[frequency]
      baseFrequency = frequency
    }
  })

  // Render the frequencies on a canvas
  const pitchUpColor = '#385587'
  const pitchDownColor = '#C26351'
  const height = 100

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  canvas.width = frequencies.length
  canvas.height = height
  canvas.style.width = '100%'
  canvas.style.height = '100%'

  // Each frequency is a point whose Y position is the frequency and X position is the time
  const pointSize = devicePixelRatio
  let prevY = 0
  frequencies.forEach((frequency:any, index:any) => {
    if (!frequency) return
    const y = Math.round(height - (frequency / (baseFrequency * 2)) * height)
    if (ctx) {
      ctx.fillStyle = y > prevY ? pitchDownColor : pitchUpColor
      ctx.fillRect(index, y, pointSize, pointSize)
    }
    prevY = y
  })

  // Add the canvas to the waveform container
  ws.renderer.getWrapper().appendChild(canvas)
  // Remove the canvas when a new audio is loaded
  ws.once('load', () => canvas.remove())
}

async function loadFile() {
  const tobiPlayer = (window as any).tobiPlayer;
  const filePath = await tobiPlayer.openDialog();
  if (filePath) {
    const fileName = filePath.split('/').pop();
    tobiPlayer.setAppTitle(fileName);

    const audioUrl = await tobiPlayer.loadAudioFile(filePath);
    const audio = new Audio(audioUrl);
    ws = createWs(containerEl.value, audio, "");

    filled.value = true;
    activatedSurferName.value = props.name;
  };
}

function startRecording() {
  if (record) {
    if (record.isRecording()) {
      record.stopRecording()
      isRecording.value = false
      return
    }

    record.startRecording().then(() => {
      isRecording.value = true
    })

  }
}

function activate() {
  if (filled.value) {
    activatedSurferName.value = props.name
  }
}

onMounted(() => {
  setTimeout(() => {
    const mic:any = micEl.value as any;
    const _ws = WaveSurfer.create({
      container: mic,
      waveColor: 'rgba(100, 200, 200, 0.5)',
      progressColor: 'rgba(100, 100, 100, 0.5)',
      minPxPerSec: 100,
      hideScrollbar: true,
      autoCenter: false,
      height: mic.clientHeight,
    })

    record = _ws.registerPlugin(RecordPlugin.create())
    record.on('record-end', (blob:any) => {
      const recordedUrl = URL.createObjectURL(blob)
      ws = createWs(containerEl.value, null, recordedUrl);
      filled.value = true;
      activatedSurferName.value = props.name;

      // Download link
      // const link = container.appendChild(document.createElement('a'))
      // Object.assign(link, {
      //   href: recordedUrl,
      //   download: 'recording.' + blob.type.split(';')[0].split('/')[1] || 'webm',
      //   textContent: 'Download recording',
      // })
    })
  }, 300)
})
</script>

<template>
  <div class="surfer" :class="isActivated ? 'activated': ''" @click="activate">
    <div ref="containerEl" class="wave" :class="filled? 'show': ''">
    </div>
    <div class="mic" :class="isRecording? 'show': ''" ref="micEl"></div>

    <div v-if="!filled" class="placeholder-wrapper">
      <template v-if="!useRecord">
        <button class="button outlined" @click="loadFile">Choose an audio file</button>
      </template>
      <template v-else>

        <button class="button outlined" @click="startRecording">
          {{ isRecording ? 'Stop recording' : 'Start recording' }}
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.surfer {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  position: relative;
  &.activated {
    .wave, .mic {
      box-shadow: 0 0 20px rgba(114, 177, 255, 0.2);
    }
  }
  .wave, .mic {
    position: absolute;
    top: 1rem;
    left: 1rem;
    right: 1rem;
    bottom: 1rem;
    opacity: 0;
    border-radius: 2px;
    box-shadow: 0 0 10px rgba(114, 177, 255, 0.2);
    &.show {
      opacity: 1;
    }
  }
}
.placeholder-wrapper {
  position: relative;
  z-index: 10;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
