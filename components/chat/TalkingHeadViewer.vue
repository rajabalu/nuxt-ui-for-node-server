<template>
  <div ref="viewerContainer" class="viewer-container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, defineExpose, defineEmits, computed, watch } from 'vue';
import { TalkingHead } from '~/libs/talkinghead.mjs';
import { useAuthStore } from '~/stores/auth'; // Import auth store
import { useI18n } from 'vue-i18n'; // Import i18n composable
import { useGlobal } from '~/stores/global'; // Import global store for avatars
import { useUserPreferences } from '~/stores/userPreferences'; // Import user preferences

// Debug flag for verbose logging
const DEBUG = false;
// Daily greeting timestamp key for localStorage
const DAILY_GREETING_KEY = 'talking_head_daily_greeting';

const { t } = useI18n(); // Initialize i18n
const emit = defineEmits(['speak']);
const globalStore = useGlobal();
const userPreferencesStore = useUserPreferences();

// Get the avatar model URL based on user preferences
const avatarModelUrl = computed(() => {
  // Get avatar ID from user preferences, default to the one in global store if not found
  const avatarId = userPreferencesStore.getAdditionalSetting('avatarId', globalStore.selectedAvatarId);
  // Find the selected avatar from global store
  const selectedAvatar = globalStore.AVAILABLE_AVATARS.find(avatar => avatar.id === avatarId);
  // Return the model path if avatar exists, otherwise default to Leo
  return selectedAvatar?.modelPath || '/models/Leo.glb';
});

// Get recommended settings for the current avatar
const avatarSettings = computed(() => {
  const avatarId = userPreferencesStore.getAdditionalSetting('avatarId', globalStore.selectedAvatarId);
  const selectedAvatar = globalStore.AVAILABLE_AVATARS.find(avatar => avatar.id === avatarId);
  return selectedAvatar?.settings || globalStore.AVAILABLE_AVATARS[1]?.settings || {}; // Default to Leo settings
});

// Use avatar-specific voice for speech synthesis
const avatarVoice = computed(() => avatarSettings.value.voice || 'en-AU-WilliamNeural');

// Use selected language for lip-sync
const selectedLanguage = computed(() => {
  return userPreferencesStore.language || 'en';
});

// Map i18n language codes to lip-sync language codes
const getLipSyncLanguage = (langCode) => {
  const lipSyncMap = {
    'en': 'en', // English
    'hi': 'en', // Hindi - fallback to English if no specific Hindi lip-sync
    'ar': 'en', // Arabic - fallback to English if no specific Arabic lip-sync
    // Add more mappings as needed for other languages with specific lip-sync modules
  };
  
  return lipSyncMap[langCode] || 'en'; // Default to English if no mapping found
};

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

const props = defineProps({
  modelUrl: {
    type: String,
    required: false,
    default: null // No longer a required prop since we'll use computed property
  },
  mood: { type: String, default: 'neutral' }
});

const viewerContainer = ref(null);
let talkingHead = null;
let audioContext = null;
let audioSourceNode = null;
let gainNode = null;

// Function to check if we should greet the user today
const shouldGreetUser = () => {
  try {
    const lastGreetingTimestamp = localStorage.getItem(DAILY_GREETING_KEY);
    if (!lastGreetingTimestamp) return true;

    const now = new Date();
    const lastGreetingDate = new Date(parseInt(lastGreetingTimestamp, 10));

    // Check if the last greeting was on a different day
    return now.toDateString() !== lastGreetingDate.toDateString();
  } catch (error) {
    console.error('Error checking greeting status:', error);
    return true; // Default to greeting on error
  }
};

// Function to update the greeting timestamp
const updateGreetingTimestamp = () => {
  try {
    localStorage.setItem(DAILY_GREETING_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error saving greeting timestamp:', error);
  }
};

// --- Helper functions ---
const log = (message, ...args) => {
  if (DEBUG) {
    console.log(`[TalkingHeadViewer] ${message}`, ...args);
  }
};

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
    console.error("Error resuming audio context:", error);
    return false;
  }
};

// Method to be called when starting streaming mode
const startStreaming = async () => {
  if (!talkingHead) return false;
  
  try {
    // Explicitly reset any previous state
    reset();
    
    // Ensure audio context is ready and resumed
    await ensureAudioContextReady();
    
    // Force reset the audio worklet if it exists
    if (talkingHead.streamWorkletNode) {
      try {
        // Send reset command to clear any previous state
        talkingHead.streamWorkletNode.port.postMessage({ type: 'reset' });
        console.log("Audio worklet reset for new stream");
      } catch (error) {
        console.error("Error resetting audio worklet:", error);
      }
    }
    
    // Make sure worklet is created if it doesn't exist
    if (!talkingHead.workletLoaded && talkingHead.audioCtx) {
      console.log("Creating new audio worklet processor...");
      try {
        // Add the audio worklet module to the audio context
        await talkingHead.audioCtx.audioWorklet.addModule(new URL('../../libs/playback-worklet.js', import.meta.url).href);
        
        // Create the worklet node
        talkingHead.streamWorkletNode = new AudioWorkletNode(talkingHead.audioCtx, 'playback-worklet');
        
        // Connect it to the audio stream gain node
        talkingHead.streamWorkletNode.connect(talkingHead.audioStreamGainNode);
        
        // Add event listeners
        talkingHead.streamWorkletNode.port.onmessage = (event) => {
          if (event.data.type === 'playback-ended') {
            console.log("Playback ended");
          } else if (event.data.type === 'playback-started') {
            console.log("Playback started");
          }
        };
        
        talkingHead.workletLoaded = true;
      } catch (error) {
        console.error("Error loading audio worklet:", error);
        return false;
      }
    }
    
    // Start streaming with the proper language from user preferences
    await talkingHead.streamStart(
      {
        gain: 1.0,
        sampleRate: 16000,
        // Use the language from user preferences for lip-sync
        lipsyncLang: getLipSyncLanguage(selectedLanguage.value),
        lipsyncType: lipsyncType 
      },
      // Start callback - called when audio playback starts
      () => {
        // Could add subtitles reset here if needed
        console.log("Stream started callback");
      },
      // End callback - called when audio playback ends
      () => {
        // Could handle subtitle cleanup here if needed
        console.log("Stream ended callback");
      },
      // Subtitle callback
      (subtitleText) => {
        // Could display subtitles here if needed
        console.log("Subtitle:", subtitleText);
      }
    );

    return true;
  } catch (error) {
    console.error("Error starting stream:", error);
    return false;
  }
};

// Method for processing viseme data
const processViseme = (visemeId, audioOffset) => {
  const vtime = audioOffset / 10000; // Convert to appropriate time format
  
  // Convert Azure viseme ID to the proper format based on the viseme map
  const viseme = visemeMap[visemeId] || 'sil';
  
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

// Viseme map for Azure viseme ID to lip-sync viseme mapping
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

// Process final viseme (called when speech synthesis is complete)
const processFinalViseme = () => {
  if (prevViseme) {
    // Add final viseme with estimated duration
    const finalDuration = 100;
    visemeBuffer.visemes.push(prevViseme.viseme);
    visemeBuffer.vtimes.push(prevViseme.vtime);
    visemeBuffer.vdurations.push(finalDuration);

    // Clear the last viseme
    prevViseme = null;
  }

  // Send any remaining data
  let finalData = {};

  // Add visemes to final data if any
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
  // Only process words, not sentences or punctuation
  if (boundaryType === SpeechSDK?.SpeechSynthesisBoundaryType?.Word) {
    const wtime = audioOffset / 10000; // Convert to the format expected by TalkingHead
    const wduration = duration / 10000; // Convert duration to proper format
    
    // Add to word buffer for lip-sync/subtitles
    wordBuffer.words.push(text);
    wordBuffer.wtimes.push(wtime);
    wordBuffer.wdurations.push(wduration);
  }
};

// Play a chunk of audio during streaming
let audioChunks = []; // Buffer to collect audio chunks
const playAudioChunk = (audioData) => {
  if (!talkingHead || !talkingHead.streamWorkletNode) return;
  
  // Add audio chunk to buffer
  audioChunks.push(audioData);
};

// Play accumulated audio chunks
const playAccumulatedAudioChunks = () => {
  if (!talkingHead || !talkingHead.streamWorkletNode) return;
  
  // Process and reset buffers
  processBufferedAudio();
};

// Process the buffered audio
const processBufferedAudio = () => {
  if (!audioChunks.length) return;
  
  console.log(`Processing ${audioChunks.length} audio chunks`);
  
  // Process all the audio chunks that we've received
  let processedChunks = audioChunks.filter(chunk => chunk && chunk.byteLength > 0);
  audioChunks = []; // Clear the buffer
  
  // Concatenate all chunks into one buffer for better streaming performance
  if (processedChunks.length > 0) {
    try {
      console.log(`Streaming ${processedChunks.length} audio chunks`);
      
      // First, combine all the binary chunks into one Uint8Array
      const totalLength = processedChunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
      const combinedChunk = new Uint8Array(totalLength);
      
      let offset = 0;
      processedChunks.forEach(chunk => {
        combinedChunk.set(new Uint8Array(chunk), offset);
        offset += chunk.byteLength;
      });
      
      // Convert to 16-bit audio format (key step for proper audio playback)
      const int16Data = new Int16Array(combinedChunk.buffer);
      
      // Convert Int16Array to Float32Array for the AudioWorklet
      const float32Data = new Float32Array(int16Data.length);
      for (let i = 0; i < int16Data.length; i++) {
        // Normalize 16-bit integers to float range [-1.0, 1.0]
        float32Data[i] = int16Data[i] / 32768.0;
      }
      
      // Create audio object with the Float32Array for proper streaming
      const audioObj = { 
        audio: float32Data
      };
      
      console.log(`Converted audio data length: ${float32Data.length}`);
      
      // Stream the converted audio data
      if (talkingHead && talkingHead.streamWorkletNode) {
        // Send the audio data to the worklet with the correct message type
        talkingHead.streamWorkletNode.port.postMessage({
          type: 'audio-data',
          audio: float32Data
        });
      } else {
        console.error("talkingHead or streamWorkletNode not available");
      }
    } catch (error) {
      console.error("Error processing audio chunks:", error);
    }
  }
};

// Reset the viewer
const reset = () => {
  resetBuffers();
  audioChunks = [];
  
  if (talkingHead && talkingHead.isStreaming) {
    talkingHead.streamStop();
  }
};

// Resume audio context (helpful for browsers with autoplay restrictions)
const resumeAudioContext = async () => {
  return await ensureAudioContextReady();
};

// Initialize the component
onMounted(async () => {
  if (!viewerContainer.value) return;

  try {
    // Get avatar settings from the computed property
    const settings = avatarSettings.value;
    
    // Initialize TalkingHead with the container DOM element and avatar-specific settings
    talkingHead = new TalkingHead(viewerContainer.value, {
      ttsEndpoint: 'placeholder', // Dummy values to satisfy constructor
      jwtGet: () => 'dummy-token',
      avatarMood: settings.mood || "neutral", 
      ttsRate: 1.1,
      ttsPitch: 0.2,
      ttsVolume: 0.2,
      modelMovementFactor: 1.3,
      avatarIdleEyeContact: settings.avatarIdleEyeContact || 0.7,
      avatarIdleHeadMove: settings.avatarIdleHeadMove || 0.6,
      avatarSpeakingEyeContact: settings.avatarSpeakingEyeContact || 0.8,
      avatarSpeakingHeadMove: settings.avatarSpeakingHeadMove || 0.7,
      cameraView: settings.cameraView || "upper",
      lookAtCamera: true,
      lightDirectIntensity: 35,
      // Set the initial language from user preferences
      lipsyncLang: getLipSyncLanguage(selectedLanguage.value)
    });

    // Load the model/avatar based on user preferences
    await talkingHead.showAvatar({ 
      url: avatarModelUrl.value,
      body: settings.body || 'M',           
      avatarMood: settings.mood || "neutral",
      ttsLang: "en-US", // Default language, but we'll use the Azure voice selector
      lipsyncLang: getLipSyncLanguage(selectedLanguage.value),
      lookAtCamera: true
    });

    // Set initial head position to look straight at camera
    if (talkingHead.avatar && talkingHead.avatar.lookAt) {
      talkingHead.lookAtCamera(500);
    }
    
    // Check if we should greet the user
    const authStore = useAuthStore();
    if (shouldGreetUser() && authStore.isAuthenticated) {
      // Get user's first name if available
      const firstName = authStore.user?.firstName || '';
      
      // Create animations sequence - subtle wave followed by smile
      setTimeout(() => {
        // First, make the avatar smile
        talkingHead.playAnimation('🙂');
        
        // Then, after a brief delay, wave and speak
        setTimeout(() => {
          // Make the avatar wave
          // Duration 3 seconds, no mirroring, 800ms transition time
          talkingHead.playGesture("handup", 3, false, 800);

          // Create the greeting message with the user's name
          const greeting = t('greeting', { name: firstName }); // Use i18n for greeting message

          // Emit the greeting event for the parent component to handle speech
          setTimeout(() => {
            // Emit 'speak' event following the same pattern as AzureSpeechControls
            emit('speak', greeting);
            // Update the greeting timestamp
            updateGreetingTimestamp();
          }, 500);
        }, 800); // Wait a moment after smile before waving
      }, 1000); // Wait 1 second after avatar loads before starting animation sequence
    }
  } catch (error) {
    console.error('Error initializing TalkingHead:', error);
  }
});

// Watch for language changes to update lip-sync language
watch(selectedLanguage, (newLanguage, oldLanguage) => {
  if (talkingHead && newLanguage !== oldLanguage) {
    console.log(`Language changed from ${oldLanguage} to ${newLanguage}, updating lip-sync language`);
    
    // Update the lip-sync language directly on the TalkingHead instance
    if (talkingHead.streamLipsyncLang) {
      talkingHead.streamLipsyncLang = getLipSyncLanguage(newLanguage);
    }
    
    // If we have an avatar object, update its lipsyncLang property
    if (talkingHead.avatar) {
      talkingHead.avatar.lipsyncLang = getLipSyncLanguage(newLanguage);
    }
  }
});

onUnmounted(() => {
  if (talkingHead) {
    try {
      // Stop any ongoing speech
      if (talkingHead.isStreaming) {
        talkingHead.streamStop();
      }
      
      // Stop any ongoing speaking
      talkingHead.stopSpeaking();
      
      // Clean up resources
      if (talkingHead.dispose) {
        talkingHead.dispose();
      }
      talkingHead = null;
    } catch (error) {
      console.error('Error disposing TalkingHead:', error);
    }
  }
});

// Expose necessary methods and properties for parent components
defineExpose({
  startStreaming,
  processViseme,
  processFinalViseme,
  processWordBoundary,
  playAudioChunk,
  playAccumulatedAudioChunks,
  resumeAudioContext,
  reset,
  avatarVoice
});
</script>

<style scoped>
.viewer-container {
  width: 100%;
  min-height: 400px;
  position: relative; /* Needed for potential overlays */
  overflow: hidden; /* Ensure canvas doesn't overflow */
  background-image: url('../../public/images/background/DarkBackground.png'); /* Optional background image */
  background-size: cover; /* Cover the entire container */
  background-position: center; /* Center the background image */
  
  /* Adjust for smaller screens */
  @media (max-width: 600px) {
    min-height: 300px;
  }
  
  /* Create responsive behavior */
  @media (max-width: 480px) {
    min-height: 250px;
  }
}

/* Add loading overlay with responsive styling */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
  z-index: 10;
  
  @media (max-width: 600px) {
    font-size: 1rem;
  }
}
</style>