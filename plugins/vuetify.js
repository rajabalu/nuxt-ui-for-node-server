import { createVuetify } from "vuetify";
import { VBtn } from "vuetify/components";
import { watch } from "vue";
import { useRTL } from "@/composables/useRTL";

export default defineNuxtPlugin((app) => {
  // Get the RTL utilities
  const rtlUtils = useRTL();
  
  const vuetify = createVuetify({
    ssr: true,
    aliases: {
      IconBtn: VBtn,
    },
    defaults,
    theme,
    icons,
    rtl: {
      // Start with initial RTL status if available
      rtlClasses: ['rtl'], // Use the same class name for consistency
      defaultRtl: rtlUtils.isRTL.value
    },
  });

  // Watch for RTL changes and update Vuetify's RTL state
  watch(() => rtlUtils.isRTL.value, (isRTL) => {
    vuetify.display.rtl = isRTL;
    // This will ensure Vuetify components update their RTL state
  });

  app.vueApp.use(vuetify);
});
