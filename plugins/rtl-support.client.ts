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
    console.log('[rtl-support] Plugin initializing');
    
    // Cast nuxtApp to include the _plugins property
    const app = nuxtApp as unknown as NuxtAppWithPlugins;
    
    // Skip if plugin already ran to prevent duplicate initialization
    if (app._plugins?.some(p => p.name === 'rtl-support' && p._called)) {
      console.log('[rtl-support] Plugin already ran, skipping duplicate initialization');
      return {};
    }

    // Wait for i18n to be ready
    if (!app.$i18n) {
      console.log('[rtl-support] i18n not available yet, plugin may run before it is ready');
      // We continue anyway as useRTL has fallback mechanism
    } else {
      // Type assertion to access i18n properties
      const i18n = app.$i18n as { locale: { value: string } };
      console.log(`[rtl-support] i18n available with locale: ${i18n.locale.value}`);
    }

    try {
      // Create the RTL utilities
      const rtlUtils = useRTL();
      console.log('[rtl-support] RTL utilities created');
      
      // Add a global mixin - deferred to avoid Vue setup context issues
      console.log('[rtl-support] Setting up RTL mixin');
      
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
          console.log('[rtl-support] RTL mixin added successfully');
        } catch (err) {
          console.warn('[rtl-support] Error adding RTL mixin:', err);
        }
      }, 0);
      
      // Apply RTL-specific CSS classes to the document when in RTL mode
      if (typeof window !== 'undefined') {
        console.log('[rtl-support] Setting up document class watcher');
        watch(() => rtlUtils.isRTL.value, (isRTL) => {
          console.log(`[rtl-support] RTL state changed to: ${isRTL}`);
          if (isRTL) {
            document.documentElement.classList.add('rtl-mode');
            document.documentElement.dir = 'rtl';
          } else {
            document.documentElement.classList.remove('rtl-mode');
            document.documentElement.dir = 'ltr';
          }
        }, { immediate: true });
      }
      
      console.log('[rtl-support] Plugin initialization complete');
      
      // Return empty object - don't provide anything
      return {};
    } catch (err) {
      console.warn('[rtl-support] Could not initialize RTL utilities', err);
      return {};
    }
  }
}); 