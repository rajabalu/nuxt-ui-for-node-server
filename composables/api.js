import { useAuthStore } from '~/stores/auth'; // Import the auth store

export const useApi = () => {
  // Get the server URL from the runtime config
  const config = useRuntimeConfig();
  const nuxtApp = useNuxtApp();
  const authStore = useAuthStore(); // Get the auth store instance
  
  // Try multiple sources for the server URL in order of preference:
  // 1. Runtime config (from nuxt.config.js)
  // 2. Injected value from plugin (which reads directly from .env)
  // 3. Hardcoded fallback
  const BASE_URL = config.public?.SERVER_URL || 
                   nuxtApp.$serverUrl || 
                   'http://localhost:8000/api/v1/';

  const apiRequest = async (endpoint, options = {}) => {
    // Before making any request, check if token needs refreshing
    if (authStore.token && authStore.isTokenExpired && endpoint !== 'auth/refresh') {
      // Don't attempt to refresh if we're already refreshing to avoid loops
      console.log('Token expired, refreshing...');
      const refreshResult = await authStore.refreshTokens();
      if (!refreshResult.success) {
        console.error('Token refresh failed:', refreshResult.error);
        authStore.logout();
        return { success: false, error: 'Session expired. Please login again.' };
      }
    }
    
    const url = `${BASE_URL}${endpoint}`;
    
    // Prepare headers
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    // Add Authorization header if token exists
    if (authStore.token) {
        headers['Authorization'] = `Bearer ${authStore.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: headers // Use the prepared headers
      });
      
      if (response.status === 204) {
        return { success: true };
      }
      
      if (response.status === 401) {
        console.error('API request unauthorized (401)');
        // Don't logout on refresh or logout endpoints
        if (endpoint.includes('auth/refresh') || endpoint.includes('auth/logout')) {
          return { success: false, error: 'Unauthorized', status: response.status };
        }
        // Try refreshing tokens and retry once
        const refreshResult = await authStore.refreshTokens();
        if (refreshResult.success) {
          // Retry original request with new token
          const retryHeaders = { ...headers, 'Authorization': `Bearer ${authStore.token}` };
          const retryResponse = await fetch(url, { ...options, headers: retryHeaders });
          if (retryResponse.status === 401) {
            authStore.logout();
            return { success: false, error: 'Unauthorized', status: retryResponse.status };
          }
          if (!retryResponse.ok) {
            const retryError = await retryResponse.json().catch(() => ({ message: 'Request failed' }));
            return { success: false, error: retryError.message, status: retryResponse.status };
          }
          if (options.method === 'DELETE') {
            return { success: true };
          }
          const retryData = await retryResponse.json();
          return { success: true, data: retryData };
        }
        // Refresh failed -> force logout
        authStore.logout();
        return { success: false, error: 'Unauthorized', status: response.status };
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        return { 
          success: false, 
          error: errorData.message || 'Request failed',
          status: response.status
        };
      }
      
      // Handle successful DELETE requests that might return 200 OK with no body
      if (options.method === 'DELETE') {
        return { success: true };
      }
      
      // For other successful requests, parse the JSON body
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('API request error:', error);
      return { 
        success: false, 
        error: 'An error occurred. Please try again later.'
      };
    }
  };
  
  // File upload handler that maintains consistent auth and error handling
  const uploadFile = async (endpoint, file, options = {}) => {
    // Check token expiry like in standard requests
    if (authStore.token && authStore.isTokenExpired && endpoint !== 'auth/refresh') {
      console.log('Token expired, refreshing before upload...');
      const refreshResult = await authStore.refreshTokens();
      if (!refreshResult.success) {
        console.error('Token refresh failed:', refreshResult.error);
        authStore.logout();
        return { success: false, error: 'Session expired. Please login again.' };
      }
    }
    
    const url = `${BASE_URL}${endpoint}`;
    
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    
    // Add any extra form fields from options
    if (options.formData) {
      Object.entries(options.formData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }
    
    // Prepare headers - don't set Content-Type as it will be set automatically with the boundary
    const headers = { ...options.headers };
    
    // Add Authorization header if token exists
    if (authStore.token) {
      headers['Authorization'] = `Bearer ${authStore.token}`;
    }
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers,
        ...options
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
        return { 
          success: false, 
          error: errorData.message || 'Upload failed',
          status: response.status
        };
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('File upload error:', error);
      return { 
        success: false, 
        error: 'An error occurred during file upload. Please try again later.'
      };
    }
  };

  return {
    get: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'GET' }),
    post: (endpoint, data, options = {}) => apiRequest(endpoint, { 
      ...options, 
      method: 'POST',
      body: JSON.stringify(data)
    }),
    put: (endpoint, data, options = {}) => apiRequest(endpoint, { 
      ...options, 
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    patch: (endpoint, data, options = {}) => apiRequest(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
    delete: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'DELETE' }),
    upload: (endpoint, file, options = {}) => uploadFile(endpoint, file, options),
    // Export the base URL for external use if needed
    getBaseUrl: () => BASE_URL
  };
}; 