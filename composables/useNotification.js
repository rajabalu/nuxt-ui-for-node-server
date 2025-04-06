import { ref, watch } from 'vue';

// Create a single instance that will be shared across all component imports
const notifications = ref([]);

// Add debug ID to track composable instances
const instanceId = Date.now();
console.log(`Creating notification composable instance: ${instanceId}`);

export function useNotification() {
  // Add a notification
  const addNotification = (notification) => {
    console.log(`[Instance ${instanceId}] Adding notification:`, notification);
    const id = Date.now();
    const newNotification = {
      id,
      ...notification,
      show: true,
      timestamp: new Date()
    };
    
    notifications.value.push(newNotification);
    console.log(`[Instance ${instanceId}] Current notifications:`, notifications.value);
    
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
    console.log(`[Instance ${instanceId}] Removing notification:`, id);
    const index = notifications.value.findIndex(n => n.id === id);
    if (index !== -1) {
      // Set show to false to trigger animation
      notifications.value[index].show = false;
      
      // Remove from array after animation completes
      setTimeout(() => {
        notifications.value = notifications.value.filter(n => n.id !== id);
        console.log(`[Instance ${instanceId}] Notifications after removal:`, notifications.value);
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
  
  // Simple test function to verify system is working
  const test = () => {
    console.log(`[Instance ${instanceId}] 🔔 RUNNING NOTIFICATION TEST`);
    const id1 = success('Success notification test');
    console.log(`[Instance ${instanceId}] Success notification added with ID:`, id1);
    
    setTimeout(() => {
      const id2 = info('Info notification test');
      console.log(`[Instance ${instanceId}] Info notification added with ID:`, id2);
    }, 500);
    
    setTimeout(() => {
      const id3 = warning('Warning notification test');
      console.log(`[Instance ${instanceId}] Warning notification added with ID:`, id3);
    }, 1000);
    
    setTimeout(() => {
      const id4 = error('Error notification test');
      console.log(`[Instance ${instanceId}] Error notification added with ID:`, id4);
    }, 1500);
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