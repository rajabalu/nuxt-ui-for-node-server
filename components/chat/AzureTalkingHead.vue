<template>
    <div>
      <h2>Azure Streaming TTS Avatar</h2>
  
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
  const voiceName = "en-US-JennyNeural"; // Choose desired Azure voice
  
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
  
    // Crucially, configure for streaming output (ArrayBuffer)
    // Note: The format might depend slightly on SDK version / browser capabilities
    // You might need to experiment with formats if PCM doesn't work as expected.
    // Common format is Riff16Khz16BitMonoPcm directly compatible with Web Audio.
    speechConfig.speechSynthesisOutputFormat = SpeechSDK.SpeechSynthesisOutputFormat.Riff16Khz16BitMonoPcm;
  
    // Create synthesizer with *null* for audio config to get stream directly
    const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, null); // Pass null for AudioConfig to handle stream manually
  
    synthesizer.audioAvailable = (sender, event) => {
      // event.audioData contains the ArrayBuffer chunk
      // console.log(`Audio chunk received: ${event.audioData.byteLength} bytes`);
      if (viewerRef.value) {
        // IMPORTANT: Send a *copy* of the ArrayBuffer to avoid issues if the SDK reuses the buffer
        const audioDataCopy = event.audioData.slice(0);
        viewerRef.value.processAudioChunk(audioDataCopy); // For animation analysis
        viewerRef.value.playAudioChunk(audioDataCopy);      // For playback
      }
    };
  
    synthesizer.synthesisStarted = () => {
      // console.log("Synthesis started.");
      status.value = "Synthesis started...";
      isSpeaking.value = true;
      error.value = ''; // Clear previous errors
      if (viewerRef.value) {
          viewerRef.value.reset(); // Reset viewer state before starting new speech
      }
    };
  
    synthesizer.synthesisCompleted = (sender, event) => {
      // console.log(`Synthesis completed. Result ID: ${event.result.resultId}`);
      status.value = `Speech finished.`;
      isSpeaking.value = false;
       // The viewer's playback queue will handle the end of audio naturally
    };
  
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
            viewerRef.value.reset(); // Reset viewer on error
        }
    };
  
    synthesizer.visemeReceived = (sender, event) => {
       // You could potentially use viseme data IF TalkingHead supports it directly
       // console.log(`Viseme received: ID=${event.visemeId}, Offset=${event.audioOffset / 10000}ms`);
       // For this example, we rely on TalkingHead's audio analysis
    };
  
    return synthesizer;
  };
  
  const handleSpeakRequest = (textToSpeak) => {
    if (!azureCredentialsAvailable.value) {
        error.value = "Cannot speak: Azure credentials missing.";
        return;
    }
    if (!viewerRef.value) {
        error.value = "Cannot speak: Viewer not ready.";
        return;
    }
    if (isSpeaking.value) {
        console.warn("Already speaking, request ignored.");
        return; // Avoid concurrent requests if desired
    }
  
    // Ensure synthesizer is ready (create if first time or recreate if needed)
    // You might want logic to close the previous one if recreating
    // if (speechSynthesizer) {
    //     speechSynthesizer.close(); // Clean up old one? Depends on SDK behavior
    // }
    speechSynthesizer = initializeSpeechSynthesizer();
  
    if (!speechSynthesizer) {
        error.value = "Failed to initialize speech synthesizer.";
        return;
    }
  
    status.value = "Sending request to Azure...";
    error.value = ''; // Clear previous errors
  
    // Start the synthesis
    speechSynthesizer.speakTextAsync(
        textToSpeak,
        result => {
            // Note: success/failure is handled by synthesisCompleted/synthesisCanceled events
            if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
               // console.log("speakTextAsync completed successfully signal.");
            } else {
                console.error(`speakTextAsync failed: Reason=${result.reason}, Details=${result.errorDetails}`);
                // Error is likely already set by the synthesisCanceled event, but set fallback:
                if (!error.value) {
                    error.value = `Speech synthesis failed: ${result.errorDetails || SpeechSDK.ResultReason[result.reason]}`;
                    isSpeaking.value = false;
                     if (viewerRef.value) {
                        viewerRef.value.reset(); // Reset viewer on error
                    }
                }
            }
            // Optional: Close synthesizer here if you want one instance per request
            // speechSynthesizer.close();
            // speechSynthesizer = null;
            // Or keep it alive for potential reuse (check SDK docs for best practice)
        },
        err => {
            console.error('speakTextAsync error callback:', err);
            error.value = `Failed to start speech synthesis: ${err}`;
            status.value = 'Speech failed.';
            isSpeaking.value = false;
            if (speechSynthesizer) {
                speechSynthesizer.close(); // Clean up on error
                speechSynthesizer = null;
            }
            if (viewerRef.value) {
                viewerRef.value.reset(); // Reset viewer on error
            }
        }
    );
  };
  
  // --- Lifecycle ---
  onMounted(() => {
    if (!azureCredentialsAvailable.value) {
      console.warn("Azure Speech Key or Region not found in runtime config.");
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