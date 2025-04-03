import { defineStore } from 'pinia';
import { useTheme } from 'vuetify';
import { themeConfig } from '@/composables/theme';

export const useUserPreferences = defineStore('userPreferences', {
  state: () => ({
    language: null,
    theme: null,
    initialized: false
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
    
    // For future API integration
    async syncWithServer() {
      console.log('[userPreferences] Server sync would go here in the future');
    }
  }
}); 