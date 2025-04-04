import { useAuthStore } from '~/stores/auth';
import { getLocalizedPath } from '@/utils/i18n-helpers';

export default defineNuxtRouteMiddleware(async (to) => {
  // First check if the route has 'public' middleware defined in its meta
  if (to.meta.middleware === 'public') {
    return;
  }
  
  // Define all public routes that don't require authentication
  const publicRoutes = [
    '/sign-in', 
    '/sign-up', 
    '/forget-password', 
    '/reset-password',
    '/registration-success',
    '/unauthorized',
    '/auth/email/confirm',
    '/auth/email/confirm/new',
    '/password-change',
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
  
  // Get current locale for localized redirects
  const nuxtApp = useNuxtApp();
  const locale = nuxtApp.$i18n?.locale?.value || 'en';
  const signInPath = getLocalizedPath('/sign-in', locale);
  
  // If not authenticated
  if (!authStore.isAuthenticated) {
    // Try to initialize from localStorage
    if (process.client) {
      authStore.initAuth();
      
      // If still not authenticated after init, redirect to login
      if (!authStore.isAuthenticated) {
        return navigateTo(signInPath);
      }
    } else {
      // Server-side - redirect to sign-in
      return navigateTo(signInPath);
    }
  }
  
  // If authenticated but token is expired or about to expire
  if (authStore.isTokenExpired) {
    // Try to refresh token
    const refreshResult = await authStore.refreshTokens();
    
    // If refresh failed, redirect to login
    if (!refreshResult.success) {
      return navigateTo(signInPath);
    }
  }
  
  // Allow navigation if user is authenticated
}); 