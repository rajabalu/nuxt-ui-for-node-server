import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware(async (to) => {
  // Define all public routes that don't require authentication
  const publicRoutes = [
    '/sign-in', 
    '/sign-up', 
    '/forget-password', 
    '/reset-password',
    '/registration-success',
    '/unauthorized'
    // Add any other public routes here
  ];
  
  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => 
    to.path === route || to.path.startsWith(`${route}/`)
  );
  
  if (isPublicRoute) {
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
      // Server-side - redirect to sign-in
      return navigateTo('/sign-in');
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