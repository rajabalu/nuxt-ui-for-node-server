import { useAuthStore } from '~/stores/auth';
import { getLocalizedPath } from '@/utils/i18n-helpers';

export default defineNuxtRouteMiddleware(() => {
  const authStore = useAuthStore();
  
  // Get current locale for localized redirects
  const nuxtApp = useNuxtApp();
  const locale = nuxtApp.$i18n?.locale?.value || 'en';
  
  // If user is already authenticated, redirect to home page
  if (authStore.isAuthenticated) {
    const homePath = getLocalizedPath('/', locale);
    return navigateTo(homePath);
  }
}); 