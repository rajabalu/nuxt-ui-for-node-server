<template>
  <div ref="viewerContainer" class="viewer-container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, defineExpose, defineEmits } from 'vue';
import { TalkingHead } from '~/libs/talkinghead.mjs';
import { useAuthStore } from '~/stores/auth'; // Import auth store

const emit = defineEmits(['speak']);

const props = defineProps({
  modelUrl: {
    type: String,
    required: true,
    default: '/models/Leo.glb'
  }
});

const viewerContainer = ref(null);
let talkingHead = null;
let audioContext = null;
let audioSourceNode = null;
let gainNode = null;

// Debug flag - set to true to enable detailed logging
const DEBUG = true;

// --- Helper functions ---
const log = (message, ...args) => {
  if (DEBUG) {
    console.log(`[TalkingHeadViewer] ${message}`, ...args);
  }
};

// Viseme and word tracking for lipsync
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

// --- Buffer management for lip-sync and audio ---
// Match buffers exactly as in the example file
let visemeBuffer = {
  visemes: [],
  vtimes: [],
  vdurations: []
};
let prevViseme = null;
let wordBuffer = {
  words: [],
  wtimes: [],
  wdurations: []
};
let lipsyncType = "visemes"; // Default to visemes mode

// Reset buffers between speech segments
const resetBuffers = () => {
  visemeBuffer = {
    visemes: [],
    vtimes: [],
    vdurations: []
  };
  prevViseme = null;
  wordBuffer = {
    words: [],
    wtimes: [],
    wdurations: []
  };
};

// Ensure audio context and worklet are properly initialized
const ensureAudioContextReady = async () => {
  if (!talkingHead) {
    console.error("TalkingHead not initialized");
    return false;
  }
  
  try {
    if (talkingHead.audioCtx && talkingHead.audioCtx.state === "suspended") {
      await talkingHead.audioCtx.resume();
    }
    return true;
  } catch (error) {
    console.error("Error initializing audio context:", error);
    return false;
  }
};

// --- Exposed Methods ---
// Method to ensure audio context is resumed - this needs to be called on user interaction
const resumeAudioContext = async () => {
  if (!talkingHead) return false;
  
  try {
    // Access and resume the audio context from the TalkingHead instance
    if (talkingHead.audioCtx && talkingHead.audioCtx.state === "suspended") {
      await talkingHead.audioCtx.resume();
      return true;
    }
    return true; // Already running
  } catch (error) {
    console.error("Error resuming audio context:", error);
    return false;
  }
};

// Method for handling viseme data (called by parent component)
const processViseme = (visemeId, audioOffset) => {
  if (!talkingHead || !talkingHead.isStreaming) return;
  
  const vtime = audioOffset / 10000; // Convert to milliseconds
  const viseme = visemeMap[visemeId];
  
  // Process viseme data exactly as in example
  if (prevViseme) {
    let vduration = vtime - prevViseme.vtime;
    if (vduration < 40) vduration = 40; // Minimum duration
    
    visemeBuffer.visemes.push(prevViseme.viseme);
    visemeBuffer.vtimes.push(prevViseme.vtime);
    visemeBuffer.vdurations.push(vduration);
  }
  
  prevViseme = { viseme, vtime };
};

// Process final viseme (called when speech synthesis is complete)
const processFinalViseme = () => {
  if (prevViseme) {
    // Add final viseme with estimated duration - same as example
    const finalDuration = 100;
    visemeBuffer.visemes.push(prevViseme.viseme);
    visemeBuffer.vtimes.push(prevViseme.vtime);
    visemeBuffer.vdurations.push(finalDuration);
    
    // Clear the last viseme
    prevViseme = null;
  }
  
  // Send any remaining data
  let finalData = {};
  
  // Mirror example file logic for final data
  if (visemeBuffer.visemes.length) {
    finalData.visemes = visemeBuffer.visemes.splice(0, visemeBuffer.visemes.length);
    finalData.vtimes = visemeBuffer.vtimes.splice(0, visemeBuffer.vtimes.length);
    finalData.vdurations = visemeBuffer.vdurations.splice(0, visemeBuffer.vdurations.length);
  }
  
  // Stream words always for subtitles
  finalData.words = wordBuffer.words.splice(0, wordBuffer.words.length);
  finalData.wtimes = wordBuffer.wtimes.splice(0, wordBuffer.wtimes.length);
  finalData.wdurations = wordBuffer.wdurations.splice(0, wordBuffer.wdurations.length);
  
  if (finalData.visemes || finalData.words) {
    // If we have any visemes or words left, stream them
    finalData.audio = null;
    talkingHead.streamAudio(finalData);
  }
  
  // Notify the end of streaming
  talkingHead.streamNotifyEnd();
  
  // Reset buffers
  resetBuffers();
};

// Method for handling word boundary data
const processWordBoundary = (text, audioOffset, duration, boundaryType) => {
  const time = audioOffset / 10000;
  const durationMs = duration / 10000;
  
  // Match exactly the example file logic
  if (boundaryType === "PunctuationBoundary" && wordBuffer.words.length) {
    // Append punctuation to previous word
    wordBuffer.words[wordBuffer.words.length - 1] += text;
    wordBuffer.wdurations[wordBuffer.wdurations.length - 1] += durationMs;
  } else if (boundaryType === "WordBoundary" || boundaryType === "PunctuationBoundary") {
    wordBuffer.words.push(text);
    wordBuffer.wtimes.push(time);
    wordBuffer.wdurations.push(durationMs);
  }
};

// Add variables to maintain accumulated audio data
const audioChunks = ref([]);
const isPlayingAccumulatedAudio = ref(false);

// Method to collect all audio chunks and play them as one continuous stream
const playAccumulatedAudioChunks = async () => {
  if (!audioChunks.value.length) {
    return;
  }

  if (isPlayingAccumulatedAudio.value) {
    return;
  }
  
  try {
    isPlayingAccumulatedAudio.value = true;
    
    // Create a new audio context for the continuous playback
    if (!window.__continuousAudioContext) {
      window.__continuousAudioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    if (window.__continuousAudioContext.state === "suspended") {
      await window.__continuousAudioContext.resume();
    }
    
    // Calculate total size
    const totalSize = audioChunks.value.reduce((total, chunk) => total + chunk.byteLength, 0);
    
    // Combine all chunks into one buffer
    const combinedBuffer = new Uint8Array(totalSize);
    let offset = 0;
    
    audioChunks.value.forEach(chunk => {
      const chunkView = new Uint8Array(chunk);
      combinedBuffer.set(chunkView, offset);
      offset += chunk.byteLength;
    });
    
    // Decode and play the combined buffer
    window.__continuousAudioContext.decodeAudioData(
      combinedBuffer.buffer,
      (decodedBuffer) => {
        const source = window.__continuousAudioContext.createBufferSource();
        source.buffer = decodedBuffer;
        
        // Add gain control
        const gainNode = window.__continuousAudioContext.createGain();
        gainNode.gain.value = 1.0; // Full volume
        
        // Connect the nodes
        source.connect(gainNode);
        gainNode.connect(window.__continuousAudioContext.destination);
        
        // Start playback
        source.start(0);
        
        // Handle playback completion
        source.onended = () => {
          isPlayingAccumulatedAudio.value = false;
          // Clear the chunks after playback
          audioChunks.value = [];
        };
      },
      (error) => {
        isPlayingAccumulatedAudio.value = false;
      }
    );
  } catch (error) {
    isPlayingAccumulatedAudio.value = false;
  }
};

// Method to play audio chunks
const playAudioChunk = (audioData) => {
  if (!talkingHead || !talkingHead.isStreaming) {
    return;
  }
  
  try {
    if (!audioData || audioData.byteLength === 0) {
      return;
    }
    
    // Process lip sync data but don't send audio to TalkingHead
    switch (lipsyncType) {
      case "blendshapes":
        talkingHead.streamAudio({
          anims: azureBlendShapes?.sbuffer.splice(0, azureBlendShapes?.sbuffer.length)
        });
        break;
      case "visemes":
        talkingHead.streamAudio({
          visemes: visemeBuffer.visemes.splice(0, visemeBuffer.visemes.length),
          vtimes: visemeBuffer.vtimes.splice(0, visemeBuffer.vtimes.length),
          vdurations: visemeBuffer.vdurations.splice(0, visemeBuffer.vdurations.length),
        });
        break;
      case "words":
        talkingHead.streamAudio({
          words: wordBuffer.words.splice(0, wordBuffer.words.length),
          wtimes: wordBuffer.wtimes.splice(0, wordBuffer.wtimes.length),
          wdurations: wordBuffer.wdurations.splice(0, wordBuffer.wdurations.length)
        });
        break;
      default:
        console.error(`Unknown animation mode: ${lipsyncType}`);
    }
    
    // Collect audio chunks for accumulated playback at the end
    audioChunks.value.push(audioData);
  } catch (error) {
    console.error("Error processing animation data:", error);
  }
};

const reset = () => {
  if (talkingHead) {
    try {
      // Stop any ongoing speech
      if (talkingHead.isSpeaking) {
        talkingHead.streamStop();
      }
      resetBuffers();
    } catch (error) {
      console.error("Error resetting TalkingHead:", error);
    }
  }
};

// Start streaming mode to prepare for audio chunks
const startStreaming = async () => {
  if (!talkingHead) {
    return false;
  }
  
  try {
    // Reset buffers for new speech
    resetBuffers();
    
    talkingHead.streamStart(
      { 
        sampleRate: 48000, // 48kHz sample rate for Azure Raw48Khz16BitMonoPcm
        mood: "neutral",
        gain: 0.5, 
        lipsyncType: lipsyncType 
      },
      // Start callback - called when audio playback starts
      () => {
        // Could add subtitles reset here if needed
      },
      // End callback - called when audio playback ends
      () => {
        // Could handle subtitle cleanup here if needed
      },
      // Subtitle callback
      (subtitleText) => {
        // Could display subtitles here if needed
      }
    );
    
    return true;
  } catch (error) {
    return false;
  }
};

// --- Lifecycle Hooks ---
onMounted(async () => {
  if (!viewerContainer.value) return;

  try {
    // Initialize TalkingHead with the container DOM element
    talkingHead = new TalkingHead(viewerContainer.value, {
      ttsEndpoint: 'placeholder', // Dummy values to satisfy constructor
      jwtGet: () => 'dummy-token',
      avatarMood: "happy", // Changed from neutral to happy for more enthusiastic expression
      ttsRate: 1.1,         // Slightly faster speech rate for more energy
      ttsPitch: 0.2,        // Higher pitch for more enthusiasm and energy
      ttsVolume: 0.2,       // Slightly louder for more presence
      modelMovementFactor: 1.3,  // More movement to appear more dynamic and energetic
      avatarIdleEyeContact: 0.9,   // More eye contact when idle
      avatarIdleHeadMove: 0.7,     // More head movement when idle for energetic appearance
      avatarSpeakingEyeContact: 1.0,  // Maximum eye contact during speech
      avatarSpeakingHeadMove: 0.8,   // More dynamic head movement while speaking
      cameraView: "upper",          // Upper body view like in the example
      lookAtCamera: true,           // Ensure the avatar focuses on the camera/user
      lightDirectIntensity: 35      // Brighter lighting for more vibrant appearance
    });
    
    // Load the model/avatar with male body type, happy mood, and language settings
    await talkingHead.showAvatar({ 
      url: props.modelUrl,
      body: 'M',              // Specify male body type
      avatarMood: "happy",    // Set the avatar's mood to happy
      ttsLang: "en-US",       // Set language to English
      lipsyncLang: "en",       // Set lipsync language to English
      lookAtCamera: true // Ensure the avatar focuses on the camera/user
    });
    
    // Set initial head position to look straight at camera
    if (talkingHead.avatar && talkingHead.avatar.lookAt) {
      talkingHead.avatar.lookAt({x: 0, y: 0, z: 1}); // Look straight ahead
    }
    
    // Make the avatar smile, wave and say "Hi" after loading
    setTimeout(async () => {
      if (talkingHead) {
        // Make sure audio context is resumed for speech to work
        if (talkingHead.audioCtx && talkingHead.audioCtx.state === "suspended") {
          await talkingHead.audioCtx.resume();
        }
        
        // Get user information from auth store
        const authStore = useAuthStore();
        const firstName = authStore.user?.firstName || 'there';
        
        // First make the avatar smile using the emoji
        // This will trigger the smile facial expression
        //talkingHead.speakEmoji("😊"); // Use the smile with eyes emoji for a friendly expression
        
        // Small delay before waving
        setTimeout(() => {
          // Make the avatar wave by playing the handup gesture
          // Duration 3 seconds, no mirroring, 800ms transition time
          talkingHead.playGesture("handup", 3, false, 800);
          
          // Create the greeting message with the user's name
          const greeting = `Hi ${firstName}!`;
          
          // Emit the greeting event for the parent component to handle speech
          setTimeout(() => {
            // Emit 'speak' event following the same pattern as AzureSpeechControls
            emit('speak', greeting);
          }, 500);
        }, 800); // Wait a moment after smile before waving
      }
    }, 1000); // Wait 1 second after avatar loads before starting animation sequence
    
  } catch (error) {
    console.error('Error initializing TalkingHead:', error);
  }
});

onUnmounted(() => {
  if (talkingHead) {
    try {
      // Stop any ongoing speech
      if (talkingHead.isStreaming) {
        talkingHead.streamStop();
      }
      
      // Stop animation and clean up
      talkingHead.stop();
    } catch (error) {
      console.error("Error cleaning up TalkingHead:", error);
    }
  }
  
  resetBuffers();
  talkingHead = null;
});

// Expose methods for parent component to call
defineExpose({
  playAudioChunk,
  playAccumulatedAudioChunks,
  processViseme,
  processWordBoundary,
  processFinalViseme,
  startStreaming,
  reset,
  resumeAudioContext
});
</script>

<style scoped>
.viewer-container {
  width: 100%;
  height: 100%; /* Set a fixed height */
  min-height: 300px;
  position: relative; /* Needed for potential overlays */
  overflow: hidden; /* Ensure canvas doesn't overflow */
  background-image: url('../../public/images/background/DarkBackground.png'); /* Optional background image */
  background-size: cover; /* Cover the entire container */
  background-position: center; /* Center the background image */
}
</style>