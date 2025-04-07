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
  
  // Sort messages by timestamp to ensure latest messages are at the bottom
  const sortedMessages = computed(() => {
    if (!messages.value || messages.value.length === 0) return [];
    
    // Filter out messages with undefined content and then sort
    return [...messages.value]
      .filter(msg => msg.content !== undefined)
      .sort((a, b) => {
        const timeA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
        const timeB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
        return timeA - timeB; // Ascending order (oldest to newest)
      });
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
    console.log('[ChatInterface] sendMessageWithAiResponse called, button disabled:', isButtonDisabled.value);
    if (isButtonDisabled.value) return;
    
    const content = inputMessage.value.trim();
    const fileId = uploadedFile.value?.id;
    
    console.log('[ChatInterface] Message content:', {
      length: content?.length,
      hasFile: !!fileId
    });
    
    // Check if we have content or file to send
    if (!content && !fileId) {
      console.log('[ChatInterface] No content or file, returning early');
      return;
    }
    
    // Extra validation to ensure we're not sending blank content
    if (content === '' && !fileId) {
      console.log('[ChatInterface] Empty content and no file, clearing input and returning');
      inputMessage.value = '';
      return;
    }
    
    // Prevent duplicate submissions
    if (chatStore.isSendingMessage) {
      console.log('[ChatInterface] Already sending a message, preventing duplicate submission');
      console.log('[ChatInterface] Store state:', { isSendingMessage: chatStore.isSendingMessage });
      return;
    }
    
    try {
      console.log('[ChatInterface] Starting message send process with direct AI response');
      // Start sending - using our API directly to get the full response
      chatStore.isSendingMessage = true;
      
      let targetConversationId = conversationId.value;
      console.log('[ChatInterface] Initial conversation ID:', targetConversationId);
      
      // If no conversation ID, create a new one
      if (!targetConversationId) {
        console.log('[ChatInterface] No conversation ID, creating new conversation');
        const createResult = await chatStore.createConversation();
        
        if (!createResult.success) {
          console.error('[ChatInterface] Failed to create conversation:', createResult.error);
          notification.error(createResult.error || 'Failed to create conversation');
          return;
        }
        
        targetConversationId = createResult.data.id;
        console.log('[ChatInterface] New conversation created with ID:', targetConversationId);
      }
      
      // Prepare message data
      const messageData = {
        content: content || '',
        sender: 'user'
      };
      
      // Add file if provided
      if (fileId) {
        messageData.file = { id: fileId };
        console.log('[ChatInterface] Added file to message data:', fileId);
      }
      
      console.log('[ChatInterface] Prepared message data:', messageData);
      
      // Clear the input first to provide immediate feedback
      inputMessage.value = '';
      
      // Clear uploaded file after sending
      if (fileId) {
        clearUploadedFile();
        console.log('[ChatInterface] Cleared uploaded file');
      }
      
      // Use a timeout for the API call to avoid potential server timeouts on slow responses
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), 30000)
      );
      
      console.log('[ChatInterface] Sending message to API endpoint:', `conversations/${targetConversationId}/messages`);
      
      // Send message and get the full response with AI response
      const responsePromise = api.post(
        `conversations/${targetConversationId}/messages`, 
        messageData
      );
      
      // Race the response against the timeout
      const response = await Promise.race([responsePromise, timeoutPromise]);
      
      console.log('[ChatInterface] API response received:', {
        success: response.success,
        hasData: !!response.data,
        hasUserMessage: !!response.data?.userMessage,
        hasAiResponse: !!response.data?.aiResponse
      });
      
      if (response.success && response.data) {
        // If we're in a new conversation, navigate to it
        if (!conversationId.value && targetConversationId) {
          console.log('[ChatInterface] Navigating to new conversation:', targetConversationId);
          // Use the router to navigate
          router.push(`/strategies/${targetConversationId}`);
          
          // Make sure we emit the event for a new conversation
          if (emitter && typeof emitter.emit === 'function') {
            console.log('[ChatInterface] Emitting refresh events for new conversation');
            // Emit both events to ensure all listeners catch it
            emitter.emit('strategy-created');
            emitter.emit('refresh-strategies');
          }
        }
        
        // Process the response which should contain both user message and AI response
        const responseData = response.data;
        
        // Add user message to UI if needed
        if (responseData.userMessage && responseData.userMessage.content?.trim()) {
          console.log('[ChatInterface] Adding user message to UI:', {
            id: responseData.userMessage.id,
            content: responseData.userMessage.content?.substring(0, 20) + '...'
          });
          
          const userMessage = {
            id: responseData.userMessage.id,
            isUser: true,
            content: responseData.userMessage.content,
            timestamp: new Date(responseData.userMessage.createdAt),
            status: 'delivered',
            file: responseData.userMessage.file ? {
              id: responseData.userMessage.file.id,
              name: responseData.userMessage.file.filename,
              path: responseData.userMessage.file.path,
              url: responseData.userMessage.file.path,
              type: responseData.userMessage.file.mimetype,
              size: 0
            } : null
          };
          
          // Check if this message is already in our list before adding
          const exists = messages.value.some(m => m.id === userMessage.id);
          if (!exists) {
            messages.value.push(userMessage);
            console.log('[ChatInterface] User message added to messages array');
          } else {
            console.log('[ChatInterface] User message already exists, skipping');
          }
        } else {
          console.log('[ChatInterface] No valid user message in response');
        }
        
        // Process and display AI response if available
        if (responseData.aiResponse && responseData.aiResponse.content?.trim()) {
          console.log('[ChatInterface] Adding AI response to UI:', {
            id: responseData.aiResponse.id,
            content: responseData.aiResponse.content?.substring(0, 20) + '...'
          });
          
          const aiMessage = {
            id: responseData.aiResponse.id,
            isUser: false,
            content: responseData.aiResponse.content,
            timestamp: new Date(responseData.aiResponse.createdAt),
            status: 'delivered',
            file: null
          };
          
          // Check if this message is already in our list before adding
          const exists = messages.value.some(m => m.id === aiMessage.id);
          if (!exists) {
            messages.value.push(aiMessage);
            console.log('[ChatInterface] AI message added to messages array');
          } else {
            console.log('[ChatInterface] AI message already exists, skipping');
          }
        } else {
          console.log('[ChatInterface] No valid AI response in response data');
        }
        
        // Scroll to bottom after adding messages
        await nextTick();
        scrollToBottom();
        console.log('[ChatInterface] Scrolled to bottom after adding messages');
        
        // Trigger event to refresh strategies list
        if (emitter && typeof emitter.emit === 'function') {
          console.log('[ChatInterface] Emitting refresh-strategies event');
          emitter.emit('refresh-strategies');
        }
      } else {
        console.error('[ChatInterface] Failed to send message:', response.error);
        notification.error(response.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('[ChatInterface] Error in sendMessageWithAiResponse:', error);
      
      // Show different message for timeout errors
      if (error.message === 'Request timed out') {
        console.log('[ChatInterface] Request timed out');
        notification.error('Your request is taking longer than expected. The response may appear shortly.');
      } else {
        notification.error('An error occurred while sending your message');
      }
    } finally {
      console.log('[ChatInterface] sendMessageWithAiResponse completed, resetting isSendingMessage flag');
      chatStore.isSendingMessage = false;
    }
  };
  
  // Watch for conversation ID changes to load messages
  watchEffect(async () => {
    if (conversationId.value) {
      console.log('[ChatInterface] Conversation ID changed, loading messages:', conversationId.value);
      
      // Set the current conversation ID in the store to ensure proper context
      chatStore.currentConversationId = conversationId.value;
      
      // Load messages for this conversation
      await loadMessages(1);
      
      // Ensure we scroll to the bottom after loading
      await nextTick();
      scrollToBottom();
    }
  });
  
  // Watch for new messages to scroll to bottom
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