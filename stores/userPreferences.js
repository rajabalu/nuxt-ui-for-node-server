import { defineStore } from 'pinia';
import { useTheme } from 'vuetify';
import { themeConfig } from '@/composables/theme';

export const useUserPreferences = defineStore('userPreferences', {
  state: () => ({
    language: null,
    theme: null,
    initialized: false,
    syncStatus: null
  }),

  actions: {
    setLanguage(lang) {
      console.log('[userPreferences] Setting language:', lang);
      if (!lang) {
        console.warn('[userPreferences] Attempted to set null language, skipping');
        return;
      }
      
      this.language = lang;
      
      // Save to localStorage
      if (process.client) {
        try {
          // Save in two locations for backward compatibility
          localStorage.setItem('user_language', lang);
          localStorage.setItem('app_language', lang); // For compatibility with older code
          console.log('[userPreferences] Language saved to localStorage');
        } catch (error) {
          console.error('[userPreferences] Error saving language to localStorage:', error);
        }
      }
    },
    
    setTheme(theme) {
      console.log('[userPreferences] Setting theme:', theme);
      if (!theme) {
        console.warn('[userPreferences] Attempted to set null theme, skipping');
        return;
      }
      
      this.theme = theme;
      
      // Save to localStorage
      if (process.client) {
        try {
          // Save in two locations for backward compatibility
          localStorage.setItem('user_theme', theme);
          localStorage.setItem('app_theme', theme); // For compatibility with older code
          console.log('[userPreferences] Theme saved to localStorage');
        } catch (error) {
          console.error('[userPreferences] Error saving theme to localStorage:', error);
        }
      }
    },
    
    // Initialize preferences from localStorage
    initPreferences() {
      if (this.initialized) {
        console.log('[userPreferences] Already initialized, skipping');
        return;
      }
      
      console.log('[userPreferences] Initializing preferences from localStorage');
      if (process.client) {
        try {
          // Get language from localStorage (check both keys)
          let savedLanguage = localStorage.getItem('user_language');
          if (!savedLanguage) {
            savedLanguage = localStorage.getItem('app_language');
          }
          
          console.log('[userPreferences] Found language in localStorage:', savedLanguage);
          if (savedLanguage) {
            this.language = savedLanguage;
          } else {
            // Default to English if no saved preference
            this.language = 'en';
            console.log('[userPreferences] No language found, defaulting to:', this.language);
          }
          
          // Get theme from localStorage (check both keys)
          let savedTheme = localStorage.getItem('user_theme');
          if (!savedTheme) {
            savedTheme = localStorage.getItem('app_theme');
          }
          
          console.log('[userPreferences] Found theme in localStorage:', savedTheme);
          if (savedTheme) {
            this.theme = savedTheme;
          } else {
            // Default to light theme if no saved preference
            this.theme = 'light';
            console.log('[userPreferences] No theme found, defaulting to:', this.theme);
          }
          
          console.log('[userPreferences] Preferences initialized:', {
            language: this.language,
            theme: this.theme
          });
          
          this.initialized = true;
        } catch (error) {
          console.error('[userPreferences] Error loading preferences from localStorage:', error);
          
          // Set defaults in case of error
          this.language = 'en';
          this.theme = 'light';
        }
      } else {
        console.log('[userPreferences] Not in client, skipping localStorage initialization');
      }
    },
    
    // For server API integration
    async syncWithServer() {
      console.log('[userPreferences] Syncing preferences with server');
      
      const nuxtApp = useNuxtApp();
      const api = nuxtApp.$api;
      
      if (!api) {
        console.error('[userPreferences] API not available');
        this.syncStatus = 'error';
        return { success: false, error: 'API not available' };
      }
      
      try {
        // Send current preferences to server
        const response = await api.patch('user-preferences', {
          theme: this.theme,
          language: this.language
        });
        
        if (response.success) {
          console.log('[userPreferences] Successfully synced with server');
          this.syncStatus = 'success';
          return { success: true };
        } else {
          console.error('[userPreferences] Failed to sync with server:', response.error);
          this.syncStatus = 'error';
          return { success: false, error: response.error };
        }
      } catch (error) {
        console.error('[userPreferences] Error syncing with server:', error);
        this.syncStatus = 'error';
        return { success: false, error: 'An unexpected error occurred' };
      }
    },
    
    // Fetch user preferences from the server after login
    async fetchFromServer() {
      console.log('[userPreferences] Fetching preferences from server');
      
      const nuxtApp = useNuxtApp();
      const api = nuxtApp.$api;
      
      if (!api) {
        console.error('[userPreferences] API not available for fetching preferences');
        return { success: false, error: 'API not available' };
      }
      
      try {
        // Get user preferences from server
        const response = await api.get('user-preferences');
        
        if (response.success && response.data) {
          console.log('[userPreferences] Received preferences from server:', response.data);
          
          const serverTheme = response.data.theme;
          const serverLanguage = response.data.language;
          
          // Compare server values with local values
          const localTheme = this.theme;
          const localLanguage = this.language;
          
          console.log('[userPreferences] Comparing - Local:', { theme: localTheme, language: localLanguage }, 
                     'Server:', { theme: serverTheme, language: serverLanguage });
          
          // If local values exist and differ from server, update server with local values
          // This happens if user changed preferences before logging in
          if (localTheme && localTheme !== serverTheme) {
            console.log('[userPreferences] Local theme differs from server, updating server');
            await this.syncWithServer();
          } else if (serverTheme) {
            // If no local preference or server preference is different, update local with server value
            console.log('[userPreferences] Updating local theme from server');
            this.setTheme(serverTheme);
          }
          
          if (localLanguage && localLanguage !== serverLanguage) {
            console.log('[userPreferences] Local language differs from server, updating server');
            await this.syncWithServer();
          } else if (serverLanguage) {
            // If no local preference or server preference is different, update local with server value
            console.log('[userPreferences] Updating local language from server');
            this.setLanguage(serverLanguage);
          }
          
          return { success: true, data: response.data };
        } else {
          console.error('[userPreferences] Failed to fetch preferences from server:', response.error);
          return { success: false, error: response.error || 'Failed to fetch preferences' };
        }
      } catch (error) {
        console.error('[userPreferences] Error fetching preferences from server:', error);
        return { success: false, error: 'An unexpected error occurred' };
      }
    }
  }
}); 