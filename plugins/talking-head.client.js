// This plugin properly initializes the TalkingHead library for Nuxt
// It helps avoid the "Cannot convert object to primitive value" error
// and fixes the Three.js modelViewMatrix proxy issue

export default defineNuxtPlugin((nuxtApp) => {
  // Only initialize in client-side
  if (process.server) return;
  
  // Set debug flag
  window.__THREEJS_DEBUG = true;
  
  // Add a global method to patch TalkingHead instances
  window.__patchTalkingHeadInstance = function(instance) {
    if (!instance) {
      console.log('[ThreeJS Patch] No TalkingHead instance provided');
      return;
    }
    
    console.log('[ThreeJS Patch] Patching TalkingHead instance directly');
    
    // Check if the instance has a renderer
    if (instance.renderer) {
      const originalRender = instance.renderer.render;
      
      // Replace the render method with our patched version
      instance.renderer.render = function(scene, camera) {
        try {
          // Process the scene to protect all matrix properties
          const processObject = (obj) => {
            if (!obj) return;
            
            // Protect modelViewMatrix if it exists
            if (obj.modelViewMatrix) {
              Object.defineProperty(obj, 'modelViewMatrix', {
                value: obj.modelViewMatrix,
                writable: true,
                configurable: true,
                enumerable: true
              });
            }
            
            // Protect matrixWorld if it exists
            if (obj.matrixWorld) {
              Object.defineProperty(obj, 'matrixWorld', {
                value: obj.matrixWorld,
                writable: true,
                configurable: true,
                enumerable: true
              });
            }
            
            // Protect normalMatrix if it exists
            if (obj.normalMatrix) {
              Object.defineProperty(obj, 'normalMatrix', {
                value: obj.normalMatrix,
                writable: true,
                configurable: true,
                enumerable: true
              });
            }
            
            // Process children recursively
            if (obj.children && Array.isArray(obj.children)) {
              obj.children.forEach(processObject);
            }
          };
          
          // Apply protection to entire scene
          if (scene && scene.children) {
            scene.children.forEach(processObject);
          }
          
          // Call the original render method
          return originalRender.apply(this, arguments);
        } catch (err) {
          console.error('[ThreeJS Patch] Error in patched render method:', err);
          return originalRender.apply(this, arguments);
        }
      };
      
      console.log('[ThreeJS Patch] Successfully patched TalkingHead renderer');
    }
    
    // Set up an animation frame patch to protect matrices
    if (instance.animate) {
      const originalAnimate = instance.animate;
      
      instance.animate = function(time) {
        try {
          // Process the scene before each animation frame
          if (instance.scene && instance.scene.children) {
            const protectMatrices = (obj) => {
              if (!obj) return;
              
              // Protect key matrix properties
              ['modelViewMatrix', 'matrixWorld', 'matrix', 'normalMatrix'].forEach(prop => {
                if (obj[prop]) {
                  Object.defineProperty(obj, prop, {
                    value: obj[prop],
                    writable: true,
                    configurable: true,
                    enumerable: true
                  });
                }
              });
              
              // Process children
              if (obj.children && Array.isArray(obj.children)) {
                obj.children.forEach(protectMatrices);
              }
            };
            
            instance.scene.children.forEach(protectMatrices);
          }
          
          return originalAnimate.call(this, time);
        } catch (err) {
          console.error('[ThreeJS Patch] Error in patched animate method:', err);
          return originalAnimate.call(this, time);
        }
      };
      
      console.log('[ThreeJS Patch] Successfully patched TalkingHead animate method');
    }
  };

  // Apply direct patch for TalkingHead when imported
  const originalImport = window.import;
  if (originalImport) {
    window.import = function(...args) {
      const promise = originalImport.apply(this, args);
      
      // Check if this looks like a TalkingHead import
      if (args[0] && typeof args[0] === 'string' && 
          (args[0].includes('talkinghead') || args[0].includes('TalkingHead'))) {
        console.log('[ThreeJS Patch] Intercepted TalkingHead import');
        
        return promise.then(module => {
          if (module && module.TalkingHead) {
            console.log('[ThreeJS Patch] Found TalkingHead in module, patching constructor');
            
            // Keep the original constructor
            const OriginalTalkingHead = module.TalkingHead;
            
            // Replace with our patched version
            module.TalkingHead = function(...args) {
              // Create the instance using original constructor
              const instance = new OriginalTalkingHead(...args);
              
              // Apply our patches to the instance
              console.log('[ThreeJS Patch] Patching new TalkingHead instance');
              
              // Override render method when it's available
              const checkAndPatchInstance = () => {
                if (instance.renderer) {
                  window.__patchTalkingHeadInstance(instance);
                } else {
                  // Try again in 100ms
                  setTimeout(checkAndPatchInstance, 100);
                }
              };
              
              // Start checking for renderer
              checkAndPatchInstance();
              
              return instance;
            };
            
            // Copy prototype and static properties
            Object.setPrototypeOf(module.TalkingHead, OriginalTalkingHead);
            module.TalkingHead.prototype = OriginalTalkingHead.prototype;
          }
          
          return module;
        });
      }
      
      return promise;
    };
  }
  
  console.log('[TalkingHead] Plugin initialized with direct patching');
  
  // Add a global console error handler to help debug
  if (!window.__originalConsoleError) {
    window.__originalConsoleError = console.error;
    console.error = function(...args) {
      const errorMessage = args.join(' ');
      if (errorMessage.includes('modelViewMatrix') || errorMessage.includes('proxy')) {
        console.log('[ThreeJS Error] ⚠️ Matrix error detected:', errorMessage);
        console.trace('Error trace:');
      }
      return window.__originalConsoleError.apply(console, args);
    };
  }
  
  return {
    provide: {
      talkingHeadReady: true
    }
  };
});