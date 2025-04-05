import { useUserPreferences } from '@/stores/userPreferences';
import { useAuthStore } from '@/stores/auth';
import { forceLoadMessages, applyRTLDirection, ensureMessageStructure, getLocalizedPath } from '@/utils/i18n-helpers';
import { getCurrentInstance, onMounted, defineComponent, createApp, nextTick } from 'vue';

/**
 * Unified application initialization plugin that runs client-side
 * Handles both user preferences and i18n initialization in a single sequence
 */
export default defineNuxtPlugin({
  name: 'app-initializer',
  enforce: 'post', // Run after Vuetify and i18n are initialized
  async setup(nuxtApp) {
    console.log('[app-initializer] Plugin initializing');
    if (typeof window === 'undefined') return;
    
    try {
      // Verify localStorage availability
      try {
        localStorage.setItem('localStorage_test', 'test');
        localStorage.removeItem('localStorage_test');
      } catch (e) {
        console.error('[app-initializer] localStorage is not available:', e);
        return;
      }
      
      // Initialize auth state early to prevent 404s before login
      const authStore = useAuthStore();
      console.log('[app-initializer] Initializing auth state');
      authStore.initAuth();
      console.log('[app-initializer] Auth initialized, authenticated:', authStore.isAuthenticated);
      
      // 1. Initialize user preferences store and load saved preferences
      const userPreferencesStore = useUserPreferences();
      userPreferencesStore.initPreferences();
      
      // 2. Apply theme settings from preferences - but defer the theme application
      const theme = userPreferencesStore.theme;
      if (theme) {
        // Instead of dynamic imports, create a global function to set the theme later
        window.__setVuetifyTheme = (themeName) => {
          try {
            // This function will be called later when Vuetify is ready
            const vuetifyApp = document.querySelector('.v-application');
            if (vuetifyApp && nuxtApp.vueApp) {
              console.log('[app-initializer] Setting Vuetify theme to:', themeName);
              
              // Create a small component to apply the theme
              const ThemeApplier = defineComponent({
                setup() {
                  // To be executed within the component lifecycle
                  onMounted(() => {
                    // Access Vuetify through the Nuxt app instance
                    if (nuxtApp.$vuetify && nuxtApp.$vuetify.theme) {
                      nuxtApp.$vuetify.theme.global.name.value = themeName;
                      console.log('[app-initializer] Theme set via $vuetify');
                    } else {
                      console.warn('[app-initializer] $vuetify not available on nuxtApp');
                    }
                    return () => null;
                  });
                }
              });
              
              // Add to DOM temporarily
              const div = document.createElement('div');
              div.style.display = 'none';
              document.body.appendChild(div);
              
              // Mount and unmount
              const app = createApp(ThemeApplier);
              const instance = app.mount(div);
              
              // Cleanup
              setTimeout(() => {
                app.unmount();
                document.body.removeChild(div);
              }, 100);
            } else {
              console.warn('[app-initializer] Vuetify app not found in DOM');
            }
          } catch (e) {
            console.error('[app-initializer] Error setting theme:', e);
          }
        };
        
        // Schedule theme application after next tick and after Vuetify is likely ready
        nextTick(() => {
          // Attempt after a short delay
          setTimeout(() => {
            if (window.__setVuetifyTheme) {
              window.__setVuetifyTheme(theme);
            }
          }, 500);
        });
      }
      
      // 3. Get the current language from user preferences
      const savedLanguage = userPreferencesStore.language || 'en';
      
      // 4. Initialize i18n with the saved language
      if (nuxtApp.$i18n) {
        // Force load messages for the saved language
        await forceLoadMessages(nuxtApp.$i18n, savedLanguage);
        
        // Set the locale after messages are loaded
        nuxtApp.$i18n.locale.value = savedLanguage;
        
        // Apply RTL direction if needed
        applyRTLDirection(savedLanguage);
        
        // Register a helper function for other components
        nuxtApp.provide('ensureI18nMessages', async (locale) => {
          await forceLoadMessages(nuxtApp.$i18n, locale);
        });
      }
      
      // 5. Handle URL localization based on language preference
      const router = useRouter();
      const route = router.currentRoute.value;
      const currentPath = route.fullPath;
      
      // Standardized URL localization logic
      const isRootPath = currentPath === '/';
      const localePattern = /^\/([a-z]{2})(?:\/|$)/;
      const localeMatch = currentPath.match(localePattern);
      const existingLocale = localeMatch ? localeMatch[1] : null;
      
      const needsLocalization = savedLanguage !== 'en';
      const hasCorrectLocale = existingLocale === savedLanguage;
      const missingLocale = needsLocalization && !existingLocale;
      const wrongLocale = needsLocalization && existingLocale && existingLocale !== savedLanguage;
      const unnecessaryLocale = !needsLocalization && existingLocale;
      
      // Only redirect if we need to change the URL
      if (missingLocale || wrongLocale || unnecessaryLocale) {
        let targetPath;
        
        if (missingLocale) {
          // Add the language prefix
          targetPath = getLocalizedPath(currentPath, savedLanguage);
        } else if (wrongLocale) {
          // Replace the wrong prefix
          const pathWithoutPrefix = currentPath.replace(localePattern, '/');
          targetPath = getLocalizedPath(pathWithoutPrefix, savedLanguage);
        } else if (unnecessaryLocale) {
          // Remove the prefix for English
          targetPath = currentPath.replace(localePattern, '/');
        }
        
        // Use setTimeout to ensure Vue router is ready
        setTimeout(() => {
          router.push(targetPath);
        }, 10);
      }
      
      console.log('[app-initializer] Initialization complete');
      
    } catch (error) {
      console.error('[app-initializer] Error during application initialization:', error);
    }
  }
}); 