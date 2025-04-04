import { useAuthStore } from '~/stores/auth';
import { getLocalizedPath } from '@/utils/i18n-helpers';

export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore();
  
  // Get current locale for localized redirects
  const nuxtApp = useNuxtApp();
  const locale = nuxtApp.$i18n?.locale?.value || 'en';
  
  // Check if user is authenticated
  if (!authStore.isAuthenticated) {
    const signInPath = getLocalizedPath('/sign-in', locale);
    return navigateTo(signInPath);
  }
  
  // Try to get fresh user data to ensure role is up-to-date
  await authStore.fetchCurrentUser();
  
  // Check if user is admin
  if (!authStore.isAdmin) {
    // Redirect to dashboard or unauthorized page
    const unauthorizedPath = getLocalizedPath('/unauthorized', locale);
    return navigateTo(unauthorizedPath);
  }
}); 