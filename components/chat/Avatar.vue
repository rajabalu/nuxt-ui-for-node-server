<!-- Avatar.vue -->
<template>
  <div id="avatar-container" ref="avatarContainer"></div>
  <div id="subtitles" ref="subtitlesElement"></div>

  <!-- Controls at the top -->
  <div id="controls">
    <input id="text" type="text" value="Hello, how are you?" />
    <button id="speak" @click="speak">Speak</button>
    <button id="settings-button" @click="toggleSettings">Settings</button>
  </div>

  <!-- Collapsible Settings Panel -->
  <div id="settings-panel" ref="settingsPanel" style="display: none;">
    <label for="azure-key">Azure Key</label>
    <input id="azure-key" type="text" aria-label="Azure key" placeholder="Enter Azure Key" :value="azureKey">

    <label for="azure-region">Azure Region</label>
    <input id="azure-region" type="text" aria-label="Azure region" placeholder="Enter Azure Region" :value="azureRegion">
    <br>
    <fieldset id="lipsync-type">
      <legend>Lip-sync Data Type</legend>
      <label>
        <input type="radio" name="lipsync_type" value="visemes" checked>
        Visemes
      </label>
      <label>
        <input type="radio" name="lipsync_type" value="words">
        Words
      </label>
      <label>
        <input type="radio" name="lipsync_type" value="blendshapes">
        Blend shapes
      </label>
    </fieldset>
  </div>

  <!-- Loading or error display -->
  <div id="loading" ref="loadingElement"></div>
</template>

<script setup>
import { useRouter } from '#app';
import { computed, ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useChatStore } from '~/stores/chat';
import { useGlobal } from '~/stores/global';
import { useRuntimeConfig } from '#app';

// Get Azure config from runtime configuration
const config = useRuntimeConfig();
const azureKey = ref(config.public.AZURE_KEY || '');
const azureRegion = ref(config.public.AZURE_LOCATION || '');

// Define refs for DOM elements
const avatarContainer = ref(null);
const subtitlesElement = ref(null);
const settingsPanel = ref(null);
const loadingElement = ref(null);

// Stores
const router = useRouter();
const chatStore = useChatStore();
const globalStore = useGlobal();
const { $talkingHeadReady } = useNuxtApp();

// Initialize variables
const talkingHead = ref(null);
const isInitialized = ref(false);

// Define viseme mapping for Azure TTS
const visemeMap = [
  /* 0  */ "sil",            // Silence
  /* 1  */ "aa",             // æ, ə, ʌ
  /* 2  */ "aa",             // ɑ
  /* 3  */ "O",              // ɔ
  /* 4  */ "E",              // ɛ, ʊ
  /* 5  */ "RR",             // ɝ
  /* 6  */ "I",              // j, i, ɪ
  /* 7  */ "U",              // w, u
  /* 8  */ "O",              // o
  /* 9  */ "O",              // aʊ
  /* 10 */ "O",              // ɔɪ
  /* 11 */ "I",              // aɪ
  /* 12 */ "kk",             // h
  /* 13 */ "RR",             // ɹ
  /* 14 */ "nn",             // l
  /* 15 */ "SS",             // s, z
  /* 16 */ "CH",             // ʃ, tʃ, dʒ, ʒ
  /* 17 */ "TH",             // ð
  /* 18 */ "FF",             // f, v
  /* 19 */ "DD",             // d, t, n, θ
  /* 20 */ "kk",             // k, g, ŋ
  /* 21 */ "PP"              // p, b, m
];

// Define Azure blendshape mapping
const azureBlendshapeMap = [
  /* 0  */ "eyeBlinkLeft",
  /* 1  */ "eyeLookDownLeft",
  /* 2  */ "eyeLookInLeft",
  /* 3  */ "eyeLookOutLeft",
  /* 4  */ "eyeLookUpLeft",
  /* 5  */ "eyeSquintLeft",
  /* 6  */ "eyeWideLeft",
  /* 7  */ "eyeBlinkRight",
  /* 8  */ "eyeLookDownRight",
  /* 9  */ "eyeLookInRight",
  /* 10 */ "eyeLookOutRight",
  /* 11 */ "eyeLookUpRight",
  /* 12 */ "eyeSquintRight",
  /* 13 */ "eyeWideRight",
  /* 14 */ "jawForward",
  /* 15 */ "jawLeft",
  /* 16 */ "jawRight",
  /* 17 */ "jawOpen",
  /* 18 */ "mouthClose",
  /* 19 */ "mouthFunnel",
  /* 20 */ "mouthPucker",
  /* 21 */ "mouthLeft",
  /* 22 */ "mouthRight",
  /* 23 */ "mouthSmileLeft",
  /* 24 */ "mouthSmileRight",
  /* 25 */ "mouthFrownLeft",
  /* 26 */ "mouthFrownRight",
  /* 27 */ "mouthDimpleLeft",
  /* 28 */ "mouthDimpleRight",
  /* 29 */ "mouthStretchLeft",
  /* 30 */ "mouthStretchRight",
  /* 31 */ "mouthRollLower",
  /* 32 */ "mouthRollUpper",
  /* 33 */ "mouthShrugLower",
  /* 34 */ "mouthShrugUpper",
  /* 35 */ "mouthPressLeft",
  /* 36 */ "mouthPressRight",
  /* 37 */ "mouthLowerDownLeft",
  /* 38 */ "mouthLowerDownRight",
  /* 39 */ "mouthUpperUpLeft",
  /* 40 */ "mouthUpperUpRight",
  /* 41 */ "browDownLeft",
  /* 42 */ "browDownRight",
  /* 43 */ "browInnerUp",
  /* 44 */ "browOuterUpLeft",
  /* 45 */ "browOuterUpRight",
  /* 46 */ "cheekPuff",
  /* 47 */ "cheekSquintLeft",
  /* 48 */ "cheekSquintRight",
  /* 49 */ "noseSneerLeft",
  /* 50 */ "noseSneerRight",
  /* 51 */ "tongueOut",
  /* 52 */ "headRotateZ"
];

// Initialize lipsync buffers
const lipsyncType = ref('visemes'); // Default to visemes
let visemesbuffer = {
  visemes: [],
  vtimes: [],
  vdurations: [],
};
let prevViseme = null;
let wordsbuffer = {
  words: [],
  wtimes: [],
  wdurations: []
};
let azureBlendShapes = {
  frames: [],
  sbuffer: [],
  orderBuffer: {}
};

// Function to reset all lipsync buffers
const resetLipsyncBuffers = () => {
  visemesbuffer = {
    visemes: [],
    vtimes: [],
    vdurations: [],
  };
  prevViseme = null;
  wordsbuffer = {
    words: [],
    wtimes: [],
    wdurations: []
  };
  azureBlendShapes = {
    frames: [],
    sbuffer: [],
    orderBuffer: {}
  };
};

// Get selected avatar through computed property
const selectedAvatar = computed(() => globalStore.getSelectedAvatar());

const navigateToNewStrategy = () => {
  chatStore.clearMessages();
  router.push('/');
};

// Function to convert text to SSML for Azure TTS
const textToSSML = (text) => {
  return `
    <speak version="1.0" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="en-US">
      <voice name="en-US-EmmaNeural">
        <mstts:viseme type="FacialExpression" />
        ${text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')}
      </voice>
    </speak>`;
};

// Speak function to test the avatar using Azure TTS
const speak = async () => {
  if (!talkingHead.value) return;
  
  try {
    const text = document.getElementById('text')?.value || 'Hello, how are you?';
    const azureKeyValue = document.getElementById('azure-key')?.value || azureKey.value;
    const azureRegionValue = document.getElementById('azure-region')?.value || azureRegion.value;
    
    // Get selected lipsync type
    lipsyncType.value = document.querySelector('input[name="lipsync_type"]:checked')?.value || 'visemes';
    
    if (!azureKeyValue || !azureRegionValue) {
      console.error("Azure TTS region/key missing!");
      if (loadingElement.value) {
        loadingElement.value.textContent = "Please enter your Azure TTS key and region in the settings panel.";
        loadingElement.value.style.display = 'block';
      }
      return;
    }
    
    // Reset buffers before starting new speech
    resetLipsyncBuffers();
    
    // Configure Azure TTS options
    const speechOptions = {
      provider: 'azure', // Specify Microsoft Azure as the TTS provider
      azureKey: azureKeyValue,
      azureRegion: azureRegionValue,
      lipsyncType: lipsyncType.value,
      visemeMap: visemeMap,
      blendShapeMap: azureBlendshapeMap,
      ssml: textToSSML(text),
      
      // Stream callbacks
      onStreamStart: () => {
        console.log("Audio playback started.");
        if (subtitlesElement.value) {
          subtitlesElement.value.textContent = "";
          subtitlesElement.value.style.display = "none";
        }
      },
      onStreamEnd: () => {
        console.log("Audio playback ended.");
        if (subtitlesElement.value && subtitlesElement.value.textContent) {
          const displayDuration = Math.max(2000, subtitlesElement.value.textContent.length * 50);
          setTimeout(() => {
            if (subtitlesElement.value) {
              subtitlesElement.value.textContent = "";
              subtitlesElement.value.style.display = "none";
            }
          }, displayDuration);
        }
      },
      onSubtitleUpdate: (subtitleText) => {
        console.log("subtitleText: ", subtitleText);
        if (subtitlesElement.value) {
          subtitlesElement.value.textContent += subtitleText;
          subtitlesElement.value.style.display = subtitlesElement.value.textContent ? "block" : "none";
        }
      }
    };
    
    await talkingHead.value.speakText(text, speechOptions);
  } catch (error) {
    console.error('Error during speech:', error);
    if (loadingElement.value) {
      loadingElement.value.textContent = `Error: ${error.message}`;
      loadingElement.value.style.display = 'block';
    }
  }
};

const toggleSettings = () => {
  if (settingsPanel.value) {
    settingsPanel.value.style.display = 
      settingsPanel.value.style.display === 'none' ? 'block' : 'none';
  }
};

// Initialize TalkingHead on client-side only
onMounted(async () => {
  // Wait for the DOM to be fully rendered
  await nextTick();
  
  // Don't initialize if it's server-side
  if (process.server) return;
  
  try {
    console.log('[Avatar] Starting Avatar component initialization');
    
    // Dynamically import the TalkingHead library to avoid SSR issues
    console.log('[Avatar] Importing TalkingHead library...');
    const { TalkingHead } = await import('@met4citizen/talkinghead');
    console.log('[Avatar] TalkingHead library imported successfully');
    
    // Create a custom subclass of TalkingHead to handle Vue reactivity issues
    class VueTalkingHead extends TalkingHead {
      constructor(container, options) {
        super(container, options);
        
        // Apply patch to make Matrix4 Vue-compatible
        this._patchMatrix4Constructor();
        
        // Override animate method to handle matrix properties
        const originalAnimate = this.animate;
        this.animate = (time) => {
          try {
            if (this.scene) {
              // Skip our matrix protection during animation to avoid errors
              this._applySimpleMatrixProtection(this.scene);
            }
            
            return originalAnimate.call(this, time);
          } catch (err) {
            console.error('[Avatar] Error in animate:', err);
          }
        };
        
        // Patch the render method if available
        if (this.renderer && this.renderer.render) {
          const originalRender = this.renderer.render;
          this.renderer.render = (scene, camera) => {
            try {
              // Apply very simple matrix protection just before rendering
              this._applySimpleMatrixProtection(scene);
              return originalRender.call(this.renderer, scene, camera);
            } catch (err) {
              console.error('[Avatar] Error in render:', err);
            }
          };
        }
      }
      
      // Patch the Matrix4 constructor to make all instances Vue-compatible
      _patchMatrix4Constructor() {
        try {
          // Find the Matrix4 constructor in the renderer context
          if (!this.renderer) return;
          
          // Try to find Three.js inside the module
          const rendererProto = Object.getPrototypeOf(this.renderer);
          if (!rendererProto) return;
          
          // Look for Matrix4 in the renderer's context (its constructor)
          const rendererConstructor = rendererProto.constructor;
          if (!rendererConstructor) return;
          
          const THREE = rendererConstructor.THREE || 
                     window.THREE || 
                     this._findThreeInGlobals();
          
          if (!THREE || !THREE.Matrix4) {
            console.log('[Avatar] Could not find THREE.Matrix4');
            return;
          }
          
          console.log('[Avatar] Found THREE.Matrix4, applying patch');
          
          // Save the original Matrix4 constructor
          const OriginalMatrix4 = THREE.Matrix4;
          
          // Replace with our patched version that makes all properties configurable
          THREE.Matrix4 = function() {
            // Create a new matrix using the original constructor
            const matrix = new OriginalMatrix4();
            
            // Make the elements property configurable to be Vue-friendly
            if (matrix.elements) {
              Object.defineProperty(matrix, 'elements', {
                value: matrix.elements,
                configurable: true,
                writable: true,
                enumerable: true
              });
            }
            
            return matrix;
          };
          
          // Copy prototype and static properties
          THREE.Matrix4.prototype = OriginalMatrix4.prototype;
          Object.setPrototypeOf(THREE.Matrix4, OriginalMatrix4);
          
          console.log('[Avatar] Matrix4 patch applied successfully');
        } catch (err) {
          console.error('[Avatar] Error applying Matrix4 patch:', err);
        }
      }
      
      // Helper method to find Three.js in global variables
      _findThreeInGlobals() {
        for (const key in window) {
          if (window[key] && 
              typeof window[key] === 'object' && 
              window[key].Vector3 && 
              window[key].Matrix4) {
            console.log('[Avatar] Found THREE in global scope as', key);
            return window[key];
          }
        }
        return null;
      }
      
      // Apply a very simple matrix protection that just skips problematic properties
      _applySimpleMatrixProtection(obj) {
        if (!obj) return;
        
        // Don't try to modify matrix properties directly
        // Just recursively process children
        if (obj.children && Array.isArray(obj.children)) {
          obj.children.forEach(child => {
            try {
              this._applySimpleMatrixProtection(child);
            } catch (err) {
              // Ignore errors in individual children
            }
          });
        }
      }
      
      // Override showAvatar to handle proxy issues
      async showAvatar(options, progressCallback) {
        try {
          // Make sure AudioContext is initialized
          if (window.__audioContextInitialized !== true) {
            console.log('[Avatar] Waiting for user interaction to initialize AudioContext...');
          }
          
          // Call original method with error handling
          const result = await super.showAvatar(options, progressCallback);
          
          // Make a best effort to protect matrices without causing errors
          this._patchObjectsDeep();
          
          return result;
        } catch (error) {
          console.error('[Avatar] Error in showAvatar:', error);
          throw error;
        }
      }
      
      // Patch objects using a non-exception approach
      _patchObjectsDeep() {
        try {
          if (this.scene) {
            this._forEachObjectInScene(this.scene, (obj) => {
              // Try to make matrices non-reactive without modifying them
              this._tryMakeMatricesNonReactive(obj);
            });
          }
        } catch (err) {
          console.error('[Avatar] Error in _patchObjectsDeep:', err);
        }
      }
      
      // Process each object in the scene safely
      _forEachObjectInScene(scene, callback) {
        if (!scene) return;
        
        const traverse = (object) => {
          try {
            callback(object);
          } catch (err) {
            // Ignore error and continue with other objects
          }
          
          // Process children
          if (object.children && Array.isArray(object.children)) {
            object.children.forEach(child => {
              try {
                traverse(child);
              } catch (err) {
                // Ignore errors in individual children
              }
            });
          }
        };
        
        traverse(scene);
      }
      
      // Try to make matrix properties non-reactive
      _tryMakeMatricesNonReactive(object) {
        if (!object) return;
        
        // Array of potential problematic properties
        const props = ['modelViewMatrix', 'matrixWorld', 'matrix', 'normalMatrix'];
        
        // Create safe descriptor replacements for each property
        for (const prop of props) {
          try {
            if (object[prop] && object.hasOwnProperty(prop)) {
              const descriptor = Object.getOwnPropertyDescriptor(object, prop);
              
              // Skip if already processed or can't be changed
              if (!descriptor || !descriptor.configurable) continue;
              
              // Store the current value
              const value = object[prop];
              
              // Try to redefine the property with a safer descriptor
              Object.defineProperty(object, prop, {
                // Use a getter that always returns the same instance
                get: function() { return value; },
                // Make the setter a no-op to prevent Vue from making it reactive
                set: function() { /* no-op */ },
                configurable: true,
                enumerable: true
              });
            }
          } catch (err) {
            // Ignore errors for individual properties
          }
        }
      }
    }
    
    // Initialize TalkingHead with the container element
    if (avatarContainer.value) {
      console.log('[Avatar] Creating TalkingHead instance with container:', avatarContainer.value);
      
      // Add AudioContext initialization that requires user interaction
      const initializeAudio = () => {
        // Create and resume AudioContext
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        if (audioContext.state === 'suspended') {
          audioContext.resume().then(() => {
            console.log('[Avatar] AudioContext resumed successfully');
          });
        }
        
        // Store for later use
        window.__audioContextInitialized = true;
        
        // Remove event listeners once initialized
        document.removeEventListener('click', initializeAudio);
        document.removeEventListener('touchstart', initializeAudio);
        document.removeEventListener('keydown', initializeAudio);
      };
      
      // Add event listeners to resume AudioContext on user interaction
      document.addEventListener('click', initializeAudio);
      document.addEventListener('touchstart', initializeAudio);
      document.addEventListener('keydown', initializeAudio);
      
      // Create instance of our custom TalkingHead class
      talkingHead.value = new VueTalkingHead(avatarContainer.value, {
        avatarMood: "neutral",
        avatarIdleEyeContact: 0.2,
        avatarIdleHeadMove: 0.5,
        avatarSpeakingEyeContact: 0.5,
        avatarSpeakingHeadMove: 0.5,
        // Set Azure TTS as default
        provider: 'azure',
        azureKey: azureKey.value,
        azureRegion: azureRegion.value,
        ttsEndpoint: "/gtts/", // Additional config from HTML sample
        cameraView: "upper",
        lipsyncLang: "en",
        // Add renderer configuration to avoid proxy issues
        rendererConfig: {
          preserveDrawingBuffer: true,
          powerPreference: "high-performance",
          antialias: true
        }
      });
      
      console.log('[Avatar] VueTalkingHead instance created successfully');
      
      // Add error handler for uncaught errors
      window.addEventListener('error', (event) => {
        if (event.error && event.error.message && 
            event.error.message.includes('modelViewMatrix')) {
          console.log('[Avatar] Caught modelViewMatrix error, applying emergency fix');
          
          // Emergency fix
          if (talkingHead.value && talkingHead.value.scene) {
            talkingHead.value._protectMatrices(talkingHead.value.scene);
          }
          
          // Prevent default handling
          event.preventDefault();
          return true;
        }
      });
      
      // Show loading message for user interaction requirement
      loadingElement.value.textContent = "Loading... Click anywhere to activate audio";
      loadingElement.value.style.display = 'block';
      
      // Add a click handler that will load the avatar model
      const clickHandler = async () => {
        try {
          // Remove the click handler
          document.removeEventListener('click', clickHandler);
          
          // Show loading message
          loadingElement.value.textContent = "Loading avatar model...";
          
          console.log('[Avatar] Loading avatar model...');
          await talkingHead.value.showAvatar({
            // Use RPM model URL from the HTML sample which has the necessary morphTargets
            url: 'https://models.readyplayer.me/6801a9e96026f5144dd9250c.glb?morphTargets=ARKit,Oculus+Visemes,mouthOpen,mouthSmile,eyesClosed,eyesLookUp,eyesLookDown&textureSizeLimit=1024&textureFormat=png',
            avatarMood: "neutral",
            body: 'F'
          }, (ev) => {
            if (loadingElement.value) {
              if (ev.lengthComputable) {
                const percent = Math.round((ev.loaded / ev.total) * 100);
                loadingElement.value.textContent = `Loading ${percent}%`;
              } else {
                loadingElement.value.textContent = `Loading... ${Math.round(ev.loaded / 1024)} KB`;
              }
            }
          });
          
          console.log('[Avatar] Avatar model loaded successfully');
          
          // Hide loading element once fully loaded
          if (loadingElement.value) {
            loadingElement.value.style.display = 'none';
          }
          
          isInitialized.value = true;
          console.log("[Avatar] TalkingHead initialized successfully with Azure TTS");
          
          // Greet the user
          console.log('[Avatar] Triggering initial speech');
          await speak();
        } catch (error) {
          console.error("[Avatar] Error loading avatar model:", error);
          if (loadingElement.value) {
            loadingElement.value.textContent = `Error loading avatar model: ${error.message}`;
            loadingElement.value.style.display = 'block';
          }
        }
      };
      
      // Add click event listener to start loading the avatar on user interaction
      document.addEventListener('click', clickHandler);
      
      // Pause/resume animation on visibility change
      document.addEventListener("visibilitychange", () => {
        if (!talkingHead.value) return;
        
        if (document.visibilityState === "visible") {
          console.log('[Avatar] Page visible, starting animation');
          talkingHead.value.start();
        } else {
          console.log('[Avatar] Page hidden, stopping animation');
          talkingHead.value.stop();
        }
      });
    }
  } catch (error) {
    console.error("[Avatar] Error initializing TalkingHead:", error);
    if (loadingElement.value) {
      loadingElement.value.textContent = `Error loading avatar: ${error.message}`;
      loadingElement.value.style.display = 'block';
    }
  }
});

// Clean up on component unmount
onBeforeUnmount(() => {
  // Remove visibility change event listener
  document.removeEventListener("visibilitychange", () => {});
  
  if (talkingHead.value) {
    talkingHead.value.stop();
    talkingHead.value = null;
  }
  
  // Reset all buffers
  resetLipsyncBuffers();
});
</script>

<style scoped lang="scss">
#avatar-container {
  width: 100%;
  height: 100%;
  min-height: 300px;
}

/* Controls container at top */
#controls {
  display: flex;
  align-items: center;
  gap: 10px;
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  height: 40px;
}

#text {
  flex: 1;
  font-size: 20px;
  height: 100%;
  padding: 5px;
  box-sizing: border-box;
}

#speak {
  width: 100px;
  height: 100%;
  font-size: 16px;
  cursor: pointer;
}

/* Settings toggle button */
#settings-button {
  width: 80px;
  height: 100%;
  font-size: 16px;
  background: #333;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

#settings-button:hover {
  background: #444;
}

/* Collapsible Settings Panel */
#settings-panel {
  position: absolute;
  top: 60px;
  right: 10px;
  width: 220px;
  background-color: #333;
  padding: 10px;
  border-radius: 5px;
  z-index: 998;
}

#settings-panel label {
  display: block;
  margin-top: 10px;
  font-weight: bold;
  font-size: 0.9rem;
}

#settings-panel input, #settings-panel select {
  width: calc(100% - 10px);
  padding: 5px;
  margin-top: 5px;
  font-size: 0.9rem;
  box-sizing: border-box;
}

/* Loading text at bottom-left */
#loading {
  display: block;
  position: absolute;
  bottom: 10px;
  left: 10px;
  right: 10px;
  height: 40px;
  font-size: 20px;
}

#subtitles {
  position: absolute;
  bottom: 50px;
  left: 10%;
  right: 10%;
  text-align: center;
  font-size: 1.2em;
  color: #ffffff;
  text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.7);
  pointer-events: none;
  z-index: 1000;
  padding: 5px 10px;
  border-radius: 5px;
  background: rgba(0, 0, 0, 0.3);
  display: none;
}

#lipsync-type {
  text-align: left;
}

#lipsync-type label {
  display: inline-flex;
  align-items: center;
  margin-right: 1rem;
}

#lipsync-type label input[type="radio"] {
  display: inline-block !important;
  width: auto !important;
  margin-right: 0.3rem;
}

.status {
  position: absolute;
  bottom: 70px;
  left: 10px;
  color: #666;
  font-size: 0.8rem;
}
</style>