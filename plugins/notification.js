import { useNotification } from '@/composables/useNotification';

export default defineNuxtPlugin(() => {
  // Initialize notification system early
  const notificationSystem = useNotification();
  
  // Add test method (only in development mode)
  const testNotification = () => {
    if (process.env.NODE_ENV === 'development') {
      notificationSystem.test();
    }
  };
  
  // Provide methods globally
  return {
    provide: {
      notification: notificationSystem,
      testNotification
    }
  };
}); 