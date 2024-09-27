// src/composables/useIsMobile.js
import { computed } from 'vue';
import { useDisplay } from 'vuetify';

export function useIsMobile() {
  const { smAndDown } = useDisplay();
  return computed(() => smAndDown.value);
}
