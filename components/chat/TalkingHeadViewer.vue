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

// --- Exposed Methods ---
const processAudioChunk = (audioData) => {
  if (talkingHead && talkingHead.streamAudio) {
    try {
      // Create audio data object in the format expected by TalkingHead
      const audioObj = {
        audio: audioData
      };
      
      // Use the streamAudio method that accepts raw audio data
      talkingHead.streamAudio(audioObj);
    } catch (error) {
      console.error("Error processing audio chunk:", error);
    }
  } else {
    console.warn("TalkingHead not fully initialized yet, cannot process audio chunk.");
  }
};

// Method to play audio chunks (delegating to TalkingHead's internal audio system)
const playAudioChunk = (audioData) => {
  // The library will handle audio playback internally as part of streamAudio
  // No need to handle it separately
  console.log("Audio handled by TalkingHead's internal audio system");
};

const reset = () => {
  console.log("Resetting TalkingHead state");
  if (talkingHead) {
    try {
      // Stop any ongoing speech
      if (talkingHead.isSpeaking) {
        talkingHead.streamStop();
      }
    } catch (error) {
      console.error("Error resetting TalkingHead:", error);
    }
  }
};

// --- Lifecycle Hooks ---
onMounted(async () => {
  if (!viewerContainer.value) return;

  try {
    // Create audio context for TalkingHead to use
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Initialize TalkingHead with the container DOM element
    talkingHead = new TalkingHead(viewerContainer.value, {
      ttsEndpoint: 'placeholder', // Dummy values to satisfy constructor
      jwtGet: () => 'dummy-token',
      avatarIdleEyeContact: 0.5,
      avatarIdleHeadMove: 0.5,
      avatarSpeakingEyeContact: 0.8,
      avatarSpeakingHeadMove: 0.8
    });

    console.log('TalkingHead initialized.');
    
    // Load the model/avatar
    await talkingHead.showAvatar({ url: props.modelUrl });
    
    // Start TalkingHead in stream mode
    await talkingHead.streamStart({
      gain: 1.0,
      lipsyncLang: 'en',
    });
    
    console.log('TalkingHead ready for streaming.');
  } catch (error) {
    console.error('Error initializing TalkingHead:', error);
  }
});

onUnmounted(() => {
  if (talkingHead) {
    try {
      // Stop any ongoing speech
      if (talkingHead.isSpeaking) {
        talkingHead.streamStop();
      }
      
      // Stop animation and clean up
      talkingHead.stop();
    } catch (error) {
      console.error("Error cleaning up TalkingHead:", error);
    }
  }
  
  if (audioContext) {
    audioContext.close().catch(e => console.error("Error closing AudioContext:", e));
  }
  
  talkingHead = null;
  audioContext = null;
});

// Expose methods for parent component to call
defineExpose({
  processAudioChunk,
  playAudioChunk,
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