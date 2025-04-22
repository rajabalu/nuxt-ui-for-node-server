<template>
    <div>
  
      <!-- Use ClientOnly if TalkingHeadViewer causes SSR issues, -->
      <!-- but onMounted should generally handle client-side libs -->
      <ClientOnly>
        <TalkingHeadViewer ref="viewerRef" :model-url="modelPath" />
      </ClientOnly>
  
      <AzureSpeechControls
        :is-speaking="isSpeaking"
        :status="status"
        :error="error"
        @speak="handleSpeakRequest"
      />
  
      <div v-if="!azureCredentialsAvailable" class="error-message credentials-error">
        Azure Speech Key or Region not configured. Please check environment variables.
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, computed } from 'vue';
  import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
  import TalkingHeadViewer from './TalkingHeadViewer.vue';
  import AzureSpeechControls from './AzureSpeechControls.vue';
  
  // --- Configuration ---
  const config = useRuntimeConfig();
  const azureSpeechKey = config.public.AZURE_KEY;
  const azureSpeechRegion = config.public.AZURE_LOCATION;
  const modelPath = '/models/Leo.glb'; // Updated path to existing model in public/models folder
  const voiceName = "en-AU-WilliamNeural"; // Choose desired Azure voice
  
  // --- Component Refs ---
  const viewerRef = ref(null); // Ref to access TalkingHeadViewer methods
  
  // --- Reactive State ---
  const isSpeaking = ref(false);
  const status = ref('');
  const error = ref('');
  const azureCredentialsAvailable = computed(() => !!azureSpeechKey && !!azureSpeechRegion);
  
  let speechSynthesizer = null; // Keep synthesizer instance reusable if needed
  
  // --- Methods ---
  const initializeSpeechSynthesizer = () => {
    if (!azureCredentialsAvailable.value) {
        error.value = "Azure credentials are not configured.";
        console.error("Azure credentials missing.");
        return null;
    }
  
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(azureSpeechKey, azureSpeechRegion);
    speechConfig.speechSynthesisVoiceName = voiceName;
  
    // Set output format to MP3 for better compatibility
    speechConfig.speechSynthesisOutputFormat = SpeechSDK.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;
  
    // Create synthesizer with null AudioConfig to handle stream manually
    const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, null);
  
    // Handle audio data chunks during synthesis
    synthesizer.synthesizing = (sender, event) => {
      if (event.result && event.result.audioData) {
        if (event.result.audioData.byteLength === 0) {
          return;
        }
        
        // Make sure viewer exists before sending audio
        if (viewerRef.value) {
          try {
            // Ensure we're sending a copy of the audio data to avoid any reference issues
            const audioDataCopy = event.result.audioData.slice(0);
            viewerRef.value.playAudioChunk(audioDataCopy);
          } catch (error) {
            console.error("Error sending audio chunk to viewer:", error);
          }
        } else {
          console.error("Viewer reference not available for audio playback");
        }
      }
    };
  
    // Synthesis started
    synthesizer.synthesisStarted = () => {
      status.value = "Synthesis started...";
      isSpeaking.value = true;
      error.value = ''; // Clear previous errors
      
      if (viewerRef.value) {
        // Start streaming mode before sending audio
        viewerRef.value.startStreaming();
      }
    };
  
    // Viseme data handling for lip sync
    synthesizer.visemeReceived = (sender, event) => {
      if (viewerRef.value) {
        viewerRef.value.processViseme(event.visemeId, event.audioOffset);
      }
    };
    
    // Word boundary handling (for subtitles if needed)
    synthesizer.wordBoundary = (sender, event) => {
      if (viewerRef.value) {
        viewerRef.value.processWordBoundary(
          event.text,
          event.audioOffset,
          event.duration,
          event.boundaryType
        );
      }
    };
  
    // Synthesis completed
    synthesizer.synthesisCompleted = (sender, event) => {
      status.value = `Speech finished.`;
      
      // Play accumulated audio as one continuous stream - this is the key fix
      if (viewerRef.value && viewerRef.value.playAccumulatedAudioChunks) {
        viewerRef.value.playAccumulatedAudioChunks();
      }
      
      if (viewerRef.value) {
        // Process any final visemes and notify end of stream
        viewerRef.value.processFinalViseme();
      }
      
      isSpeaking.value = false;
    };
  
    // Synthesis canceled/error
    synthesizer.synthesisCanceled = (sender, event) => {
      const cancellation = SpeechSDK.CancellationDetails.fromResult(event.result);
      console.error(`Synthesis CANCELED: Reason=${cancellation.reason}`);
      
      let errorMsg = `Speech synthesis canceled. Reason: ${SpeechSDK.CancellationReason[cancellation.reason]}`;
      if (cancellation.reason === SpeechSDK.CancellationReason.Error) {
          console.error(`CANCELED: ErrorCode=${cancellation.ErrorCode}`);
          console.error(`CANCELED: ErrorDetails=[${cancellation.errorDetails}]`);
          errorMsg += ` Details: ${cancellation.errorDetails}`;
      }
      
      error.value = errorMsg;
      status.value = 'Speech failed.';
      isSpeaking.value = false;
      
      if (viewerRef.value) {
          viewerRef.value.reset();
      }
    };
  
    return synthesizer;
  };
  
  const handleSpeakRequest = async (textToSpeak) => {
    if (!azureCredentialsAvailable.value) {
      error.value = "Cannot speak: Azure credentials missing.";
      return;
    }
    if (!viewerRef.value) {
      error.value = "Cannot speak: Viewer not ready.";
      return;
    }
    if (isSpeaking.value) {
      return; // Avoid concurrent requests
    }
  
    // Critical fix: Resume audio context on user interaction (speaking button click)
    // This is required by browser autoplay policies
    if (viewerRef.value.resumeAudioContext) {
      const resumed = await viewerRef.value.resumeAudioContext();
    }
  
    // Initialize or reuse synthesizer
    if (!speechSynthesizer) {
      speechSynthesizer = initializeSpeechSynthesizer();
    }
  
    if (!speechSynthesizer) {
      error.value = "Failed to initialize speech synthesizer.";
      return;
    }
  
    status.value = "Sending request to Azure...";
    error.value = ''; // Clear previous errors
    
    // Create SSML for Azure TTS with viseme information
    const ssml = `
      <speak version="1.0" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="en-US">
        <voice name="${voiceName}">
          <mstts:viseme type="FacialExpression" />
          ${textToSpeak.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
        </voice>
      </speak>`;
    
    // Start the synthesis with SSML
    speechSynthesizer.speakSsmlAsync(
      ssml,
      result => {
        if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
          // Success is handled by synthesis events
          // Process any final visemes
          if (viewerRef.value) {
            viewerRef.value.processFinalViseme();
          }
        } else {
          error.value = `Speech synthesis failed: ${result.errorDetails || SpeechSDK.ResultReason[result.reason]}`;
          isSpeaking.value = false;
          
          if (viewerRef.value) {
            viewerRef.value.reset();
          }
        }
      },
      err => {
        error.value = `Failed to start speech synthesis: ${err}`;
        status.value = 'Speech failed.';
        isSpeaking.value = false;
        
        if (speechSynthesizer) {
          speechSynthesizer.close();
          speechSynthesizer = null;
        }
        
        if (viewerRef.value) {
          viewerRef.value.reset();
        }
      }
    );
  };
  
  // --- Lifecycle ---
  onMounted(() => {
    if (!azureCredentialsAvailable.value) {
      // Error message is shown via computed property in template
    }
  });
  
  // Cleanup on unmount (optional, depends if you reuse synthesizer across navigations)
  // onUnmounted(() => {
  //   if (speechSynthesizer) {
  //     speechSynthesizer.close();
  //     speechSynthesizer = null;
  //   }
  // });
  
  </script>
  
  <style scoped>
  /* Add any specific styles for the orchestrator component container */
  .credentials-error {
      margin-top: 15px;
      padding: 10px;
      background-color: #f8d7da;
      border: 1px solid #f5c6cb;
      color: #721c24;
      border-radius: 4px;
  }
  </style>