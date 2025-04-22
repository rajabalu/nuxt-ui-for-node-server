<template>
    <div ref="viewerContainer" class="viewer-container"></div>
  </template>
  
  <script setup>
  import { ref, onMounted, onUnmounted, defineExpose } from 'vue';
  import * as THREE from 'three';
  import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
  // Adjust path based on where you placed the TalkingHead library
  import { TalkingHead } from '~/libs/talkinghead.mjs';
  
  const props = defineProps({
    modelUrl: {
      type: String,
      required: true,
      default: '/public/models/Leo.glb' // Default path in public folder
    }
  });
  
  const viewerContainer = ref(null);
  
  let scene, camera, renderer, clock, mixer, talkingHead, audioContext, gainNode;
  let animationFrameId = null;
  let loadedModel = null;
  const audioBufferQueue = [];
  let isPlaying = false;
  let startTime = 0;
  let audioQueueOffset = 0; // Track offset for queued audio
  
  const init = () => {
    if (!viewerContainer.value) return;
  
    // --- Basic Three.js Setup ---
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xeeeeee);
    camera = new THREE.PerspectiveCamera(50, viewerContainer.value.clientWidth / viewerContainer.value.clientHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 3); // Adjust camera position as needed
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(viewerContainer.value.clientWidth, viewerContainer.value.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    viewerContainer.value.appendChild(renderer.domElement);
    clock = new THREE.Clock();
  
    // --- Lights ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
  
    // --- Web Audio API Setup ---
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    gainNode = audioContext.createGain();
    gainNode.gain.value = 1.0; // Adjust volume if needed
    gainNode.connect(audioContext.destination);
  
  
    // --- Load Model ---
    const loader = new GLTFLoader();
    loader.load(
      props.modelUrl,
      (gltf) => {
        loadedModel = gltf.scene;
        scene.add(loadedModel);
  
        // Adjust model position/scale if necessary
        loadedModel.position.set(0, 0, 0);
        loadedModel.scale.set(1, 1, 1);
  
        // --- TalkingHead Setup ---
        // Assuming TalkingHead can find necessary blendshapes on the loaded model
        talkingHead = new TalkingHead(loadedModel, camera);
        console.log('TalkingHead initialized.');
  
        startAnimationLoop(); // Start animation only after model and TalkingHead are ready
      },
      undefined, // Progress callback (optional)
      (error) => {
        console.error('Error loading GLTF model:', error);
      }
    );
  
    // --- Handle Resize ---
    window.addEventListener('resize', onWindowResize);
  };
  
  const onWindowResize = () => {
    if (!renderer || !camera || !viewerContainer.value) return;
    camera.aspect = viewerContainer.value.clientWidth / viewerContainer.value.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(viewerContainer.value.clientWidth, viewerContainer.value.clientHeight);
  };
  
  const startAnimationLoop = () => {
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const deltaTime = clock.getDelta();
  
      if (talkingHead) {
        talkingHead.update(deltaTime); // Update blendshapes based on audio analysis
      }
      if (mixer) {
        mixer.update(deltaTime); // Update other animations if any
      }
  
      renderer.render(scene, camera);
    };
    animate();
  };
  
  const stopAnimationLoop = () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  };
  
  // --- Exposed Methods ---
  
  // Method to process audio data for facial animation
  const processAudioChunk = (audioData) => {
    if (talkingHead) {
      // console.log("Processing audio chunk for animation:", audioData.byteLength);
      // TalkingHead likely needs Float32Array, Azure SDK might give ArrayBuffer
      // You might need conversion depending on TalkingHead's exact input requirement
      // Assuming TalkingHead's processAudioChunk handles ArrayBuffer or you adapt it
      talkingHead.processAudioChunk(audioData);
    } else {
      console.warn("TalkingHead not initialized yet, cannot process audio chunk.");
    }
  };
  
  // Method to queue and play audio chunks seamlessly
  const playAudioChunk = async (audioData) => {
    if (!audioContext || !gainNode) return;
  
    try {
      // Decode the ArrayBuffer into an AudioBuffer
      const audioBuffer = await audioContext.decodeAudioData(audioData.slice(0)); // Use slice(0) to create a copy
  
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(gainNode);
  
      const currentTime = audioContext.currentTime;
  
      // Calculate start time for this chunk
      // If queue is empty and not playing, start immediately
      // Otherwise, schedule it after the last queued buffer
      const scheduledTime = isPlaying ? Math.max(currentTime, startTime + audioQueueOffset) : currentTime;
  
      source.start(scheduledTime);
      // console.log(`Scheduling chunk ${audioBufferQueue.length + 1} at ${scheduledTime.toFixed(2)}s (duration: ${audioBuffer.duration.toFixed(2)}s)`);
  
      // Update the offset for the next buffer
      audioQueueOffset = scheduledTime - startTime + audioBuffer.duration;
  
      // Store the source and its end time
      audioBufferQueue.push({ source, endTime: scheduledTime + audioBuffer.duration });
  
      if (!isPlaying) {
          isPlaying = true;
          startTime = currentTime; // Set the overall start time
          audioQueueOffset = audioBuffer.duration; // Initialize offset
      }
  
      // Cleanup finished sources (optional but good practice)
      source.onended = () => {
          // console.log("Audio chunk finished playing.");
          const index = audioBufferQueue.findIndex(item => item.source === source);
          if (index !== -1) {
              audioBufferQueue.splice(index, 1);
          }
          // If the queue becomes empty, reset playback state
          if (audioBufferQueue.length === 0) {
              // console.log("Audio queue empty.");
              resetPlaybackState();
          }
      };
  
  
    } catch (error) {
      console.error('Error decoding or playing audio data:', error);
    }
  };
  
  const resetPlaybackState = () => {
      console.log("Resetting playback state.");
      isPlaying = false;
      startTime = 0;
      audioQueueOffset = 0;
      // Ensure queue is clear in case of abrupt stop/error
      while(audioBufferQueue.length > 0) {
          const item = audioBufferQueue.shift();
          try { item.source.stop(); } catch(e) {} // Stop any remaining sources
      }
      if (audioContext && audioContext.state === 'suspended') {
         audioContext.resume(); // Ensure context is running for next time
      }
  };
  
  const reset = () => {
      console.log("Resetting TalkingHeadViewer state.");
      resetPlaybackState();
      if (talkingHead) {
          // Add any specific reset logic needed for TalkingHead library
          // e.g., talkingHead.resetExpression();
      }
      // Any other state to reset in the viewer
  }
  
  // --- Lifecycle Hooks ---
  onMounted(() => {
    // Ensure Web Audio starts after user interaction (usually fine in Nuxt if triggered by button)
    // But good practice to resume if suspended
    document.addEventListener('click', () => {
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }, { once: true });
  
    init();
  });
  
  onUnmounted(() => {
    stopAnimationLoop();
    window.removeEventListener('resize', onWindowResize);
    resetPlaybackState(); // Stop any ongoing audio
    if (audioContext) {
      audioContext.close().catch(e => console.error("Error closing AudioContext:", e)); // Close audio context
    }
    if (renderer) {
       renderer.dispose(); // Dispose Three.js resources
    }
    if (viewerContainer.value && renderer) {
      viewerContainer.value.removeChild(renderer.domElement); // Clean up DOM
    }
    // Add cleanup for scene, geometry, materials if needed
    scene = null;
    camera = null;
    renderer = null;
    clock = null;
    mixer = null;
    talkingHead = null;
    audioContext = null;
    gainNode = null;
    loadedModel = null;
  });
  
  // Expose methods for parent component to call
  defineExpose({
    processAudioChunk,
    playAudioChunk,
    reset // Expose reset method
  });
  
  </script>
  
  <style scoped>
  .viewer-container {
    width: 100%;
    /* height: 400px; */ /* Or set based on parent */
    min-height: 300px;
    background-color: #f0f0f0;
    position: relative; /* Needed for potential overlays */
    overflow: hidden; /* Ensure canvas doesn't overflow */
  }
  </style>