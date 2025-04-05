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
          // Update tokens but keep the current user data
          this.token = response.data.token;
          this.refreshToken = response.data.refreshToken;
          this.tokenExpires = response.data.tokenExpires;
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
        const userPreferencesStore = useUserPreferences();
        
        // Fetch preferences from server and apply to local
        const result = await userPreferencesStore.fetchFromServer();
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

    // Initialize auth state from localStorage if available
    initAuth() {
      if (!process.client) return;
      
      const storedAuth = localStorage.getItem('auth');
      if (storedAuth) {
        try {
          const authData = JSON.parse(storedAuth);
          this.token = authData.token;
          this.refreshToken = authData.refreshToken;
          this.tokenExpires = authData.tokenExpires;
          this.isAuthenticated = true;
          
          // Fetch current user to validate the session
          this.fetchCurrentUser().then(result => {
            if (result.success) {
              // Also sync preferences after session is validated
              this.syncUserPreferences();
            }
          });
        } catch (error) {
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
        
        console.log('Sending Facebook token to backend', { theme, language });
        
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
    }
  }
}); 