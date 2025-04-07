<template>
    <div class="chat-interface d-flex flex-column">
      <!-- Loading Indicator -->
      <v-progress-linear v-if="isLoadingMessages" indeterminate></v-progress-linear>
  
      <!-- Chat Messages Area -->
      <div ref="chatHistoryRef" class="chat-history flex-grow-1">
        <!-- Loading More Messages Indicator -->
        <div v-if="isLoadingMoreMessages" class="text-center pa-2">
          <v-progress-circular indeterminate size="24" width="2" color="primary"></v-progress-circular>
        </div>
        
        <!-- Load More Button (alternative to scroll) -->
        <div v-if="hasMoreMessages && !isLoadingMoreMessages" class="text-center pa-2">
          <v-btn variant="text" size="small" @click="loadMoreMessages" prepend-icon="mdi-refresh">
            Load More
          </v-btn>
        </div>
        
        <v-slide-y-transition group>
          <ChatMessage
            v-for="(message, index) in messages"
            :key="message.id || index"
            :is-user="message.isUser"
            :content="message.content"
            :timestamp="message.timestamp"
            :status="message.status"
            :file="message.file"
          />
        </v-slide-y-transition>
        <div ref="scrollAnchorRef"></div>
      </div>
  
      <!-- Chat Input Area -->
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
                :disabled="isUploading || isSendingMessage"
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
  
            <!-- Text Input -->
            <v-col class="pr-2">
              <v-textarea
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
                :disabled="isSendingMessage"
              ></v-textarea>
            </v-col>
  
            <!-- Voice and Send Buttons -->
            <v-col cols="auto" class="d-flex align-center">
              <v-btn
                icon
                variant="text"
                color="primary"
                class="mx-1"
                aria-label="Voice input"
                :disabled="isUploading || isSendingMessage"
              >
                <v-icon>mdi-microphone</v-icon>
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
    </div>
  </template>
  
  <script setup>
  import { ref, computed, watchEffect } from 'vue';
  import { useNuxtApp } from '#app';
  import ChatMessage from '~/components/chat/ChatMessage.vue';
  import { useMessages, useFileUpload, useInput } from '~/composables/chat';
  import { useChatStore } from '~/stores/chat';
  
  // Accept conversation ID as a prop
  const props = defineProps({
    conversationId: {
      type: String,
      default: null
    }
  });
  
  // Reactive references for DOM elements
  const chatHistoryRef = ref(null);
  const scrollAnchorRef = ref(null);
  
  // Get emitter from Nuxt plugin
  const nuxtApp = useNuxtApp();
  const emitter = nuxtApp.$emitter;
  
  // Initialize conversation ID from prop
  const conversationId = computed(() => props.conversationId);
  
  // Use our composables
  const chatStore = useChatStore();
  
  // Message handling
  const { 
    messages, 
    isLoadingMessages, 
    isLoadingMoreMessages,
    hasMoreMessages,
    loadMessages,
    loadMoreMessages,
    scrollToBottom,
    handleScroll
  } = useMessages({
    conversationId,
    chatHistoryRef,
    scrollAnchorRef
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
    isButtonDisabled,
    sendMessage,
    onEnterPress
  } = useInput({
    conversationId,
    scrollToBottom
  });
  
  // Watch for conversation ID changes to load messages
  watchEffect(() => {
    if (conversationId.value) {
      loadMessages(1);
    }
  });
  
  // Setup event listener for refresh strategies after message sending
  // (Note: This is now handled in the chat store but kept for backward compatibility)
  if (emitter && typeof emitter.on === 'function') {
    emitter.on('refresh-strategies', () => {
      console.log('Refreshing strategies due to event');
    });
  }
  </script>
  
  <style lang="scss" scoped>
  .chat-interface {
    height: 100%;
    overflow: hidden;
  }
  
  .chat-history {
    overflow-y: auto;
    scroll-behavior: smooth;
    padding: 16px 16px 0 16px;
    
    // Scrollbar styling
    &::-webkit-scrollbar {
      width: 6px;
    }
  
    &::-webkit-scrollbar-track {
      background: rgba(var(--v-theme-on-surface), 0.1);
    }
  
    &::-webkit-scrollbar-thumb {
      background: rgba(var(--v-theme-on-surface), 0.3);
      border-radius: 4px;
    }
  }
  
  .chat-input-container {
    border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12);
    padding: 16px;
    background: rgb(var(--v-theme-surface));
  
    .chat-input-card {
      background: rgba(var(--v-theme-on-surface), 0.05);
      border-radius: 28px;
      padding: 4px 12px;
    }
  }
  
  .chat-textarea {
    :deep(.v-field__field) {
      padding-top: 8px !important;
    }
  }
  </style>