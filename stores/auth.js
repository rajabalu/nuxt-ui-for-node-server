import { defineStore } from 'pinia';
import { getLocalizedPath } from '@/utils/i18n-helpers';
import { useUserPreferences } from '@/stores/userPreferences';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null,
    refreshToken: null,
    tokenExpires: null,
    user: null,
    isAuthenticated: false,
    authLoading: false,
    authError: null
  }),

  getters: {
    isAdmin: (state) => state.user?.role?.id === 1,
    isTokenExpired: (state) => {
      if (!state.tokenExpires) return true;
      // Return true if token is expired or will expire in the next 5 minutes
      return Date.now() >= (state.tokenExpires - 300000);
    }
  },

  actions: {
    async login(email, password) {
      this.authLoading = true;
      this.authError = null;
      
      const nuxtApp = useNuxtApp();
      const api = nuxtApp.$api;
      
      try {
        if (!api) {
          return { success: false, error: 'API not available' };
        }
        
        const response = await api.post('auth/email/login', { email, password });
        
        if (response.success) {
          this.setAuthData(response.data);
          return { success: true };
        } else {
          this.authError = response.error || 'Login failed';
          return { 
            success: false, 
            error: response.error,
            status: response.status
          };
        }
      } catch (error) {
        this.authError = 'An unexpected error occurred';
        return { success: false, error: this.authError };
      } finally {
        this.authLoading = false;
      }
    },

    async refreshTokens() {
      if (!this.refreshToken) return { success: false, error: 'No refresh token available' };
      
      const nuxtApp = useNuxtApp();
      const api = nuxtApp.$api;
      
      try {
        if (!api) {
          return { success: false, error: 'API not available' };
        }
        
        const response = await api.post('auth/refresh', {}, {
          headers: {
            'Authorization': `Bearer ${this.refreshToken}`
          }
        });
        
        if (response.success) {
          this.token = response.data.token;
          this.refreshToken = response.data.refreshToken;
          this.tokenExpires = response.data.tokenExpires;
          // Persist refreshed tokens for future sessions
          if (process.client) {
            localStorage.setItem('auth', JSON.stringify({
              token: this.token,
              refreshToken: this.refreshToken,
              tokenExpires: this.tokenExpires
            }));
          }
          return { success: true };
        } else {
          // If refresh failed, force logout
          this.clearAuthData();
          this.isAuthenticated = false;
          
          // Redirect to sign-in page if we're on the client side
          if (process.client) {
            navigateTo('/sign-in');
          }
          
          return { success: false, error: 'Session expired' };
        }
      } catch (error) {
        this.clearAuthData();
        this.isAuthenticated = false;
        
        // Redirect to sign-in page if we're on the client side
        if (process.client) {
          navigateTo('/sign-in');
        }
        
        return { success: false, error: 'Failed to refresh session' };
      }
    },

    async logout() {
      if (this.token) {
        const nuxtApp = useNuxtApp();
        const api = nuxtApp.$api;
        
        if (api) {
          try {
            // Try to logout on server but proceed with local logout regardless
            await api.post('auth/logout', {}, {
              headers: {
                'Authorization': `Bearer ${this.token}`
              }
            });
          } catch (error) {
            console.error('Error during logout:', error);
            // Continue with local logout even if server logout fails
          }
        }
      }
      
      // Clear auth data
      this.clearAuthData();
      this.isAuthenticated = false;
      
      // Redirect to sign-in page with proper locale if we're on the client side
      if (process.client) {
        // Get locale from nuxtApp instead of using useI18n directly
        const locale = useNuxtApp().$i18n.locale.value;
        const signInPath = getLocalizedPath('/sign-in', locale);
        
        // Use navigateTo directly without nextTick
        navigateTo(signInPath, { replace: true });
      }
    },

    async fetchCurrentUser() {
      if (!this.token) return { success: false, error: 'Not authenticated' };
      
      // Check if token needs refreshing
      if (this.isTokenExpired) {
        const refreshResult = await this.refreshTokens();
        if (!refreshResult.success) return refreshResult;
      }
      
      const nuxtApp = useNuxtApp();
      const api = nuxtApp.$api;
      
      try {
        if (!api) {
          return { success: false, error: 'API not available' };
        }
        
        const response = await api.get('auth/me', {
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        });
        
        if (response.success) {
          // Update user data with server response
          this.user = response.data;
          
          // Also update localStorage with the fresh data
          if (process.client) {
            const storedAuth = localStorage.getItem('auth');
            if (storedAuth) {
              const authData = JSON.parse(storedAuth);
              localStorage.setItem('auth', JSON.stringify({
                ...authData,
                // Don't override token-related data
              }));
            }
          }
          
          return { success: true, data: response.data };
        } else {
          if (response.status === 401) {
            this.logout();
          }
          return { success: false, error: response.error };
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        return { success: false, error: 'Failed to fetch user data' };
      }
    },

    setAuthData(data) {
      this.token = data.token;
      this.refreshToken = data.refreshToken;
      this.tokenExpires = data.tokenExpires;
      this.user = data.user || null;
      this.isAuthenticated = true;
      
      // Store auth data in localStorage for persistence
      if (process.client) {
        localStorage.setItem('auth', JSON.stringify({
          token: this.token,
          refreshToken: this.refreshToken,
          tokenExpires: this.tokenExpires
        }));
        
        // Sync preferences with server after successful login
        this.syncUserPreferences();
      }
      
      // If user data wasn't provided in the login response, fetch it
      if (!data.user) {
        this.fetchCurrentUser();
      }
    },

    // Apply user preferences from the server after login
    async syncUserPreferences() {
      try {
        const nuxtApp = useNuxtApp();
        const userPreferencesStore = useUserPreferences();
        
        // Fetch preferences from server and apply to local
        const result = await userPreferencesStore.fetchFromServer();
        
        // Handle language change if needed
        if (result?.success && result?.languageChanged && result?.newLanguage) {
          // Only handle navigation if we're on the client side
          if (process.client) {
            // Get the current route
            const router = useRouter();
            const route = useRoute();
            const i18n = nuxtApp.$i18n;
            const currentLocale = i18n.locale.value;
            
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
            const newPath = getLocalizedPath(pathWithoutLocale, result.newLanguage);
            
            // Update router with correct path
            router.push(newPath);
          }
        }
      } catch (error) {
        console.error('[authStore] Error applying server preferences:', error);
      }
    },

    clearAuthData() {
      this.token = null;
      this.refreshToken = null;
      this.tokenExpires = null;
      this.user = null;
      this.isAuthenticated = false;
      
      // Remove auth data from localStorage
      if (process.client) {
        localStorage.removeItem('auth');
        // Clear any other potential auth-related storage items
        sessionStorage.removeItem('auth');
        
        // Clear any auth-related cookies
        document.cookie.split(';').forEach(cookie => {
          const [name] = cookie.trim().split('=');
          if (name && (name.includes('token') || name.includes('auth'))) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          }
        });
      }
    },

    async initAuth() {
      if (!process.client) return;

      const storedAuth = localStorage.getItem('auth');
      if (storedAuth) {
        try {
          const authData = JSON.parse(storedAuth);
          this.token = authData.token;
          this.refreshToken = authData.refreshToken;
          this.tokenExpires = authData.tokenExpires;
          this.isAuthenticated = true;

          // Validate session by fetching current user (refresh tokens if needed)
          const result = await this.fetchCurrentUser();
          if (result.success) {
            await this.syncUserPreferences();
          } else {
            this.clearAuthData();
          }
        } catch (error) {
          console.error('[authStore] initAuth error parsing stored auth', error);
          this.clearAuthData();
        }
      }
    },

    // Add a new action for Facebook login
    async loginWithFacebook(accessToken) {
      this.authLoading = true;
      this.authError = null;
      
      const nuxtApp = useNuxtApp();
      const api = nuxtApp.$api;
      
      try {
        if (!api) {
          return { success: false, error: 'API not available' };
        }
        
        // Get current theme and language preferences
        const i18n = nuxtApp.$i18n;
        const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        const language = i18n?.locale?.value || 'en';
        
        const response = await api.post('auth/facebook/login', { 
          accessToken,
          theme,
          language
        });
        
        if (response.success) {
          this.setAuthData(response.data);
          return { success: true };
        } else {
          console.error('Facebook login failed', response.error);
          this.authError = response.error || 'Facebook login failed';
          return { 
            success: false, 
            error: response.error,
            status: response.status
          };
        }
      } catch (error) {
        console.error('Facebook login error:', error);
        this.authError = 'An unexpected error occurred during Facebook login';
        return { success: false, error: this.authError };
      } finally {
        this.authLoading = false;
      }
    },

    // Add Google login method
    async loginWithGoogle(idToken) {
      this.authLoading = true;
      this.authError = null;
      
      const nuxtApp = useNuxtApp();
      const api = nuxtApp.$api;
      
      try {
        if (!api) {
          return { success: false, error: 'API not available' };
        }
        
        // Get current theme and language preferences
        const i18n = nuxtApp.$i18n;
        const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        const language = i18n?.locale?.value || 'en';
        
        const response = await api.post('auth/google/login', { 
          idToken,
          theme,
          language
        });
        
        if (response.success) {
          this.setAuthData(response.data);
          return { success: true };
        } else {
          console.error('Google login failed', response.error);
          this.authError = response.error || 'Google login failed';
          return { 
            success: false, 
            error: response.error,
            status: response.status
          };
        }
      } catch (error) {
        console.error('Google login error:', error);
        this.authError = 'An unexpected error occurred during Google login';
        return { success: false, error: this.authError };
      } finally {
        this.authLoading = false;
      }
    },

    // Add Apple login method
    async loginWithApple(idToken) {
      this.authLoading = true;
      this.authError = null;
      
      const nuxtApp = useNuxtApp();
      const api = nuxtApp.$api;
      
      try {
        if (!api) {
          return { success: false, error: 'API not available' };
        }
        
        // Get current theme and language preferences
        const i18n = nuxtApp.$i18n;
        const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        const language = i18n?.locale?.value || 'en';
        
        const response = await api.post('auth/apple/login', { 
          idToken,
          theme,
          language
        });
        
        if (response.success) {
          this.setAuthData(response.data);
          return { success: true };
        } else {
          console.error('Apple login failed', response.error);
          this.authError = response.error || 'Apple login failed';
          return { 
            success: false, 
            error: response.error,
            status: response.status
          };
        }
      } catch (error) {
        console.error('Apple login error:', error);
        this.authError = 'An unexpected error occurred during Apple login';
        return { success: false, error: this.authError };
      } finally {
        this.authLoading = false;
      }
    }
  }
});