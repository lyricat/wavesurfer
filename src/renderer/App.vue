<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import Surfer from './components/Surfer.vue'
import Controller from './components/Controller.vue'

</script>

<template>
  <div class="top">
    <h1>
      Wavesurfer
    </h1>
  </div>
  <div class="content">
    <div class="surfer-wrapper">
      <Surfer />
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
  height: 50%;
  border-bottom: 1px solid var(--vt-c-white-soft);
}
.subtitles-wrapper {
  height: 50%;
  border-bottom: 1px solid var(--vt-c-white-soft);
}
</style>
