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
        // Preserve the original error structure and status from the store
        error.value = result.error?.message || result.error || 'Login failed'; // Set local error message for potential display
        
        // Return the full result object from the store call
        return { 
          success: false, 
          error: result.error, // Keep original error object/string
          status: result.status // Keep status
        };
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
   * Login with Facebook
   */
  const loginWithFacebook = async (accessToken) => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await authStore.loginWithFacebook(accessToken);
      
      if (!result.success) {
        error.value = result.error?.message || result.error || 'Facebook login failed';
        console.error('Facebook login failed in composable', result.error);
        return { 
          success: false, 
          error: result.error,
          status: result.status
        };
      }
      
      return { success: true };
    } catch (e) {
      console.error('Facebook login error in composable:', e);
      error.value = 'An unexpected error occurred';
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };
  
  /**
   * Login with Google
   */
  const loginWithGoogle = async (idToken) => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await authStore.loginWithGoogle(idToken);
      
      if (!result.success) {
        error.value = result.error?.message || result.error || 'Google login failed';
        console.error('Google login failed in composable', result.error);
        return { 
          success: false, 
          error: result.error,
          status: result.status
        };
      }
      
      return { success: true };
    } catch (e) {
      console.error('Google login error in composable:', e);
      error.value = 'An unexpected error occurred';
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };
  
  /**
   * Login with Apple
   */
  const loginWithApple = async (idToken) => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await authStore.loginWithApple(idToken);
      
      if (!result.success) {
        error.value = result.error?.message || result.error || 'Apple login failed';
        console.error('Apple login failed in composable', result.error);
        return { 
          success: false, 
          error: result.error,
          status: result.status
        };
      }
      
      return { success: true };
    } catch (e) {
      console.error('Apple login error in composable:', e);
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
    loginWithFacebook,
    loginWithGoogle,
    loginWithApple,
    logout,
    refreshTokens,
    getCurrentUser
  };
}; 