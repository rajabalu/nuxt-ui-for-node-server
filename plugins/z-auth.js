import { useAuthStore } from '~/stores/auth';

export default defineNuxtPlugin((nuxtApp) => {
  // Add auth interceptor for API requests
  nuxtApp.hook('app:created', () => {
    const authStore = useAuthStore();
    
    // Initialize auth state from localStorage
    if (process.client) {
      // Initialize auth state once DOM is ready
      setTimeout(() => {
        authStore.initAuth();
        
        // Check current route and redirect if necessary
        const route = useRoute();
        
        // Define public routes that don't need authentication
        const publicRoutes = [
          '/sign-in', 
          '/sign-up', 
          '/forget-password', 
          '/reset-password',
          '/registration-success',
          '/unauthorized'
        ];
        
        // Check if current route is protected and user is not authenticated
        const isPublicRoute = publicRoutes.some(path => 
          route.path === path || route.path.startsWith(`${path}/`)
        );
        
        if (!isPublicRoute && !authStore.isAuthenticated) {
          navigateTo('/sign-in');
        }
      }, 0);
    }
  });
  
  // Wait until api plugin has registered the API
  const api = nuxtApp.$api;
  
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
        if (authStore.isAuthenticated && authStore.isTokenExpired && !endpoint.includes('auth/refresh')) {
          await authStore.refreshTokens();
        }
        
        // Add auth header if authenticated and header not already set
        if (authStore.isAuthenticated && authStore.token && !options.headers?.Authorization) {
          options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${authStore.token}`
          };
          args[args.length - 1] = options;
        }
        
        const response = await method(endpoint, ...args);
        
        // If unauthorized and we have a refresh token, try refreshing
        if (!response.success && response.status === 401 && authStore.refreshToken) {
          const refreshResult = await authStore.refreshTokens();
          
          // If refresh successful, retry the original request
          if (refreshResult.success) {
            options.headers = {
              ...options.headers,
              'Authorization': `Bearer ${authStore.token}`
            };
            args[args.length - 1] = options;
            return method(endpoint, ...args);
          } else {
            // If refresh failed, logout and redirect
            authStore.logout();
          }
        }
        
        return response;
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