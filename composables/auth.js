import { ref, computed } from 'vue';
import { useAuthStore } from '~/stores/auth';

export const useAuth = () => {
  const authStore = useAuthStore();
  const loading = ref(false);
  const error = ref(null);
  
  /**
   * Login with email and password
   */
  const login = async (email, password) => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await authStore.login(email, password);
      
      if (!result.success) {
        error.value = result.error || 'Login failed';
        
        // Handle specific error responses from the API
        if (result.status === 422 && result.error?.errors) {
          const errors = result.error.errors;
          
          if (errors.email === 'notFound') {
            error.value = 'Email not found';
          } else if (errors.email?.startsWith('needLoginViaProvider:')) {
            const provider = errors.email.split(':')[1];
            error.value = `Please login using ${provider}`;
          } else if (errors.password === 'incorrectPassword') {
            error.value = 'Incorrect password';
          }
        }
        
        return { success: false, error: error.value };
      }
      
      return { success: true };
    } catch (e) {
      console.error('Login error:', e);
      error.value = 'An unexpected error occurred';
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };
  
  /**
   * Logout current user
   */
  const logout = async () => {
    loading.value = true;
    
    try {
      await authStore.logout();
      return { success: true };
    } catch (e) {
      console.error('Logout error:', e);
      return { success: false, error: 'Logout failed' };
    } finally {
      loading.value = false;
    }
  };
  
  /**
   * Refresh authentication tokens
   */
  const refreshTokens = async () => {
    try {
      const result = await authStore.refreshTokens();
      return result;
    } catch (e) {
      console.error('Token refresh error:', e);
      return { success: false, error: 'Failed to refresh authentication' };
    }
  };
  
  /**
   * Get current user information
   */
  const getCurrentUser = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await authStore.fetchCurrentUser();
      
      if (!result.success) {
        error.value = result.error || 'Failed to get user information';
        return { success: false, error: error.value };
      }
      
      return { success: true, user: authStore.user };
    } catch (e) {
      console.error('Get current user error:', e);
      error.value = 'An unexpected error occurred';
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };
  
  // Return composable methods and computed properties
  return {
    // State
    user: computed(() => authStore.user),
    isAuthenticated: computed(() => authStore.isAuthenticated),
    isAdmin: computed(() => authStore.isAdmin),
    loading,
    error,
    
    // Methods
    login,
    logout,
    refreshTokens,
    getCurrentUser
  };
}; 