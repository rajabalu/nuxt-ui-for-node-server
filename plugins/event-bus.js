import mitt from 'mitt';

// Create a global emitter instance
const emitter = mitt();

export default defineNuxtPlugin((nuxtApp) => {
  // Add the emitter to Vue's global properties
  nuxtApp.vueApp.config.globalProperties.$emitter = emitter;
  
  // For debug purposes
  console.log('Event bus initialized:', emitter);
  
  return {
    provide: {
      emitter
    }
  };
}); 