import { watch } from 'vue';
import { useRTL } from '~/composables/useRTL';

// Define a type for the plugin with a _plugins property
interface NuxtAppWithPlugins {
  hasOwnProperty: (key: string) => boolean;
  $i18n?: any;
  vueApp: any;
  _plugins?: Array<{ name: string; _called?: boolean }>;
}

/**
 * RTL Support Plugin
 * This plugin sets up RTL-related functionality for the application
 * It only applies document classes and sets up a Vue mixin - it does not provide $rtl
 */
export default defineNuxtPlugin({
  name: 'rtl-support',
  enforce: 'post',
  setup(nuxtApp) {
    // Cast nuxtApp to include the _plugins property
    const app = nuxtApp as unknown as NuxtAppWithPlugins;
    
    // Skip if plugin already ran to prevent duplicate initialization
    if (app._plugins?.some(p => p.name === 'rtl-support' && p._called)) {
      return {};
    }

    // i18n is accessed, but we don't need to log its status
    const i18n = app.$i18n;

    try {
      // Create the RTL utilities
      const rtlUtils = useRTL();
      
      // Add a global mixin - deferred to avoid Vue setup context issues
      // Use setTimeout to defer mixin addition
      setTimeout(() => {
        try {
          app.vueApp.mixin({
            computed: {
              $rtl() {
                // Always create a fresh instance when accessed from components
                return useRTL();
              }
            }
          });
        } catch (err) {
          console.warn('[rtl-support] Error adding RTL mixin:', err);
        }
      }, 0);
      
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
      
      // Return empty object - don't provide anything
      return {};
    } catch (err) {
      console.warn('[rtl-support] Could not initialize RTL utilities', err);
      return {};
    }
  }
}); 