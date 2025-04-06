import { ref, computed } from 'vue';
import { useApi } from '~/composables/api';
import { useNotification } from '~/composables/useNotification';

export function useCrudOperations(apiConfig, options = {}) {
  const api = useApi();
  const notification = useNotification();
  
  const items = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const pagination = ref({
    page: 1,
    total: 0,
    limit: options.itemsPerPage || 10
  });
  
  /**
   * Fetch data from the API
   */
  const fetchData = async (params = {}, retryCount = 0) => {
    loading.value = true;
    error.value = null;
    
    try {
      // Build query params
      const queryParams = new URLSearchParams();
      
      // Add pagination parameters
      queryParams.append('page', pagination.value.page.toString());
      queryParams.append('limit', pagination.value.limit.toString());
      
      // Add all other parameters from params object
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
      
      // Log query parameters for debugging
      console.log('Query parameters:', Object.fromEntries(queryParams.entries()));
      
      // Ensure endpoint doesn't start with / if BASE_URL ends with /
      let endpoint = apiConfig.list;
      if (endpoint.startsWith('/') && api.getBaseUrl().endsWith('/')) {
        endpoint = endpoint.substring(1);
      }
      
      // Fetch data
      const fullEndpoint = `${endpoint}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log('Fetching from:', fullEndpoint);
      const response = await api.get(fullEndpoint);
      console.log('API Response:', response);
      
      if (response.success) {
        // Process response
        if (response.data.items) {
          items.value = response.data.items;
          if (response.data.pagination) {
            pagination.value = {
              ...pagination.value,
              ...response.data.pagination
            };
          }
        } else if (Array.isArray(response.data)) {
          items.value = response.data;
        } else {
          items.value = response.data.data || [];
          if (response.data.meta) {
            pagination.value = {
              page: response.data.meta.currentPage || 1,
              total: response.data.meta.totalItems || 0,
              limit: response.data.meta.itemsPerPage || pagination.value.limit
            };
          }
        }
        
        if (options.showSuccessNotifications) {
          notification.success('Data loaded successfully');
        }
      } else {
        error.value = response.error;
        notification.error(`Error loading data: ${response.error}`);
      }
    } catch (err) {
      error.value = err.message;
      
      // Handle specific error cases
      if (err.response) {
        // Server responded with error status
        switch (err.response.status) {
          case 401:
            notification.error('Authentication required. Please log in again.');
            // Could redirect to login or refresh token here
            break;
          case 403:
            notification.error('You do not have permission to access this resource.');
            break;
          case 404:
            notification.error('The requested data could not be found.');
            break;
          case 500:
            notification.error('Server error. Please try again later.');
            break;
          default:
            notification.error(`Error fetching data: ${err.response.data?.message || 'Unknown error'}`);
        }
      } else if (err.request) {
        // Request made but no response received - network error
        if (retryCount < 3) {
          notification.info(`Connection issue. Retrying (${retryCount + 1}/3)...`);
          setTimeout(() => fetchData(params, retryCount + 1), 1000 * (retryCount + 1));
          return;
        } else {
          notification.error('Network error. Please check your connection.');
        }
      } else {
        // Error in setting up the request
        notification.error(`Error in request: ${err.message}`);
      }
    } finally {
      loading.value = false;
    }
    
    return { items: items.value, pagination: pagination.value, error: error.value };
  };
  
  /**
   * Delete an item
   */
  const deleteItem = async (id) => {
    loading.value = true;
    error.value = null;
    
    try {
      // Build endpoint
      let deleteEndpoint;
      if (apiConfig.delete) {
        deleteEndpoint = apiConfig.delete.replace(':id', id);
      } else {
        const resourceName = apiConfig.list.split('/').filter(Boolean).pop();
        deleteEndpoint = `${resourceName}/${id}`;
      }
      
      // Send delete request
      const response = await api.delete(deleteEndpoint);
      
      if (response.success) {
        // Remove from local list
        items.value = items.value.filter(item => item.id !== id);
        notification.success('Item deleted successfully');
        return { success: true };
      } else {
        error.value = response.error;
        notification.error(`Error deleting item: ${response.error}`);
        return { success: false, error: response.error };
      }
    } catch (err) {
      error.value = err.message;
      
      // Handle specific error cases
      if (err.response) {
        // Handle based on status
        switch (err.response.status) {
          case 401:
            notification.error('Authentication required to delete this item.');
            break;
          case 403:
            notification.error('You do not have permission to delete this item.');
            break;
          case 404:
            notification.error('The item you are trying to delete could not be found.');
            break;
          default:
            notification.error(`Error deleting item: ${err.response.data?.message || 'Unknown error'}`);
        }
      } else {
        notification.error(`Error: ${err.message}`);
      }
      
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  };
  
  /**
   * Update an item
   */
  const updateItem = async (id, data) => {
    loading.value = true;
    error.value = null;
    
    try {
      // Build endpoint
      let updateEndpoint;
      if (apiConfig.update) {
        updateEndpoint = apiConfig.update.replace(':id', id);
      } else {
        const resourceName = apiConfig.list.split('/').filter(Boolean).pop();
        updateEndpoint = `${resourceName}/${id}`;
      }
      
      // Send update request
      const response = await api.patch(updateEndpoint, data);
      
      if (response.success) {
        // Update in local list
        const index = items.value.findIndex(item => item.id === id);
        if (index !== -1) {
          items.value[index] = response.data;
        }
        
        notification.success('Item updated successfully');
        return { success: true, data: response.data };
      } else {
        error.value = response.error;
        notification.error(`Error updating item: ${response.error}`);
        return { success: false, error: response.error };
      }
    } catch (err) {
      error.value = err.message;
      notification.error(`Error: ${err.message}`);
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  };
  
  /**
   * Create a new item
   */
  const createItem = async (data) => {
    loading.value = true;
    error.value = null;
    
    try {
      // Build endpoint
      let createEndpoint = apiConfig.list;
      
      // Send create request
      const response = await api.post(createEndpoint, data);
      
      if (response.success) {
        // Add to local list if on first page
        if (pagination.value.page === 1) {
          items.value.unshift(response.data);
        }
        
        notification.success('Item created successfully');
        return { success: true, data: response.data };
      } else {
        error.value = response.error;
        notification.error(`Error creating item: ${response.error}`);
        return { success: false, error: response.error };
      }
    } catch (err) {
      error.value = err.message;
      notification.error(`Error: ${err.message}`);
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  };
  
  /**
   * Bulk delete items
   */
  const bulkDelete = async (ids) => {
    if (!ids || !ids.length) return { success: false, error: 'No items selected' };
    
    loading.value = true;
    error.value = null;
    
    try {
      // Build endpoint
      let bulkDeleteEndpoint;
      if (apiConfig.bulkDelete) {
        bulkDeleteEndpoint = apiConfig.bulkDelete;
      } else {
        const resourceName = apiConfig.list.split('/').filter(Boolean).pop();
        bulkDeleteEndpoint = `${resourceName}/bulk-delete`;
      }
      
      // Send bulk delete request
      const response = await api.post(bulkDeleteEndpoint, { ids });
      
      if (response.success) {
        // Remove from local list
        items.value = items.value.filter(item => !ids.includes(item.id));
        
        notification.success(`${ids.length} items deleted successfully`);
        return { success: true };
      } else {
        error.value = response.error;
        notification.error(`Error deleting items: ${response.error}`);
        return { success: false, error: response.error };
      }
    } catch (err) {
      error.value = err.message;
      notification.error(`Error: ${err.message}`);
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  };
  
  /**
   * Export data
   */
  const exportData = async (format, exportParams = {}) => {
    loading.value = true;
    error.value = null;
    
    try {
      // Build endpoint
      let exportEndpoint;
      if (apiConfig.export) {
        exportEndpoint = apiConfig.export;
      } else {
        exportEndpoint = apiConfig.list;
      }
      
      // Add export format
      const params = new URLSearchParams({
        format,
        limit: '1000', // Get more records for export
        ...exportParams
      });
      
      // Send export request
      const response = await api.get(`${exportEndpoint}${params.toString() ? `?${params.toString()}` : ''}`);
      
      if (response.success) {
        notification.success(`Data exported successfully as ${format.toUpperCase()}`);
        return { success: true, data: response.data };
      } else {
        error.value = response.error;
        notification.error(`Error exporting data: ${response.error}`);
        return { success: false, error: response.error };
      }
    } catch (err) {
      error.value = err.message;
      notification.error(`Export failed: ${err.message}`);
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  };
  
  return {
    items,
    loading,
    error,
    pagination,
    fetchData,
    deleteItem,
    updateItem,
    createItem,
    bulkDelete,
    exportData
  };
} 