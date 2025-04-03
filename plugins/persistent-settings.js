import { useUserPreferences } from '@/stores/userPreferences';

export default defineNuxtPlugin((nuxtApp) => {
  console.log('[Plugin] persistent-settings plugin loaded');

  // Wait for client side only
  if (process.client) {
    // Initialize preferences from localStorage on app start
    nuxtApp.hook('app:mounted', () => {
      console.log('[Plugin] app:mounted hook fired');
      try {
        const userPreferencesStore = useUserPreferences();
        userPreferencesStore.initPreferences();
        console.log('[Plugin] Preferences loaded:', {
          theme: userPreferencesStore.theme,
          language: userPreferencesStore.language
        });
      } catch (error) {
        console.error('[Plugin] Error initializing preferences:', error);
      }
    });
  }
  
  return {
    provide: {
      // Expose methods for other components to use
      userPreferences: () => {
        console.log('[Plugin] userPreferences helper accessed');
        const userPreferencesStore = useUserPreferences();
        return {
          setTheme: (theme) => {
            console.log('[Plugin] Setting theme to:', theme);
            userPreferencesStore.setTheme(theme);
          },
          setLanguage: (lang) => { 
            console.log('[Plugin] Setting language to:', lang);
            userPreferencesStore.setLanguage(lang);
          },
          getCurrentTheme: () => userPreferencesStore.theme,
          getCurrentLanguage: () => userPreferencesStore.language
        };
      }
    }
  };
}); 