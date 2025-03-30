import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware(async (to) => {
  // Skip middleware if it's a public route
  const publicRoutes = ['/sign-in', '/sign-up', '/forget-password', '/reset-password'];
  if (publicRoutes.includes(to.path)) {
    return;
  }
  
  // Check if there's auth in Pinia store
  const authStore = useAuthStore();
  
  // If not authenticated
  if (!authStore.isAuthenticated) {
    // Try to initialize from localStorage
    if (process.client) {
      authStore.initAuth();
      
      // If still not authenticated after init, redirect to login
      if (!authStore.isAuthenticated) {
        return navigateTo('/sign-in');
      }
    } else {
      // Can't check auth on server side, will redirect in client
      return;
    }
  }
  
  // If authenticated but token is expired or about to expire
  if (authStore.isTokenExpired) {
    // Try to refresh token
    const refreshResult = await authStore.refreshTokens();
    
    // If refresh failed, redirect to login
    if (!refreshResult.success) {
      return navigateTo('/sign-in');
    }
  }
  
  // Allow navigation if user is authenticated
}); 