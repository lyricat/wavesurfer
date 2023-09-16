import { ref, computed, type Ref } from 'vue'
import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', () => {
  const isPlaying = ref(false);
  const playRegion = ref(false);
  const loopRegion = ref(false);
  const activatedSurferName = ref('');

  const popupMenuCloseTrigger = ref(0);

  function closePopupMenu() {
    popupMenuCloseTrigger.value += 1;
  }

  return {
    isPlaying,
    playRegion,
    loopRegion,
    activatedSurferName,

    popupMenuCloseTrigger,
    closePopupMenu,
  }
})
