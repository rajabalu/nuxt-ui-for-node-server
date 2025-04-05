import { watch } from 'vue';
import { useRTL } from '~/composables/useRTL';

/**
 * RTL Support Plugin
 * Adds RTL utilities to the Nuxt app instance and makes it available throughout the application
 * Runs after core plugins to ensure i18n and Vuetify are initialized
 */
export default defineNuxtPlugin({
  name: 'rtl-support',
  enforce: 'post',
  setup(nuxtApp) {
    // Create the RTL utilities
    const rtlUtils = useRTL();
    
    // Inject RTL utilities into the Nuxt app
    nuxtApp.provide('rtl', rtlUtils);
    
    // Add a global mixin to make RTL utilities available in all components
    nuxtApp.vueApp.mixin({
      computed: {
        $rtl() {
          return rtlUtils;
        }
      }
    });
    
    // Apply RTL-specific CSS classes to the document when in RTL mode
    if (typeof window !== 'undefined') {
      watch(() => rtlUtils.isRTL.value, (isRTL) => {
        if (isRTL) {
          document.documentElement.classList.add('rtl-mode');
          document.documentElement.dir = 'rtl';
        } else {
          document.documentElement.classList.remove('rtl-mode');
          document.documentElement.dir = 'ltr';
        }
      }, { immediate: true });
    }
    
    // Return the RTL utilities (available via useNuxtApp().$rtl)
    return {
      provide: {
        rtl: rtlUtils
      }
    };
  }
}); 