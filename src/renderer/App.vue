<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import Surfer from './components/Surfer.vue'
import Controller from './components/Controller.vue'
import { useAppStore } from './stores'
const appStore = useAppStore()
const { isPlaying, activatedSurferName } = storeToRefs(appStore)

function handleKeyUp(e: KeyboardEvent) {
  if (e.key === ' ') {
    if (activatedSurferName.value !== '') {
      isPlaying.value = !isPlaying.value
    }
  }
}

onMounted(() => {
  window.addEventListener("keyup", handleKeyUp);
})

</script>

<template>
  <div class="top">
    <h1>
      Wavesurfer
    </h1>
  </div>
  <div class="content">
    <div class="surfer-wrapper">
      <Surfer name="main" />
    </div>
    <div class="surfer-wrapper">
      <Surfer :use-record="true" name="record"/>
    </div>
    <div class="subtitles-wrapper">
    </div>
  </div>
  <Controller />
</template>

<style scoped lang="scss">
.top {
  height: 44px;
  background: var(--vt-c-white-soft);
  display: flex;
  justify-content: center;
  align-items: center;
  h1 {
    font-size: 1rem;
  }
}
.content {
  flex: 1;
}
.surfer-wrapper {
  height: 30%;
  border-bottom: 1px solid var(--vt-c-white-soft);
}
.subtitles-wrapper {
  height: 50%;
  border-bottom: 1px solid var(--vt-c-white-soft);
}
</style>
