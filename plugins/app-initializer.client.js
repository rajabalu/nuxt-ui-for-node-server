import { useUserPreferences } from '@/stores/userPreferences';
import { forceLoadMessages, applyRTLDirection, ensureMessageStructure, getLocalizedPath } from '@/utils/i18n-helpers';
import { useTheme } from 'vuetify';

/**
 * Unified application initialization plugin that runs client-side
 * Handles both user preferences and i18n initialization in a single sequence
 */
export default defineNuxtPlugin(async (nuxtApp) => {
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
    
    // Get Vuetify theme instance
    const vuetifyTheme = useTheme();
    
    // 1. Initialize user preferences store and load saved preferences
    const userPreferencesStore = useUserPreferences();
    userPreferencesStore.initPreferences();
    
    // 2. Apply theme settings from preferences
    if (userPreferencesStore.theme) {
      // Apply theme to Vuetify
      vuetifyTheme.global.name.value = userPreferencesStore.theme;
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
    
  } catch (error) {
    console.error('[app-initializer] Error during application initialization:', error);
  }
}); 