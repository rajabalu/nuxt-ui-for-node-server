import { useNotification } from '@/composables/useNotification';

export default defineNuxtPlugin(() => {
  console.log('Initializing notification plugin');
  
  // Initialize notification system early
  const notificationSystem = useNotification();
  
  // Add plugin test method
  const pluginTest = () => {
    console.log('Testing notifications from plugin');
    notificationSystem.info('Notification test from plugin', {
      title: 'Plugin Test',
      timeout: 3000
    });
  };
  
  // Only run an automatic test in development mode
  if (process.env.NODE_ENV === 'development') {
    setTimeout(() => {
      pluginTest();
    }, 500);
  }
  
  // Provide methods globally
  return {
    provide: {
      notification: notificationSystem,
      testNotification: pluginTest
    }
  };
}); 