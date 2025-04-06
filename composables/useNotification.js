import { ref } from 'vue';

// Create a single instance that will be shared across all component imports
const notifications = ref([]);

export function useNotification() {
  // Add a notification
  const addNotification = (notification) => {
    const id = Date.now();
    const newNotification = {
      id,
      ...notification,
      show: true,
      timestamp: new Date()
    };
    
    notifications.value.push(newNotification);
    
    // Auto-hide after timeout
    if (notification.timeout !== 0) { // Allow persistent notifications with timeout: 0
      setTimeout(() => {
        removeNotification(id);
      }, notification.timeout || 5000);
    }
    
    return id;
  };
  
  // Remove a notification
  const removeNotification = (id) => {
    const index = notifications.value.findIndex(n => n.id === id);
    if (index !== -1) {
      // Set show to false to trigger animation
      notifications.value[index].show = false;
      
      // Remove from array after animation completes
      setTimeout(() => {
        notifications.value = notifications.value.filter(n => n.id !== id);
      }, 500);
    }
  };
  
  // Success notification
  const success = (message, options = {}) => {
    return addNotification({
      type: 'success',
      message,
      title: options.title || 'Success',
      icon: 'tabler-circle-check',
      timeout: options.timeout || 5000,
      ...options
    });
  };
  
  // Error notification
  const error = (message, options = {}) => {
    return addNotification({
      type: 'error',
      message,
      title: options.title || 'Error',
      icon: 'tabler-alert-circle',
      timeout: options.timeout || 8000, // Longer timeout for errors
      ...options
    });
  };
  
  // Info notification
  const info = (message, options = {}) => {
    return addNotification({
      type: 'info',
      message,
      title: options.title || 'Information',
      icon: 'tabler-info-circle',
      timeout: options.timeout || 5000,
      ...options
    });
  };
  
  // Warning notification
  const warning = (message, options = {}) => {
    return addNotification({
      type: 'warning',
      message,
      title: options.title || 'Warning',
      icon: 'tabler-alert-triangle',
      timeout: options.timeout || 6000,
      ...options
    });
  };
  
  // Manually remove a notification
  const remove = (id) => {
    removeNotification(id);
  };
  
  // Clear all notifications
  const clear = () => {
    notifications.value = [];
  };
  
  // Test function for development (will be removed in production)
  const test = () => {
    if (process.env.NODE_ENV !== 'development') return;
    
    success('Success notification test');
    setTimeout(() => info('Info notification test'), 500);
    setTimeout(() => warning('Warning notification test'), 1000);
    setTimeout(() => error('Error notification test'), 1500);
  };
  
  return {
    notifications,
    success,
    error,
    info,
    warning,
    remove,
    clear,
    test
  };
} 