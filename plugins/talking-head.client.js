// This plugin properly initializes the TalkingHead library for Nuxt
// It helps avoid the "Cannot convert object to primitive value" error

export default defineNuxtPlugin((nuxtApp) => {
  // Only initialize in client-side
  if (process.server) return;
  
  // Only register plugin hooks, we'll import the actual library in the components
  // This prevents issues with SSR and module conflicts
  
  console.log('TalkingHead plugin initialized');
  
  return {
    provide: {
      talkingHeadReady: true
    }
  };
});