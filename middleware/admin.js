import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore();
  
  // Check if user is authenticated
  if (!authStore.isAuthenticated) {
    return navigateTo('/sign-in');
  }
  
  // Try to get fresh user data to ensure role is up-to-date
  await authStore.fetchCurrentUser();
  
  // Check if user is admin
  if (!authStore.isAdmin) {
    // Redirect to dashboard or unauthorized page
    return navigateTo('/unauthorized');
  }
}); 