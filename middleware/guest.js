import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware(() => {
  const authStore = useAuthStore();
  
  // If user is already authenticated, redirect to home page
  if (authStore.isAuthenticated) {
    return navigateTo('/');
  }
}); 