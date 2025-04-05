import { watch } from 'vue';
import { useRTL } from '~/composables/useRTL';
import { applyRTLToDocument } from '~/utils/rtl-config';

/**
 * RTL Support Plugin
 * This plugin sets up RTL-related functionality for the application
 * It applies document classes, sets up a Vue mixin, and registers the rtl-aware directive
 */
export default defineNuxtPlugin({
  name: 'rtl-support',
  enforce: 'post',
  setup(nuxtApp) {
    // Skip if plugin already ran to prevent duplicate initialization
    if (nuxtApp._plugins?.some(p => p.name === 'rtl-support' && p._called)) {
      return {};
    }

    // i18n is accessed, but we don't need to log its status
    const i18n = nuxtApp.$i18n;

    try {
      // Create the RTL utilities
      const rtlUtils = useRTL();
      
      // Register the rtl-aware directive
      nuxtApp.vueApp.directive('rtl-aware', {
        mounted(el, binding, vnode) {
          // Get the RTL status from the component
          const component = vnode.component;
          const isRtl = component?.ctx?.$rtl?.isRTL?.value || 
                      document.documentElement.dir === 'rtl';
          
          // Apply RTL styling directly to the element
          if (isRtl) {
            el.setAttribute('dir', 'rtl');
            el.classList.add('rtl');
          }
          
          // Watch for changes in RTL status
          if (component?.ctx?.$watch) {
            component.ctx.$watch('$rtl.isRTL.value', (newValue) => {
              if (newValue) {
                el.setAttribute('dir', 'rtl');
                el.classList.add('rtl');
              } else {
                el.setAttribute('dir', 'ltr');
                el.classList.remove('rtl');
              }
            });
          }
        }
      });
      
      // Add a global mixin for RTL access in all components
      nuxtApp.hook('app:mounted', () => {
        try {
          nuxtApp.vueApp.mixin({
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
      });
      
      // Apply RTL-specific CSS classes to the document when in RTL mode
      if (typeof window !== 'undefined') {
        // Initial application based on current locale
        if (i18n && i18n.locale && i18n.locale.value) {
          applyRTLToDocument(i18n.locale.value);
        }
        
        // Watch for RTL changes and apply immediately
        watch(() => rtlUtils.isRTL.value, (isRTL) => {
          if (isRTL) {
            document.documentElement.classList.add('rtl');
            document.documentElement.dir = 'rtl';
            document.body.classList.add('rtl');
            document.body.dir = 'rtl';
            // Force Vuetify to recognize RTL
            document.documentElement.setAttribute('data-app-rtl', 'true');
          } else {
            document.documentElement.classList.remove('rtl');
            document.documentElement.dir = 'ltr';
            document.body.classList.remove('rtl');
            document.body.dir = 'ltr';
            document.documentElement.removeAttribute('data-app-rtl');
          }
        }, { immediate: true });
      }
      
      return {};
    } catch (err) {
      console.warn('[rtl-support] Could not initialize RTL utilities', err);
      return {};
    }
  }
}); 