import { useUserPreferences } from '@/stores/userPreferences';

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
      
      // The actual application of preferences will be done in components
      // via the useUserPreferencesHelper composable
    } catch (error) {
      console.error('[initial-load] Error during initial load of preferences:', error);
    }
  } else {
    console.log('[initial-load] Not running in browser, skipping initialization');
  }
}); 