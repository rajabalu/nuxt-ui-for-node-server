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
    isAuthenticated: false,
    additionalSettings: {} // New addition to store additional settings
  }),

  actions: {
    setAuthenticated(status) {
      this.isAuthenticated = status;
    },

    setLanguage(lang) {
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
        } catch (error) {
          console.error('[userPreferences] Error saving language to localStorage:', error);
        }
      }
    },
    
    setTheme(theme) {
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
        } catch (error) {
          console.error('[userPreferences] Error saving theme to localStorage:', error);
        }
      }
    },
    
    // New action to set or update additionalSettings
    setAdditionalSettings(settings) {
      if (!settings) {
        console.warn('[userPreferences] Attempted to set null additionalSettings, skipping');
        return;
      }
      
      // Merge with existing settings if any
      this.additionalSettings = {
        ...this.additionalSettings,
        ...settings
      };
      
      // Save to localStorage only if not authenticated
      if (process.client && !this.isAuthenticated) {
        try {
          localStorage.setItem('user_additional_settings', JSON.stringify(this.additionalSettings));
        } catch (error) {
          console.error('[userPreferences] Error saving additionalSettings to localStorage:', error);
        }
      }
    },
    
    // Set a single value in additionalSettings
    setAdditionalSetting(key, value) {
      if (!key) {
        console.warn('[userPreferences] Attempted to set null key in additionalSettings, skipping');
        return;
      }
      
      this.additionalSettings = {
        ...this.additionalSettings,
        [key]: value
      };
      
      // Save to localStorage only if not authenticated
      if (process.client && !this.isAuthenticated) {
        try {
          localStorage.setItem('user_additional_settings', JSON.stringify(this.additionalSettings));
        } catch (error) {
          console.error('[userPreferences] Error saving additionalSettings to localStorage:', error);
        }
      }
    },
    
    // Get a value from additionalSettings with optional default
    getAdditionalSetting(key, defaultValue = null) {
      return this.additionalSettings && key in this.additionalSettings
        ? this.additionalSettings[key]
        : defaultValue;
    },
    
    // Initialize preferences from localStorage only when not authenticated
    initPreferences() {
      if (this.initialized) {
        return;
      }
      
      // Skip loading from localStorage if already authenticated (server preferences will be used)
      if (this.isAuthenticated) {
        this.initialized = true;
        return;
      }
      
      if (process.client) {
        try {
          // Get language from localStorage (check both keys)
          let savedLanguage = localStorage.getItem('user_language');
          if (!savedLanguage) {
            savedLanguage = localStorage.getItem('app_language');
          }
          
          if (savedLanguage) {
            this.language = savedLanguage;
          } else {
            // Default to English if no saved preference
            this.language = 'en';
          }
          
          // Get theme from localStorage (check both keys)
          let savedTheme = localStorage.getItem('user_theme');
          if (!savedTheme) {
            savedTheme = localStorage.getItem('app_theme');
          }
          
          if (savedTheme) {
            this.theme = savedTheme;
          } else {
            // Default to light theme if no saved preference
            this.theme = 'light';
          }
          
          // Get additional settings from localStorage
          const savedAdditionalSettings = localStorage.getItem('user_additional_settings');
          if (savedAdditionalSettings) {
            try {
              this.additionalSettings = JSON.parse(savedAdditionalSettings);
            } catch (error) {
              console.error('[userPreferences] Error parsing additionalSettings from localStorage:', error);
              this.additionalSettings = {};
            }
          }
          
          this.initialized = true;
        } catch (error) {
          console.error('[userPreferences] Error loading preferences from localStorage:', error);
          
          // Set defaults in case of error
          this.language = 'en';
          this.theme = 'light';
          this.additionalSettings = {};
        }
      }
    },
    
    // Fetch user preferences from the server after login
    async fetchFromServer() {
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
          // Mark as authenticated to prevent localStorage override
          this.setAuthenticated(true);
          
          const serverTheme = response.data.theme;
          const serverLanguage = response.data.language;
          const serverAdditionalSettings = response.data.AdditionalSettings;
          
          // First apply theme since that doesn't require navigation
          if (serverTheme) {
            this.theme = serverTheme; // Directly set theme without going through setTheme to avoid localStorage
            
            // Also save to localStorage for persistence even when authenticated
            if (process.client) {
              try {
                localStorage.setItem('user_theme', serverTheme);
                localStorage.setItem('app_theme', serverTheme); // For backward compatibility
              } catch (error) {
                console.error('[userPreferences] Error saving theme to localStorage:', error);
              }
            }
          }
          
          // Set a flag in global window object to prevent feedback loops
          if (process.client) {
            window.__isServerPreferenceChange = true;
            
            // Reset the flag after a short delay
            setTimeout(() => {
              window.__isServerPreferenceChange = false;
            }, 1000);
          }
          
          // Then handle language change - requiring route update
          if (serverLanguage) {
            // Apply language directly to store
            this.language = serverLanguage; // Directly set language without going through setLanguage to avoid localStorage
            
            // Also save to localStorage for persistence even when authenticated
            if (process.client) {
              try {
                localStorage.setItem('user_language', serverLanguage);
                localStorage.setItem('app_language', serverLanguage); // For backward compatibility
              } catch (error) {
                console.error('[userPreferences] Error saving language to localStorage:', error);
              }
            }
            
            // Get the current locale and route
            const router = useRouter();
            const route = useRoute();
            const i18n = nuxtApp.$i18n;
            const currentLocale = i18n.locale.value;
            
            // Only redirect if needed
            if (serverLanguage !== currentLocale) {
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
              
              // Update router with correct path
              if (process.client) {
                router.push(newPath);
              }
            }
          }
          
          // Parse and apply additional settings if available
          if (serverAdditionalSettings) {
            try {
              // Parse if it's a string, otherwise use as is
              const parsedSettings = typeof serverAdditionalSettings === 'string'
                ? JSON.parse(serverAdditionalSettings)
                : serverAdditionalSettings;
              
              this.additionalSettings = parsedSettings;
              
              // Save to localStorage for persistence
              if (process.client) {
                try {
                  localStorage.setItem('user_additional_settings', 
                    typeof parsedSettings === 'string' ? parsedSettings : JSON.stringify(parsedSettings));
                } catch (error) {
                  console.error('[userPreferences] Error saving additionalSettings to localStorage:', error);
                }
              }
            } catch (error) {
              console.error('[userPreferences] Error parsing AdditionalSettings:', error);
              this.additionalSettings = {};
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