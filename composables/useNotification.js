import { ref } from 'vue';

export function useNotification() {
  const notifications = ref([]);
  const notificationTimeout = ref(null);
  
  // Add a notification
  const addNotification = (notification) => {
    const id = Date.now();
    notifications.value.push({
      id,
      ...notification,
      show: true
    });
    
    // Auto-hide after timeout
    setTimeout(() => {
      const index = notifications.value.findIndex(n => n.id === id);
      if (index !== -1) {
        notifications.value[index].show = false;
        
        // Remove from array after animation completes
        setTimeout(() => {
          notifications.value = notifications.value.filter(n => n.id !== id);
        }, 300);
      }
    }, notification.timeout || 5000);
    
    return id;
  };
  
  // Success notification
  const success = (message, options = {}) => {
    return addNotification({
      type: 'success',
      message,
      icon: 'tabler-circle-check',
      ...options
    });
  };
  
  // Error notification
  const error = (message, options = {}) => {
    return addNotification({
      type: 'error',
      message,
      icon: 'tabler-alert-circle',
      ...options
    });
  };
  
  // Info notification
  const info = (message, options = {}) => {
    return addNotification({
      type: 'info',
      message,
      icon: 'tabler-info-circle',
      ...options
    });
  };
  
  // Warning notification
  const warning = (message, options = {}) => {
    return addNotification({
      type: 'warning',
      message,
      icon: 'tabler-alert-triangle',
      ...options
    });
  };
  
  // Remove a notification
  const remove = (id) => {
    const index = notifications.value.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications.value[index].show = false;
      
      // Remove from array after animation completes
      setTimeout(() => {
        notifications.value = notifications.value.filter(n => n.id !== id);
      }, 300);
    }
  };
  
  return {
    notifications,
    success,
    error,
    info,
    warning,
    remove
  };
} 