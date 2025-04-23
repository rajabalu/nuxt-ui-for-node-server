<template>
  <div class="chat-input-container">
    <v-card class="chat-input-card" elevation="0">
      <!-- File Preview (if file is selected) -->
      <div v-if="uploadedFile" class="pa-2">
        <v-chip closable @click:close="clearUploadedFile" color="primary" variant="outlined">
          <v-icon start>mdi-file</v-icon>
          {{ uploadedFile.name }}
        </v-chip>
      </div>
      
      <v-row no-gutters align="center">
        <!-- File Upload Button -->
        <v-col cols="auto" class="pr-1">
          <v-btn
            icon
            variant="text"
            color="primary"
            class="mx-1"
            aria-label="Attach file"
            @click="triggerFileInput"
            :disabled="isUploading || isSendingMessage || isListening"
            :loading="isUploading"
          >
            <v-icon>mdi-paperclip</v-icon>
          </v-btn>
          <input
            ref="fileInput"
            type="file"
            hidden
            @change="handleFileUpload"
          />
        </v-col>

        <!-- Text Input with Listening indicator -->
        <v-col class="pr-2 position-relative">
          <GlobalsTextField
            v-model="inputMessage"
            placeholder="Type a message..."
            auto-grow
            rows="1"
            row-height="20"
            max-rows="5"
            variant="plain"
            hide-details
            @keydown.enter.prevent="onEnterPress"
            class="chat-textarea"
            :disabled="isSendingMessage || isListening"
          />
          
          <!-- Modern Wave Animation (centered in text field) -->
          <transition name="fade">
            <div v-if="isListening" class="listening-indicator">
              <div class="sound-waves">
                <div v-for="n in 4" :key="n" class="wave-bar" :style="{ animationDelay: `${(n-1) * 0.2}s` }"></div>
              </div>
              <span class="listening-text">Listening...</span>
            </div>
          </transition>
        </v-col>

        <!-- Voice and Send Buttons -->
        <v-col cols="auto" class="d-flex align-center">
          <v-btn
            icon
            variant="text"
            :color="isListening ? 'error' : 'primary'"
            class="mx-1 voice-btn"
            aria-label="Voice input"
            :disabled="isUploading || isSendingMessage"
            @click="toggleVoiceRecognition"
          >
            <v-icon v-if="!isListening">mdi-microphone</v-icon>
            <v-icon v-else>mdi-stop</v-icon>
          </v-btn>

          <v-btn
            icon
            variant="flat"
            color="primary"
            :disabled="isButtonDisabled"
            @click="sendMessage"
            class="send-button"
            aria-label="Send message"
            :loading="isSendingMessage"
          >
            <v-icon>mdi-send</v-icon>
          </v-btn>
        </v-col>
      </v-row>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, watchEffect } from 'vue';
import { useNuxtApp } from '#app';
import GlobalsTextField from '~/components/globals/GlobalsTextField.vue';
import { useFileUpload, useInput } from '~/composables/chat';
import { useVoiceToText } from '~/composables/useVoiceToText';
import { useChatStore } from '~/stores/chat';
import { useApi } from '~/composables/api';
import { useNotification } from '~/composables/useNotification';
import { mapApiMessageToUiFormat } from '~/utils/chat';

const props = defineProps({
  conversationId: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['message-sent', 'conversation-created']);

// Dependencies
const nuxtApp = useNuxtApp();
const emitter = nuxtApp.$emitter;
const api = useApi();
const notification = useNotification();
const chatStore = useChatStore();

// Create computed prop for conversation ID
const conversationId = computed(() => props.conversationId);

// Voice to text functionality
const { 
  isListening, 
  transcript, 
  isSupported,
  startListening, 
  stopListening,
  resetTranscript,
  error: voiceError
} = useVoiceToText();

// Voice wave animation
const updateWaveHeight = () => {
  if (!isListening.value) return;
  setTimeout(updateWaveHeight, Math.random() * 300 + 100);
};

// Toggle voice recognition on/off
const toggleVoiceRecognition = async () => {
  if (isListening.value) {
    stopListening();
  } else {
    if (!isSupported.value) {
      notification.error('Speech recognition is not supported in your browser');
      return;
    }
    
    try {
      startListening();
      updateWaveHeight();
    } catch (err) {
      notification.error('Failed to start speech recognition');
      console.error('Speech recognition error:', err);
    }
  }
};

// Watch for voice recognition errors
watchEffect(() => {
  if (voiceError.value) {
    notification.error(`Speech recognition error: ${voiceError.value}`);
  }
});

// Append transcript to input when recognition stops
watchEffect(() => {
  if (!isListening.value && transcript.value.trim()) {
    inputMessage.value += (inputMessage.value ? ' ' : '') + transcript.value.trim();
    resetTranscript();
  }
});

// File upload handling
const { 
  fileInput,
  uploadedFile,
  isUploading,
  triggerFileInput,
  handleFileUpload,
  clearUploadedFile
} = useFileUpload();

// Chat input handling
const { 
  inputMessage,
  isSendingMessage,
  isButtonDisabled
} = useInput({
  conversationId
});

// Send message with AI response
const sendMessage = async () => {
  // Stop listening if active
  if (isListening.value) {
    toggleVoiceRecognition();
  }
  
  if (isButtonDisabled.value) return;
  
  const content = inputMessage.value.trim();
  const fileId = uploadedFile.value?.id;
  
  // Validation
  if (!content && !fileId) return;
  if (content === '' && !fileId) {
    inputMessage.value = '';
    return;
  }
  
  // Prevent duplicate submissions
  if (chatStore.isSendingMessage) return;
  
  try {
    chatStore.isSendingMessage = true;
    
    let targetConversationId = conversationId.value;
    
    // Create new conversation if needed
    if (!targetConversationId) {
      const createResult = await chatStore.createConversation();
      
      if (!createResult.success) {
        notification.error(createResult.error || 'Failed to create conversation');
        return;
      }
      
      targetConversationId = createResult.data.id;
      emit('conversation-created', targetConversationId);
    }
    
    // Prepare message data
    const messageData = {
      content: content || '',
      sender: 'user'
    };
    
    // Add file if provided
    if (fileId) {
      messageData.file = { id: fileId };
    }
    
    // Clear input and file
    inputMessage.value = '';
    if (fileId) clearUploadedFile();
    
    // Handle timeouts
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timed out')), 30000)
    );
    
    // Send message and get response
    const responsePromise = api.post(`conversations/${targetConversationId}/messages`, messageData);
    const response = await Promise.race([responsePromise, timeoutPromise]);
    
    if (response.success && response.data) {
      // Emit the message data for parent to handle
      emit('message-sent', response.data);
      
      // Trigger event to refresh strategies list
      if (emitter?.emit) {
        emitter.emit('refresh-strategies');
      }
    } else {
      notification.error(response.error || 'Failed to send message');
    }
  } catch (error) {
    // Handle errors
    if (error.message === 'Request timed out') {
      notification.error('Your request is taking longer than expected. The response may appear shortly.');
    } else {
      notification.error('An error occurred while sending your message');
    }
  } finally {
    chatStore.isSendingMessage = false;
  }
};

// Handle Enter key press
const onEnterPress = (event) => {
  if (event && !event.shiftKey) {
    sendMessage();
  }
};
</script>

<style lang="scss" scoped>
.chat-input-container {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  padding: 16px;
  background: rgb(var(--v-theme-surface));
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;

  // Adjust padding on small screens
  @media (max-width: 600px) {
    padding: 8px;
  }

  .chat-input-card {
    background: rgba(var(--v-theme-on-surface), 0.05);
    border-radius: 28px;
    padding: 4px 12px;
    position: relative;

    // Make input area more compact on mobile
    @media (max-width: 600px) {
      border-radius: 24px;
      padding: 2px 8px;
    }
  }
}

.chat-textarea {
  :deep(.v-field__field) {
    padding-top: 8px !important;
  }
}

.voice-btn {
  position: relative;
  
  .recording-indicator {
    position: absolute;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: rgb(var(--v-theme-error));
    top: 8px;
    right: 8px;
    animation: recording-pulse 1.5s infinite;
  }
}

.listening-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 8px;
  
  .sound-waves {
    display: flex;
    gap: 4px;
    
    .wave-bar {
      width: 4px;
      height: 16px;
      background-color: rgb(var(--v-theme-error));
      animation: wave-animation 1s infinite ease-in-out;
    }
  }
  
  .listening-text {
    font-size: 0.75rem;
    font-weight: 500;
    color: rgb(var(--v-theme-error));
    opacity: 0.9;
    white-space: nowrap;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

@keyframes wave-animation {
  0%, 100% {
    transform: scaleY(0.5);
  }
  50% {
    transform: scaleY(1);
  }
}

@keyframes recording-pulse {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
  100% {
    transform: scale(0.8);
    opacity: 1;
  }
}

// Mobile optimizations for action buttons
@media (max-width: 600px) {
  .v-btn.icon {
    margin: 0 2px !important;
  }
  
  .chat-actions {
    gap: 4px !important;
  }
}
</style>