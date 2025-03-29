export const useApi = () => {
  // Get the server URL from the runtime config
  const config = useRuntimeConfig();
  const nuxtApp = useNuxtApp();
  
  // Try multiple sources for the server URL in order of preference:
  // 1. Runtime config (from nuxt.config.js)
  // 2. Injected value from plugin (which reads directly from .env)
  // 3. Hardcoded fallback
  const BASE_URL = config.public?.SERVER_URL || 
                   nuxtApp.$serverUrl || 
                   'http://localhost:8000/api/v1/';

  const apiRequest = async (endpoint, options = {}) => {
    const url = `${BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      if (response.status === 204) {
        return { success: true };
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        return { 
          success: false, 
          error: errorData.message || 'Request failed',
          status: response.status
        };
      }
      
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
    delete: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'DELETE' }),
    // Export the base URL for external use if needed
    getBaseUrl: () => BASE_URL
  };
}; 