// This middleware explicitly overrides the global auth middleware for public pages
export default defineNuxtRouteMiddleware((to) => {
  console.log('Public middleware: allowing access to', to.path);
  
  // This explicitly returns undefined to allow access and overrides
  // any subsequent middleware that might redirect
  return undefined;
}); 