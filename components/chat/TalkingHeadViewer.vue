<template>
  <div ref="viewerContainer" class="viewer-container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, defineExpose } from 'vue';
import { TalkingHead } from '~/libs/talkinghead.mjs';

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

// Method to play audio chunks - core function that needs fixing
const playAudioChunk = (audioData) => {
  if (!talkingHead || !talkingHead.isStreaming) {
    console.warn("TalkingHead not streaming, cannot play audio");
    return;
  }
  
  try {
    // Following exactly the example file approach
    switch (lipsyncType) {
      case "visemes":
        talkingHead.streamAudio({
          audio: audioData,
          visemes: visemeBuffer.visemes.splice(0, visemeBuffer.visemes.length),
          vtimes: visemeBuffer.vtimes.splice(0, visemeBuffer.vtimes.length),
          vdurations: visemeBuffer.vdurations.splice(0, visemeBuffer.vdurations.length),
        });
        break;
      case "words":
        talkingHead.streamAudio({
          audio: audioData,
          words: wordBuffer.words.splice(0, wordBuffer.words.length),
          wtimes: wordBuffer.wtimes.splice(0, wordBuffer.wtimes.length),
          wdurations: wordBuffer.wdurations.splice(0, wordBuffer.wdurations.length)
        });
        break;
      default:
        console.error(`Unknown animation mode: ${lipsyncType}`);
    }
    
    log("Audio chunk sent to TalkingHead");
  } catch (error) {
    console.error("Error playing audio chunk:", error);
  }
};

const reset = () => {
  console.log("Resetting TalkingHead state");
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
    console.error("TalkingHead not initialized");
    return false;
  }
  
  try {
    // Reset buffers for new speech
    resetBuffers();
    
    // Mirror example file exactly
    talkingHead.streamStart(
      { 
        sampleRate: 48000, // 48kHz sample rate for Azure Raw48Khz16BitMonoPcm
        mood: "neutral",
        gain: 0.5, 
        lipsyncType: lipsyncType 
      },
      // Start callback - called when audio playback starts
      () => {
        console.log("TalkingHead audio playback started");
        // Could add subtitles reset here if needed
      },
      // End callback - called when audio playback ends
      () => {
        console.log("TalkingHead audio playback ended");
        // Could handle subtitle cleanup here if needed
      },
      // Subtitle callback
      (subtitleText) => {
        console.log("Subtitle text:", subtitleText);
        // Could display subtitles here if needed
      }
    );
    
    return true;
  } catch (error) {
    console.error("Error starting TalkingHead streaming:", error);
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
      avatarIdleEyeContact: 0.5,
      avatarIdleHeadMove: 0.5,
      avatarSpeakingEyeContact: 0.8,
      avatarSpeakingHeadMove: 0.8,
      cameraView: "upper" // Upper body view like in the example
    });

    console.log('TalkingHead initialized.');
    
    // Load the model/avatar
    await talkingHead.showAvatar({ url: props.modelUrl });
    console.log('Avatar loaded successfully');
    
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
  processViseme,
  processWordBoundary,
  processFinalViseme,
  startStreaming,
  reset
});
</script>

<style scoped>
.viewer-container {
  width: 100%;
  height: 400px; /* Set a fixed height */
  min-height: 300px;
  max-height: 500px; /* Add maximum height */
  background-color: #f0f0f0;
  position: relative; /* Needed for potential overlays */
  overflow: hidden; /* Ensure canvas doesn't overflow */
}
</style>