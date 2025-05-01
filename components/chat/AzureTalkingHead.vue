<template>
  <div class="talking-head-root">
    <ClientOnly>
      <TalkingHeadViewer ref="viewerRef" @speak="handleSpeakRequest" class="viewer-responsive" />
    </ClientOnly>
    <div v-if="!azureCredentialsAvailable" class="error-message credentials-error">
      Azure Speech Key or Region not configured. Please check environment variables.
    </div>
  </div>
</template>

<style scoped>
.talking-head-root {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.viewer-responsive {
  width: 100%;
  height: 100%;
  max-width: 100vw;
  max-height: 100vh;
  object-fit: contain;
  display: block;
}
</style>
  
<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import TalkingHeadViewer from './TalkingHeadViewer.vue';
import { useUserPreferences } from '@/stores/userPreferences';
import { useI18n } from 'vue-i18n';

// --- Configuration ---
const config = useRuntimeConfig();
const azureSpeechKey = config.public.AZURE_KEY;
const azureSpeechRegion = config.public.AZURE_LOCATION;

// --- Access user preferences for language ---
const userPreferencesStore = useUserPreferences();
const { locale } = useI18n();

// --- Component Refs ---
const viewerRef = ref(null); // Ref to access TalkingHeadViewer methods

// --- Reactive State ---
const isSpeaking = ref(false);
const status = ref('');
const error = ref('');
const azureCredentialsAvailable = computed(() => !!azureSpeechKey && !!azureSpeechRegion);

// Get current voice directly from TalkingHeadViewer component
const currentVoice = computed(() => {
  // Get the selected language from user preferences, fall back to i18n locale, then to English
  const selectedLanguage = userPreferencesStore.language || locale.value || 'en';
  
  // First, get the avatar-specific voice from the viewer if available
  if (viewerRef.value && viewerRef.value.avatarVoice) {
    const avatarVoice = viewerRef.value.avatarVoice;
    
    // Extract the current avatar's voice language code
    const currentVoiceLang = avatarVoice.split('-')[0];
    
    // If the avatar's voice matches the selected language, use it directly
    if (avatarVoice.startsWith(selectedLanguage)) {
      return avatarVoice;
    }
    
    // If language changed, we need to map to a similar voice in the target language
    // while preserving voice characteristics (gender, style) if possible
    
    // Language-specific voice mapping that preserves avatar character
    const avatarVoiceMap = {
      // Leo (William-like voices across languages)
      'en-AU-WilliamNeural': {
        'en': 'en-AU-WilliamNeural',
        'hi': 'hi-IN-MadhurNeural',
        'ar': 'ar-SA-HamedNeural',
        'es': 'es-ES-AlvaroNeural',
        'de': 'de-DE-ConradNeural'
      },
      // Nova (Jenny-like voices across languages)
      'en-US-JennyNeural': {
        'en': 'en-US-JennyNeural',
        'hi': 'hi-IN-SwaraNeural',
        'ar': 'ar-SA-ZariyahNeural',
        'es': 'es-ES-ElviraNeural',
        'de': 'de-DE-KatjaNeural'
      },
      // Max (Ryan-like voices across languages)
      'en-GB-RyanNeural': {
        'en': 'en-GB-RyanNeural',
        'hi': 'hi-IN-MadhurNeural',
        'ar': 'ar-SA-HamedNeural',
        'es': 'es-ES-AlvaroNeural',
        'de': 'de-DE-ConradNeural'
      },
      // Aria (Sonia-like voices across languages)
      'en-GB-SoniaNeural': {
        'en': 'en-GB-SoniaNeural',
        'hi': 'hi-IN-SwaraNeural',
        'ar': 'ar-SA-ZariyahNeural',
        'es': 'es-ES-ElviraNeural',
        'de': 'de-DE-KatjaNeural'
      }
    };
    
    // If we have a language mapping for this specific avatar voice
    if (avatarVoiceMap[avatarVoice] && avatarVoiceMap[avatarVoice][selectedLanguage]) {
      console.log(`Using character-preserving voice mapping for ${avatarVoice} in ${selectedLanguage}`);
      return avatarVoiceMap[avatarVoice][selectedLanguage];
    }
    
    // Fallback to generic language-based voice mapping
    const genericLanguageVoiceMap = {
      'en': 'en-AU-WilliamNeural', // English
      'hi': 'hi-IN-MadhurNeural',  // Hindi
      'ar': 'ar-SA-HamedNeural',   // Arabic
      'es': 'es-ES-AlvaroNeural',  // Spanish
      'de': 'de-DE-ConradNeural',  // German
    };
    
    console.log(`Using generic voice for language: ${selectedLanguage}`);
    return genericLanguageVoiceMap[selectedLanguage] || genericLanguageVoiceMap['en'];
  }
  
  // Fallback if no viewer reference or avatar voice
  const genericLanguageVoiceMap = {
    'en': 'en-AU-WilliamNeural', // English
    'hi': 'hi-IN-MadhurNeural',  // Hindi
    'ar': 'ar-SA-HamedNeural',   // Arabic
    'es': 'es-ES-AlvaroNeural',  // Spanish
    'de': 'de-DE-ConradNeural',  // German
  };
  
  return genericLanguageVoiceMap[selectedLanguage] || genericLanguageVoiceMap['en'];
});

let speechSynthesizer = null; // Keep synthesizer instance reusable if needed

// --- Methods ---
// Define initializeSpeechSynthesizer function before the watcher
const initializeSpeechSynthesizer = () => {
  if (!azureCredentialsAvailable.value) {
      error.value = "Azure credentials are not configured.";
      console.error("Azure credentials missing.");
      return null;
  }

  // Always get the latest voice from the computed property
  const voiceName = currentVoice.value;
  console.log(`Initializing speech synthesizer with voice: ${voiceName}`);

  const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(azureSpeechKey, azureSpeechRegion);
  speechConfig.speechSynthesisVoiceName = voiceName;
  
  // Set output format to MP3 for better compatibility
  speechConfig.speechSynthesisOutputFormat = SpeechSDK.SpeechSynthesisOutputFormat.Raw16Khz16BitMonoPcm;

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
          console.log(`Sending audio chunk: ${audioDataCopy.byteLength} bytes`);
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
      // Force resume audio context first to handle browser autoplay policy
      viewerRef.value.resumeAudioContext().then(() => {
        console.log("Audio context resumed, starting streaming...");
        // Start streaming mode before sending audio
        viewerRef.value.startStreaming();
      });
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

// Watch for voice changes to reinitialize the synthesizer if needed
watch(currentVoice, (newVoice, oldVoice) => {
  if (newVoice !== oldVoice) {
    console.log(`Voice changed from ${oldVoice} to ${newVoice}. Recreating speech synthesizer.`);
    
    // Force recreate the synthesizer when voice changes
    if (speechSynthesizer) {
      speechSynthesizer.close();
      speechSynthesizer = null;
    }
    
    // Immediately recreate the synthesizer with the new voice
    speechSynthesizer = initializeSpeechSynthesizer();
  }
}, { immediate: true });

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
  
  // Get the language code from the voice name (e.g., 'en-US' from 'en-US-GuyNeural')
  const voiceName = currentVoice.value;
  const languageCode = voiceName.split('-').slice(0, 2).join('-');
  
  // Create SSML for Azure TTS with viseme information and correct language
  const ssml = `
    <speak version="1.0" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="${languageCode}">
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

// Expose methods for parent components to use
defineExpose({
  handleSpeakRequest
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