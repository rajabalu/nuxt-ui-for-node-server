import { defineStore } from 'pinia';
import { useTheme } from 'vuetify';
import { themeConfig } from '@/composables/theme';
import { useRouter, useRoute } from 'vue-router';
import { getLocalizedPath } from '@/utils/i18n-helpers';

export const useUserPreferences = defineStore('userPreferences', {
  state: () => ({
    language: null,
    theme: null,
    initialized: false,
    isAuthenticated: false
  }),

  actions: {
    setAuthenticated(status) {
      this.isAuthenticated = status;
    },

    setLanguage(lang) {
      console.log('[userPreferences] Setting language:', lang);
      if (!lang) {
        console.warn('[userPreferences] Attempted to set null language, skipping');
        return;
      }
      
      this.language = lang;
      
      // Save to localStorage only if not authenticated
      if (process.client && !this.isAuthenticated) {
        try {
          // Save in two locations for backward compatibility
          localStorage.setItem('user_language', lang);
          localStorage.setItem('app_language', lang); // For compatibility with older code
          console.log('[userPreferences] Language saved to localStorage (not authenticated)');
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
      
      // Save to localStorage only if not authenticated
      if (process.client && !this.isAuthenticated) {
        try {
          // Save in two locations for backward compatibility
          localStorage.setItem('user_theme', theme);
          localStorage.setItem('app_theme', theme); // For compatibility with older code
          console.log('[userPreferences] Theme saved to localStorage (not authenticated)');
        } catch (error) {
          console.error('[userPreferences] Error saving theme to localStorage:', error);
        }
      }
    },
    
    // Initialize preferences from localStorage only when not authenticated
    initPreferences() {
      if (this.initialized) {
        console.log('[userPreferences] Already initialized, skipping');
        return;
      }
      
      // Skip loading from localStorage if already authenticated (server preferences will be used)
      if (this.isAuthenticated) {
        console.log('[userPreferences] User is authenticated, skipping localStorage initialization');
        this.initialized = true;
        return;
      }
      
      console.log('[userPreferences] Initializing preferences from localStorage (not authenticated)');
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
          
          // Mark as authenticated to prevent localStorage override
          this.setAuthenticated(true);
          
          const serverTheme = response.data.theme;
          const serverLanguage = response.data.language;
          
          // First apply theme since that doesn't require navigation
          if (serverTheme) {
            console.log('[userPreferences] Applying server theme to local:', serverTheme);
            this.theme = serverTheme; // Directly set theme without going through setTheme to avoid localStorage
          }
          
          // Set a flag in global window object to prevent feedback loops
          if (process.client) {
            window.__isServerPreferenceChange = true;
            console.log('[userPreferences] Setting server preference change flag');
            
            // Reset the flag after a short delay
            setTimeout(() => {
              window.__isServerPreferenceChange = false;
              console.log('[userPreferences] Reset server preference change flag');
            }, 1000);
          }
          
          // Then handle language change - requiring route update
          if (serverLanguage) {
            console.log('[userPreferences] Server language is:', serverLanguage);
            
            // Apply language directly to store
            this.language = serverLanguage; // Directly set language without going through setLanguage to avoid localStorage
            
            // Get the current locale and route
            const router = useRouter();
            const route = useRoute();
            const i18n = nuxtApp.$i18n;
            const currentLocale = i18n.locale.value;
            
            // Only redirect if needed
            if (serverLanguage !== currentLocale) {
              console.log('[userPreferences] Need to update URL for language:', serverLanguage);
              
              // Force load messages for new locale
              try {
                const { forceLoadMessages } = await import('@/utils/i18n-helpers');
                await forceLoadMessages(i18n, serverLanguage);
              } catch (error) {
                console.error('[userPreferences] Error loading messages:', error);
              }
              
              // Get current path without locale prefix
              const currentPath = route.fullPath;
              // Remove locale prefix if it exists
              let pathWithoutLocale = currentPath;
              if (currentLocale !== 'en' && pathWithoutLocale.startsWith(`/${currentLocale}/`)) {
                pathWithoutLocale = pathWithoutLocale.substring(currentLocale.length + 1);
              } else if (currentLocale === 'en' && pathWithoutLocale.startsWith('/')) {
                // For English, just use the path as is
                pathWithoutLocale = currentPath;
              }
              
              // Use getLocalizedPath helper to create the new path
              const newPath = getLocalizedPath(pathWithoutLocale, serverLanguage);
              
              console.log(`[userPreferences] Updating route from ${currentPath} to ${newPath}`);
              
              // Update router with correct path
              if (process.client) {
                router.push(newPath);
              }
            }
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
    },
    
    // Reset authentication state on logout
    logout() {
      this.isAuthenticated = false;
      // We don't reset preferences here, just the authentication status
    }
  }
}); 