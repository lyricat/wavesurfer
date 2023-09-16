<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { defineProps, onMounted, ref } from 'vue'
import { useAppStore } from '../stores'
const appStore = useAppStore()
const { isPlaying, loopRegion, playRegion } = storeToRefs(appStore)
const _loopRegion = ref(false)
const _playRegion = ref(false)

function togglePlayStatus() {
  isPlaying.value = !isPlaying.value
}

function toggleLoopRegion() {
  loopRegion.value = _loopRegion.value
}

function togglePlayRegion() {
  playRegion.value = _playRegion.value
}
</script>

<template>
  <div class="controller">
    <div class="buttons mb-4">
      <button class="button outlined">
        Rewind
      </button>
      <button class="button primary" @click="togglePlayStatus">
        {{ isPlaying ? 'Pause' : 'Play' }}
      </button>
      <button class="button outlined">
        Forward
      </button>
    </div>
    <div class="spacer" />
    <div class="options grid gap-4 grid-cols-2 md-grid-cols-4">
      <div class="cell">
        <div class="cell-left">
          Loop region
        </div>
        <div class="cell-right">
          <QSwitch v-model="_loopRegion" @change="toggleLoopRegion"/>
        </div>
      </div>
      <div class="cell">
        <div class="cell-left">
          Play region
        </div>
        <div class="cell-right">
          <QSwitch v-model="_playRegion" @change="togglePlayRegion"/>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped lang="scss">

.controller {
  height: 120px;
  padding: 1rem;
  background: var(--vt-c-white-soft);
  display: flex;
  flex-direction: column;
  button {
    margin: 0 8px;
  }
  .buttons {
    display: flex;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}
.options {
  margin-bottom: 1rem;
  .cell {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: center;
    .cell-left {
      margin-right: 0.5rem;
    }
  }
}
</style>
