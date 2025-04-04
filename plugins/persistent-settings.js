import { useUserPreferences } from '@/stores/userPreferences';

export default defineNuxtPlugin((nuxtApp) => {
  // Wait for client side only
  if (process.client) {
    // Initialize preferences from localStorage on app start
    nuxtApp.hook('app:mounted', () => {
      try {
        const userPreferencesStore = useUserPreferences();
        userPreferencesStore.initPreferences();
      } catch (error) {
        console.error('[Plugin] Error initializing preferences:', error);
      }
    });
  }
  
  return {
    provide: {
      // Expose methods for other components to use
      userPreferences: () => {
        const userPreferencesStore = useUserPreferences();
        return {
          setTheme: (theme) => {
            userPreferencesStore.setTheme(theme);
          },
          setLanguage: (lang) => { 
            userPreferencesStore.setLanguage(lang);
          },
          getCurrentTheme: () => userPreferencesStore.theme,
          getCurrentLanguage: () => userPreferencesStore.language
        };
      }
    }
  };
}); 