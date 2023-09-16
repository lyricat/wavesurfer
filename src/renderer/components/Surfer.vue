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
const { isPlaying, loopRegion, playRegion } = storeToRefs(appStore)
// const pitchWorker = new Worker(path.resolve(__dirname, 'workers', 'pitch-worker.js'));

let ws:any = null
let activeRegion:any = null;
const constainerEl = ref(null)
const wsPeaks = ref(null)

watch(() => isPlaying.value, (v) => {
  if (v) {
    ws.play()
  } else {
    ws.pause()
  }
})

watch(() => wsPeaks.value, (v) => {
  updatePeaks()
})

function createWs(audio: HTMLAudioElement) {
  const _ws = WaveSurfer.create({
    container: constainerEl.value as any,
    waveColor: 'rgba(200, 200, 200, 0.5)',
    progressColor: 'rgba(100, 100, 100, 0.5)',
    minPxPerSec: 100,
    hideScrollbar: true,
    autoCenter: false,
    media: audio
  })

  // Initialize the Regions plugin
  const wsRegions = _ws.registerPlugin(RegionsPlugin.create())
  const random = (min:number, max:number) => Math.random() * (max - min) + min
  const randomColor = () => `rgba(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)}, 0.1)`
  wsRegions.enableDragSelection({
    color: 'rgba(255, 0, 0, 0.1)',
  })

  _ws.once('decode', () => {
    // const slider = document.querySelector('input[type="range"]')
    // slider.addEventListener('input', (e) => {
    //   const minPxPerSec = e.target.valueAsNumber
    //   _ws.zoom(minPxPerSec)
    // })
    wsPeaks.value = ws.getDecodedData().getChannelData(0)
    // pitchWorker.postMessage({ peaks, sampleRate: ws.options.sampleRate })
    console.log('decoded!')
  })

  // Initialize the Timeline plugin
  // _ws.registerPlugin(TimelinePlugin.create())

  _ws.on('interaction', () => {
    _ws.playPause()
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
    activeRegion = region
    if (region.play) {
      _ws.playPause()
    } else {
      region.play()
      region.setOptions({ color: randomColor() })
    }
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
    ws = createWs(audio);
  };
}

onMounted(() => {
})
</script>

<template>
  <div class="card" ref="constainerEl">
  </div>
  <div>
    <button class="button plain" @click="loadFile">Tap to choose an audio file</button>
  </div>
</template>

<style scoped>
</style>
