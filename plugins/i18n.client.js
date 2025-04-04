import { forceLoadMessages, applyRTLDirection, ensureMessageStructure, preloadAllLocales, getLocalizedPath } from '@/utils/i18n-helpers';

/**
 * i18n client-side initialization plugin
 * Loads the user's language preference from localStorage and applies it
 * before the application fully renders
 */
export default defineNuxtPlugin(async (nuxtApp) => {
  if (process.client && nuxtApp.$i18n) {
    // Load language preference from localStorage
    try {
      // Check both localStorage keys for backward compatibility
      let savedLanguage = localStorage.getItem('user_language');
      if (!savedLanguage) {
        savedLanguage = localStorage.getItem('app_language');
      }
      
      if (savedLanguage) {
        // Force load messages for the saved language
        await forceLoadMessages(nuxtApp.$i18n, savedLanguage);
        
        // Set the locale after messages are loaded
        nuxtApp.$i18n.locale.value = savedLanguage;
        
        // Apply RTL direction if needed
        applyRTLDirection(savedLanguage);
        
        // Handle URL localization
        const router = useRouter();
        const route = router.currentRoute.value;
        const currentPath = route.fullPath;
        
        // For non-English languages, ensure URL has the correct locale prefix
        if (savedLanguage !== 'en') {
          // Check different URL patterns to avoid duplicate locale prefixes
          const hasCorrectLocalePrefix = currentPath.startsWith(`/${savedLanguage}`);
          const localePattern = /^\/([a-z]{2})(?:\/|$)/;
          const localeMatch = currentPath.match(localePattern);
          const existingLocale = localeMatch ? localeMatch[1] : null;
          const isRootPath = currentPath === '/';
          
          if (isRootPath) {
            // Root path just needs the language prefix
            const targetPath = `/${savedLanguage}`;
            
            // Wait for Vue router to be ready
            setTimeout(() => {
              router.push(targetPath);
            }, 10);
          } else if (!hasCorrectLocalePrefix) {
            // Either has wrong locale prefix or none at all
            let targetPath;
            if (existingLocale) {
              // Replace wrong prefix
              const pathWithoutPrefix = currentPath.replace(localePattern, '/');
              targetPath = `/${savedLanguage}${pathWithoutPrefix.substring(1)}`;
            } else {
              // Add prefix
              targetPath = getLocalizedPath(currentPath, savedLanguage);
            }
            
            // Wait for Vue router to be ready
            setTimeout(() => {
              router.push(targetPath);
            }, 10);
          }
        } else if (savedLanguage === 'en') {
          // For English, remove any locale prefix
          const hasLocalePrefix = /^\/[a-z]{2}\//.test(currentPath);
          
          if (hasLocalePrefix) {
            const targetPath = currentPath.replace(/^\/[a-z]{2}\//, '/');
            
            // Wait for Vue router to be ready
            setTimeout(() => {
              router.push(targetPath);
            }, 10);
          }
        }
      } else {
        // Still ensure proper message structure for the default locale
        const defaultLocale = nuxtApp.$i18n.locale.value;
        if (defaultLocale) {
          // Force load messages for default locale too
          await forceLoadMessages(nuxtApp.$i18n, defaultLocale);
        }
      }
      
      // Register a helper function on the nuxtApp for other components to use
      nuxtApp.provide('ensureI18nMessages', async (locale) => {
        await forceLoadMessages(nuxtApp.$i18n, locale);
      });
      
    } catch (error) {
      console.error('[i18n] Error in i18n plugin:', error);
    }
  }
}); 