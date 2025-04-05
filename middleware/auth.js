import { useAuthStore } from '~/stores/auth';
import { getLocalizedPath } from '@/utils/i18n-helpers';

export default defineNuxtRouteMiddleware(async (to) => {
  // Log for debugging
  console.log(`[auth-middleware] Checking route: ${to.path}`);
  
  // First check if the route has 'public' middleware defined in its meta
  if (to.meta.middleware === 'public') {
    console.log('[auth-middleware] Route has public middleware, allowing access');
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
    console.log('[auth-middleware] Route is public, allowing access');
    return;
  }
  
  console.log('[auth-middleware] Route requires authentication');
  
  // Check if there's auth in Pinia store
  const authStore = useAuthStore();
  
  // Get current locale for localized redirects
  const nuxtApp = useNuxtApp();
  const locale = nuxtApp.$i18n?.locale?.value || 'en';
  const signInPath = getLocalizedPath('/sign-in', locale);
  
  // If not authenticated
  if (!authStore.isAuthenticated) {
    console.log('[auth-middleware] User not authenticated');
    
    // Try to initialize from localStorage
    if (process.client) {
      console.log('[auth-middleware] Client-side, trying to init auth from storage');
      authStore.initAuth();
      
      // If still not authenticated after init, redirect to login
      if (!authStore.isAuthenticated) {
        console.log('[auth-middleware] Still not authenticated after init, redirecting to sign-in');
        return navigateTo(signInPath);
      } else {
        console.log('[auth-middleware] Auth initialized successfully from storage');
      }
    } else {
      // Server-side - redirect to sign-in
      console.log('[auth-middleware] Server-side, redirecting to sign-in');
      return navigateTo(signInPath);
    }
  }
  
  // If authenticated but token is expired or about to expire
  if (authStore.isTokenExpired) {
    console.log('[auth-middleware] Token is expired, attempting to refresh');
    
    // Try to refresh token
    const refreshResult = await authStore.refreshTokens();
    
    // If refresh failed, redirect to login
    if (!refreshResult.success) {
      console.log('[auth-middleware] Token refresh failed, redirecting to sign-in');
      return navigateTo(signInPath);
    } else {
      console.log('[auth-middleware] Token refreshed successfully');
    }
  }
  
  console.log('[auth-middleware] Authentication check passed, allowing access');
  // Allow navigation if user is authenticated
}); 