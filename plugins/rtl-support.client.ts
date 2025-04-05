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
 * Adds RTL utilities to the Nuxt app instance and makes it available throughout the application
 * Runs last after all other plugins to ensure i18n and Vuetify are initialized
 */
export default defineNuxtPlugin({
  name: 'rtl-support',
  enforce: 'post',
  setup(nuxtApp) {
    console.log('[rtl-support] Plugin initializing');
    
    // Cast nuxtApp to include the _plugins property
    const app = nuxtApp as unknown as NuxtAppWithPlugins;
    
    // Skip if RTL utilities are already provided - check in different ways
    if (app.hasOwnProperty('$rtl') || app._plugins?.some(p => p.name === 'rtl-support' && p._called)) {
      console.log('[rtl-support] RTL utilities already provided, skipping initialization');
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
      
      // Check if the app already has a mixin with $rtl
      let hasMixin = false;
      if (app.vueApp._context && 
          app.vueApp._context.mixins && 
          app.vueApp._context.mixins.length) {
        hasMixin = app.vueApp._context.mixins.some((mixin: any) => 
          mixin.computed && mixin.computed.$rtl);
        
        if (hasMixin) {
          console.log('[rtl-support] RTL mixin already exists');
        }
      }
      
      // Add a global mixin only if it doesn't exist yet - but defer it
      if (!hasMixin) {
        console.log('[rtl-support] Adding RTL mixin to Vue app');
        // Use setTimeout to defer mixin addition
        setTimeout(() => {
          app.vueApp.mixin({
            computed: {
              $rtl() {
                return rtlUtils;
              }
            }
          });
        }, 0);
      }
      
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
      
      // Return the RTL utilities but don't use provide - just return it for others to use
      console.log('[rtl-support] Plugin initialization complete');
      
      // Return an empty object instead of providing rtl
      return {
        provide: {
          // Empty to prevent property redefinition error
        }
      };
    } catch (err) {
      console.warn('[rtl-support] Could not initialize RTL utilities', err);
      return {};
    }
  }
}); 