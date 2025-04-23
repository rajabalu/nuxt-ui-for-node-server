import { useAuthStore } from '~/stores/auth';
import { getLocalizedPath } from '@/utils/i18n-helpers';

export default defineNuxtPlugin((nuxtApp) => {
  // Initialize auth state from localStorage before routing
  const authStore = useAuthStore();
  if (process.client) {
    authStore.initAuth();
  }
  
  // Wait until api plugin has registered the API
  const api = nuxtApp.$api;
  
  // Track refresh token attempts to prevent infinite loop
  let refreshAttempts = 0;
  const MAX_REFRESH_ATTEMPTS = 2;
  
  if (api) {
    // Add middleware to inject token into API requests
    const originalGet = api.get;
    const originalPost = api.post;
    const originalPut = api.put;
    const originalDelete = api.delete;
    
    // Wrap all API methods to add authorization header and handle token refresh
    const wrapMethod = (method) => {
      return async (endpoint, ...args) => {
        const authStore = useAuthStore();
        const options = args[args.length - 1] || {};
        
        // If already authenticated and token is about to expire, refresh it
        // Skip refresh if we're on a public route or already trying to refresh
        if (authStore.isAuthenticated && 
            authStore.isTokenExpired && 
            !endpoint.includes('auth/refresh') && 
            refreshAttempts < MAX_REFRESH_ATTEMPTS) {
          try {
            refreshAttempts++;
            await authStore.refreshTokens();
          } catch (error) {
            console.error('Token refresh failed:', error);
            refreshAttempts = MAX_REFRESH_ATTEMPTS; // Prevent further attempts
            authStore.logout();
            return { success: false, error: 'Session expired' };
          }
        }
        
        // Add auth header if authenticated and header not already set
        if (authStore.isAuthenticated && authStore.token && !options.headers?.Authorization) {
          options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${authStore.token}`
          };
          args[args.length - 1] = options;
        }
        
        try {
          const response = await method(endpoint, ...args);
          
          // If unauthorized and we have a refresh token, try refreshing
          if (!response.success && response.status === 401 && 
              authStore.refreshToken && refreshAttempts < MAX_REFRESH_ATTEMPTS && 
              !endpoint.includes('auth/refresh')) {
            
            try {
              refreshAttempts++;
              const refreshResult = await authStore.refreshTokens();
              
              // If refresh successful, retry the original request
              if (refreshResult.success) {
                refreshAttempts = 0; // Reset counter after successful refresh
                options.headers = {
                  ...options.headers,
                  'Authorization': `Bearer ${authStore.token}`
                };
                args[args.length - 1] = options;
                return method(endpoint, ...args);
              } else {
                // If refresh failed, logout and redirect
                refreshAttempts = MAX_REFRESH_ATTEMPTS; // Prevent further attempts
                authStore.logout();
                return { success: false, error: 'Session expired' };
              }
            } catch (error) {
              console.error('Error during token refresh:', error);
              refreshAttempts = MAX_REFRESH_ATTEMPTS; // Prevent further attempts
              authStore.logout();
              return { success: false, error: 'Session expired' };
            }
          } else if (response.status === 401) {
            // If we've already tried refreshing or have no refresh token, logout
            authStore.logout();
          }
          
          return response;
        } catch (error) {
          console.error('API request error:', error);
          
          // If the error is network-related, don't automatically logout
          // This prevents logout on temporary connection problems
          if (error.name !== 'TypeError' && error.message !== 'Failed to fetch') {
            refreshAttempts = MAX_REFRESH_ATTEMPTS; // Prevent further attempts
            authStore.logout();
          }
          
          return { success: false, error: 'Request failed' };
        }
      };
    };
    
    // Override API methods
    api.get = wrapMethod(originalGet);
    api.post = wrapMethod(originalPost);
    api.put = wrapMethod(originalPut);
    api.delete = wrapMethod(originalDelete);
  }
  
  // Provide auth-related composables
  return {
    provide: {
      auth: () => {
        const authStore = useAuthStore();
        
        return {
          login: authStore.login,
          logout: authStore.logout,
          getUser: () => authStore.user,
          isAuthenticated: () => authStore.isAuthenticated,
          isAdmin: () => authStore.isAdmin,
          getAuthLoading: () => authStore.authLoading,
          getAuthError: () => authStore.authError
        };
      }
    }
  };
}); 