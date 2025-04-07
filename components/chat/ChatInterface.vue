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
            v-for="(message, index) in sortedMessages"
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
                @click="sendMessageWithAiResponse"
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
  import { ref, computed, watchEffect, nextTick } from 'vue';
  import { useNuxtApp } from '#app';
  import { useRouter } from 'vue-router';
  import ChatMessage from '~/components/chat/ChatMessage.vue';
  import { useMessages, useFileUpload, useInput } from '~/composables/chat';
  import { useChatStore } from '~/stores/chat';
  import { useApi } from '~/composables/api';
  import { useNotification } from '~/composables/useNotification';
  import { mapApiMessageToUiFormat } from '~/utils/chat';
  
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
  const api = useApi();
  const notification = useNotification();
  const router = useRouter();
  
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
  
  // Memoized sorted messages to optimize performance
  const sortedMessagesCache = ref({
    messages: [],
    sorted: []
  });
  
  // Sort messages by timestamp to ensure latest messages are at the bottom
  const sortedMessages = computed(() => {
    // If no messages, return empty array
    if (!messages.value || messages.value.length === 0) return [];
    
    // Check if our messages array reference has changed
    if (sortedMessagesCache.value.messages !== messages.value) {
      // Filter out messages with undefined content and then sort
      const filtered = messages.value.filter(msg => msg.content !== undefined);
      const sorted = [...filtered].sort((a, b) => {
        const timeA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
        const timeB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
        return timeA - timeB; // Ascending order (oldest to newest)
      });
      
      // Update cache
      sortedMessagesCache.value = {
        messages: messages.value,
        sorted
      };
    }
    
    return sortedMessagesCache.value.sorted;
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
  
  // New function to send a message and wait for AI response
  const sendMessageWithAiResponse = async () => {
    if (isButtonDisabled.value) return;
    
    const content = inputMessage.value.trim();
    const fileId = uploadedFile.value?.id;
    
    // Check if we have content or file to send
    if (!content && !fileId) {
      return;
    }
    
    // Extra validation to ensure we're not sending blank content
    if (content === '' && !fileId) {
      inputMessage.value = '';
      return;
    }
    
    // Prevent duplicate submissions
    if (chatStore.isSendingMessage) {
      return;
    }
    
    try {
      // Start sending - using our API directly to get the full response
      chatStore.isSendingMessage = true;
      
      let targetConversationId = conversationId.value;
      
      // If no conversation ID, create a new one
      if (!targetConversationId) {
        const createResult = await chatStore.createConversation();
        
        if (!createResult.success) {
          notification.error(createResult.error || 'Failed to create conversation');
          return;
        }
        
        targetConversationId = createResult.data.id;
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
      
      // Clear the input first to provide immediate feedback
      inputMessage.value = '';
      
      // Clear uploaded file after sending
      if (fileId) {
        clearUploadedFile();
      }
      
      // Use a timeout for the API call to avoid potential server timeouts on slow responses
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), 30000)
      );
      
      // Send message and get the full response with AI response
      const responsePromise = api.post(`conversations/${targetConversationId}/messages`, messageData);
      
      // Race the API call against the timeout
      const response = await Promise.race([responsePromise, timeoutPromise]);
      
      if (response.success && response.data) {
        const responseData = response.data;
        
        // Process and display user message
        if (responseData.userMessage && responseData.userMessage.content?.trim()) {
          const userMessage = mapApiMessageToUiFormat(responseData.userMessage);
          
          if (userMessage) {
            // Check if this message is already in our list before adding
            const exists = messages.value.some(m => m.id === userMessage.id);
            if (!exists) {
              messages.value.push(userMessage);
            }
          }
        }
        
        // Process and display AI response if available
        if (responseData.aiResponse && responseData.aiResponse.content?.trim()) {
          const aiMessage = mapApiMessageToUiFormat(responseData.aiResponse);
          
          if (aiMessage) {
            // Check if this message is already in our list before adding
            const exists = messages.value.some(m => m.id === aiMessage.id);
            if (!exists) {
              messages.value.push(aiMessage);
            }
          }
        }
        
        // Scroll to bottom after adding messages
        await nextTick();
        scrollToBottom();
        
        // Trigger event to refresh strategies list
        if (emitter && typeof emitter.emit === 'function') {
          emitter.emit('refresh-strategies');
        }
      } else {
        notification.error(response.error || 'Failed to send message');
      }
    } catch (error) {
      // Show different message for timeout errors
      if (error.message === 'Request timed out') {
        notification.error('Your request is taking longer than expected. The response may appear shortly.');
      } else {
        notification.error('An error occurred while sending your message');
      }
    } finally {
      chatStore.isSendingMessage = false;
    }
  };
  
  // Watch for conversation ID changes to load messages
  watchEffect(async () => {
    if (conversationId.value) {
      // Set the current conversation ID in the store to ensure proper context
      chatStore.currentConversationId = conversationId.value;
      
      // Load messages for this conversation
      await loadMessages(1);
      
      // Ensure we scroll to the bottom after loading
      await nextTick();
      scrollToBottom();
    }
  });
  
  // Watch for new messages in the store and scroll to bottom
  watchEffect(() => {
    if (messages.value && messages.value.length > 0) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  });
  
  // Setup event listener for refresh strategies after message sending
  // (Note: This is now handled in the chat store but kept for backward compatibility)
  if (emitter && typeof emitter.on === 'function') {
    emitter.on('refresh-strategies', () => {
      // Nothing to do, just keeping for backward compatibility
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