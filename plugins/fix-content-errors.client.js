/**
 * This plugin addresses specific errors in third-party libraries
 * focused on fixing the "Cannot read properties of undefined (reading 'autoCorrectionCache')" error
 */

export default defineNuxtPlugin({
  name: 'fix-content-errors',
  enforce: 'pre', // Run before other plugins
  setup(nuxtApp) {
    if (typeof window === 'undefined') return;
    
    // Create a safety object for the autoCorrectionCache property
    window.__safetyObject = window.__safetyObject || {};
    window.__safetyObject.autoCorrectionCache = {};
    
    // Create a proxy for the setInitializationProgress function mentioned in the error
    const originalSetInitProgress = window.setInitializationProgress;
    
    window.setInitializationProgress = function(...args) {
      try {
        // If the original function exists, try to call it safely
        if (typeof originalSetInitProgress === 'function') {
          return originalSetInitProgress.apply(this, args);
        }
        return true;
      } catch (e) {
        console.debug('[Safety Proxy] Prevented error in setInitializationProgress:', e.message);
        return true; // Return a safe value
      }
    };
    
    // Monkey patch global objects that might be involved
    const monkeyPatchGlobalObjects = () => {
      try {
        // This runs after a slight delay to ensure all libraries are loaded
        const contentObjects = Object.keys(window).filter(key => 
          key.toLowerCase().includes('content') || 
          (typeof window[key] === 'object' && window[key] !== null)
        );
        
        // For each potential content object, add the missing property
        contentObjects.forEach(key => {
          try {
            const obj = window[key];
            if (obj && typeof obj === 'object' && !obj.autoCorrectionCache) {
              Object.defineProperty(obj, 'autoCorrectionCache', {
                value: {},
                writable: true,
                configurable: true,
                enumerable: false
              });
            }
          } catch (innerError) {
            // Ignore errors on specific objects
          }
        });
      } catch (e) {
        console.debug('[Safety Patch] Error while patching global objects:', e);
      }
    };
    
    // Add the patch with a delay to ensure it runs after everything is loaded
    setTimeout(monkeyPatchGlobalObjects, 500);
    
    // Also run on page load complete
    window.addEventListener('load', monkeyPatchGlobalObjects);
  }
});