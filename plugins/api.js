export default defineNuxtPlugin(nuxtApp => {
  // Get the SERVER_URL directly from .env or use a fallback
  const serverUrl = process.env.SERVER_URL || 'http://localhost:8000/api/v1/';
  
  // Expose to the app
  nuxtApp.provide('serverUrl', serverUrl);
}); 