import { useUserPreferences } from '@/stores/userPreferences';
import { getLocalizedPath } from '@/utils/i18n-helpers';

/**
 * This plugin runs only on the client and loads user preferences
 * immediately before any Vue components are mounted.
 * 
 * The .client.js suffix ensures it only runs in the browser.
 */
export default defineNuxtPlugin((nuxtApp) => {
  console.log('[initial-load] Client plugin executed');
  // Only run once on initial page load
  if (typeof window !== 'undefined') {
    console.log('[initial-load] Running in browser');
    
    // Check localStorage availability
    try {
      localStorage.setItem('localStorage_test', 'test');
      localStorage.removeItem('localStorage_test');
      console.log('[initial-load] localStorage is available');
    } catch (e) {
      console.error('[initial-load] localStorage is not available:', e);
    }
    
    try {
      // Initialize userPreferences store
      const userPreferencesStore = useUserPreferences();
      console.log('[initial-load] User preferences store loaded');
      
      // Check if we have saved preferences in localStorage
      const savedTheme = localStorage.getItem('user_theme');
      const savedLanguage = localStorage.getItem('user_language');
      
      console.log('[initial-load] Saved preferences in localStorage:', {
        theme: savedTheme,
        language: savedLanguage
      });
      
      // Initialize preferences
      userPreferencesStore.initPreferences();
      
      console.log('[initial-load] User preferences initialized from localStorage:', {
        theme: userPreferencesStore.theme,
        language: userPreferencesStore.language
      });
      
      // Handle URL localization for public pages
      const router = useRouter();
      const route = router.currentRoute.value;
      const currentPath = route.fullPath;
      const language = userPreferencesStore.language;
      
      if (language && language !== 'en') {
        // Check if we're at the root (/) or a path without locale prefix
        const isHome = currentPath === '/';
        const hasLocalePrefix = /^\/[a-z]{2}\//.test(currentPath);
        
        if ((isHome || !hasLocalePrefix) && !nuxtApp.$auth?.isAuthenticated) {
          console.log(`[initial-load] Redirecting to localized path for ${language}`);
          
          // We're on a public page and need to redirect to localized version
          let targetPath;
          if (isHome) {
            // For home page, simply add the language prefix
            targetPath = `/${language}`;
          } else {
            // For other pages, use helper to get localized path
            targetPath = getLocalizedPath(currentPath, language);
          }
          
          console.log(`[initial-load] Redirecting from ${currentPath} to ${targetPath}`);
          
          // Use next tick to ensure the redirect happens after initial load
          setTimeout(() => {
            // Use router.push to avoid full page reload
            router.push(targetPath);
          }, 0);
        }
      }
      
      // The actual application of preferences will be done in components
      // via the useUserPreferencesHelper composable
    } catch (error) {
      console.error('[initial-load] Error during initial load of preferences:', error);
    }
  } else {
    console.log('[initial-load] Not running in browser, skipping initialization');
  }
}); 