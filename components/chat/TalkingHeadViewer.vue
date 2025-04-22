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

// Buffers for visemes, words and durations
let visemeBuffer = {
  visemes: [],
  vtimes: [],
  vdurations: []
};
let wordBuffer = {
  words: [],
  wtimes: [],
  wdurations: []
};
let prevViseme = null;

// Reset buffers for new speech
const resetBuffers = () => {
  visemeBuffer = {
    visemes: [],
    vtimes: [],
    vdurations: []
  };
  wordBuffer = {
    words: [],
    wtimes: [],
    wdurations: []
  };
  prevViseme = null;
};

// Method for handling viseme data
const processViseme = (visemeId, audioOffset) => {
  if (!talkingHead || !talkingHead.isStreaming) return;
  
  const vtime = audioOffset / 10000; // Convert to milliseconds
  const viseme = visemeMap[visemeId];
  
  if (prevViseme) {
    let vduration = vtime - prevViseme.vtime;
    if (vduration < 40) vduration = 40; // Minimum duration
    
    visemeBuffer.visemes.push(prevViseme.viseme);
    visemeBuffer.vtimes.push(prevViseme.vtime);
    visemeBuffer.vdurations.push(vduration);
  }
  
  prevViseme = { viseme, vtime };
};

// Method for handling word boundary data
const processWordBoundary = (text, audioOffset, duration, boundaryType) => {
  const time = audioOffset / 10000;
  const durationMs = duration / 10000;
  
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

// --- Exposed Methods ---
const processAudioChunk = (audioData) => {
  // Process audio chunks for animation - called by parent component
  if (!talkingHead || !talkingHead.isStreaming) {
    console.warn("TalkingHead not streaming, cannot process viseme");
    return;
  }
  
  // This method may be called by Azure TTS but we only need to track visemes
  // The audio playback is handled separately
};

// Method to play audio chunks
const playAudioChunk = (audioData) => {
  if (!talkingHead || !talkingHead.isStreaming) {
    console.warn("TalkingHead not streaming, cannot play audio");
    return;
  }
  
  try {
    // Send both audio and accumulated viseme data to TalkingHead
    const streamData = {
      audio: audioData
    };
    
    // Add any accumulated viseme data
    if (visemeBuffer.visemes.length > 0) {
      streamData.visemes = [...visemeBuffer.visemes];
      streamData.vtimes = [...visemeBuffer.vtimes];
      streamData.vdurations = [...visemeBuffer.vdurations];
      
      // Clear the buffer after sending
      visemeBuffer.visemes = [];
      visemeBuffer.vtimes = [];
      visemeBuffer.vdurations = [];
    }
    
    // Add any accumulated word data (for subtitles)
    if (wordBuffer.words.length > 0) {
      streamData.words = [...wordBuffer.words];
      streamData.wtimes = [...wordBuffer.wtimes];
      streamData.wdurations = [...wordBuffer.wdurations];
      
      // Clear the buffer after sending
      wordBuffer.words = [];
      wordBuffer.wtimes = [];
      wordBuffer.wdurations = [];
    }
    
    // Send to TalkingHead (this will handle both animation and audio)
    talkingHead.streamAudio(streamData);
    
    log("Audio chunk sent to TalkingHead");
    
    // Let TalkingHead handle audio playback internally - don't use Web Audio API directly
  } catch (error) {
    console.error("Error playing audio chunk:", error);
  }
};

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
  if (visemeBuffer.visemes.length > 0 || wordBuffer.words.length > 0) {
    const finalData = {};
    
    if (visemeBuffer.visemes.length > 0) {
      finalData.visemes = [...visemeBuffer.visemes];
      finalData.vtimes = [...visemeBuffer.vtimes];
      finalData.vdurations = [...visemeBuffer.vdurations];
    }
    
    if (wordBuffer.words.length > 0) {
      finalData.words = [...wordBuffer.words];
      finalData.wtimes = [...wordBuffer.wtimes];
      finalData.wdurations = [...wordBuffer.wdurations];
    }
    
    // Send final data without audio
    finalData.audio = null;
    talkingHead.streamAudio(finalData);
  }
  
  // Notify the end of streaming
  talkingHead.streamNotifyEnd();
  
  // Reset buffers
  resetBuffers();
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
const startStreaming = () => {
  if (!talkingHead) {
    console.error("TalkingHead not initialized");
    return false;
  }
  
  try {
    // Reset buffers for new speech
    resetBuffers();
    
    // Start streaming mode with appropriate callbacks
    talkingHead.streamStart({
      sampleRate: 48000,  // Make sure we match the audio format from Azure
      gain: 1.0, // Full volume
      lipsyncLang: 'en',
      mood: 'neutral'
    }, 
    // Start callback - called when audio playback starts
    () => {
      console.log("TalkingHead audio playback started");
    },
    // End callback - called when audio playback ends
    () => {
      console.log("TalkingHead audio playback ended");
    },
    // Subtitle callback - called when a subtitle should be displayed
    (subtitleText) => {
      console.log("Subtitle text:", subtitleText);
    });
    
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
  processAudioChunk,
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