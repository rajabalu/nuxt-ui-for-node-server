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
            <v-chip closable @click:close="uploadedFile = null" color="primary" variant="outlined">
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
  import { ref, onMounted, nextTick, watch, computed, onBeforeMount, watchEffect } from 'vue';
  import ChatMessage from '~/components/chat/ChatMessage.vue';
  import { useApi } from '~/composables/api';
  import { useAuthStore } from '~/stores/auth';
  import { useNuxtApp } from '#app';
  
  // Accept conversation ID as a prop
  const props = defineProps({
    conversationId: {
      type: String,
      default: null
    }
  });
  
  // Message data
  const messages = ref([]);
  const isLoadingMessages = ref(false);
  const isLoadingMoreMessages = ref(false);
  const hasMoreMessages = ref(false);
  const currentPage = ref(1);
  const messagesPerPage = 50;
  
  // Reactive references
  const inputMessage = ref('');
  const chatHistoryRef = ref(null);
  const scrollAnchorRef = ref(null);
  const fileInput = ref(null);
  const api = useApi();
  
  // Get emitter from Nuxt plugin
  const nuxtApp = useNuxtApp();
  const emitter = nuxtApp.$emitter;
  
  const uploadedFile = ref(null);
  const isUploading = ref(false);
  const authStore = useAuthStore();
  const isSendingMessage = ref(false);
  
  // Initialize conversation ID from prop if provided
  const conversationId = computed(() => props.conversationId);
  
  // Computed property for button disabled state to avoid null reference errors
  const isButtonDisabled = computed(() => {
    const hasInputText = inputMessage.value && inputMessage.value.trim && inputMessage.value.trim().length > 0;
    const hasUploadedFile = uploadedFile.value !== null;
    return (!hasInputText && !hasUploadedFile) || isUploading.value || isSendingMessage.value;
  });
  
  /**
   * Load messages for the conversation
   */
  const loadMessages = async (page = 1) => {
    if (!conversationId.value) return;

    const isInitialLoad = page === 1;
    if (isInitialLoad) {
      isLoadingMessages.value = true;
      messages.value = []; // Clear existing messages for new conversation
    } else {
      isLoadingMoreMessages.value = true;
    }

    try {
      const response = await api.get(`conversations/${conversationId.value}/messages?page=${page}&limit=${messagesPerPage}`);

      if (response.success && response.data) {
        // Process API response data
        const newMessages = (response.data.data || []).map(msg => ({
          id: msg.id,
          isUser: msg.sender === 'user',
          content: msg.content || '',
          timestamp: new Date(msg.createdAt),
          status: 'delivered',
          file: msg.file ? {
            id: msg.file.id,
            name: msg.file.filename,
            path: msg.file.path,
            url: msg.file.path,
            type: msg.file.mimetype,
            size: 0 // Size typically not included in responses
          } : null
        }));

        if (isInitialLoad) {
          // For initial load, set messages directly (newest first from API)
          messages.value = newMessages.reverse(); // Reverse to show oldest first
        } else {
          // For pagination, add to beginning (older messages at top)
          messages.value = [...newMessages.reverse(), ...messages.value];
        }

        // Update pagination state
        hasMoreMessages.value = response.data.hasNextPage || false;
        currentPage.value = page;
        
        // Scroll to bottom on initial load
        if (isInitialLoad) {
          await nextTick();
          scrollToBottom();
        }
      } else {
        console.error('Failed to load messages:', response?.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      isLoadingMessages.value = false;
      isLoadingMoreMessages.value = false;
    }
  };

  /**
   * Load more messages (infinite scrolling)
   */
  const loadMoreMessages = async () => {
    if (hasMoreMessages.value && !isLoadingMoreMessages.value) {
      await loadMessages(currentPage.value + 1);
    }
  };

  /**
   * Handle scroll event for infinite scrolling
   */
  const handleScroll = () => {
    if (!chatHistoryRef.value) return;
    
    const { scrollTop } = chatHistoryRef.value;
    
    // If scrolled to top (or near top) and has more messages, load more
    if (scrollTop < 50 && hasMoreMessages.value && !isLoadingMoreMessages.value) {
      loadMoreMessages();
    }
  };

  // File upload handlers
  const triggerFileInput = () => {
    if (fileInput.value) {
      fileInput.value.click();
    }
  };

  const handleFileUpload = async (event) => {
    if (!event || !event.target || !event.target.files) return;
    
    const files = event.target.files;
    if (files.length > 0) {
      const file = files[0];
      
      // Show uploading state
      isUploading.value = true;
      
      try {
        // Get the configured base URL
        const baseUrl = api && typeof api.getBaseUrl === 'function' ? api.getBaseUrl() : 'http://localhost:8000/api/v1/';
        
        // Create form data
        const formData = new FormData();
        formData.append('file', file);
        
        // Upload file using the server endpoint
        const uploadUrl = `${baseUrl}files/upload`;
        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authStore && authStore.token ? authStore.token : ''}`
          },
          body: formData
        });
        
        if (!response.ok) {
          throw new Error(`Upload failed with status: ${response.status}`);
        }
        
        // Parse response JSON
        const data = await response.json();
        
        // Extract the file ID and path
        const fileId = data && data.file ? data.file.id : null;
        const filePath = data && data.file ? data.file.path : null;
        
        if (!fileId) {
          throw new Error('No file ID returned from server');
        }
        
        // Store the uploaded file info
        uploadedFile.value = {
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type,
          path: filePath,
          url: filePath || URL.createObjectURL(file)
        };
        
        // Show upload success indication but don't add message yet
        // (message will be added when user sends it)
        console.log('File uploaded successfully. Ready to send with message.');
      } catch (error) {
        console.error('Error uploading file:', error);
        
        // Show error message to user
        alert(`Failed to upload file: ${error.message}`);
        
        // Clear the upload
        uploadedFile.value = null;
      } finally {
        // Clear the input and uploading state
        if (event.target) {
          event.target.value = '';
        }
        isUploading.value = false;
      }
    }
  };
  
  // Auto-scroll to bottom
  const scrollToBottom = async () => {
    try {
      await nextTick();
      if (scrollAnchorRef.value) {
        scrollAnchorRef.value.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (err) {
      console.warn('Error in scrollToBottom:', err);
    }
  };
  
  // Send message handler
  const sendMessage = async () => {
    // Safe check for input value
    const hasText = inputMessage.value && inputMessage.value.trim && inputMessage.value.trim().length > 0;
    const hasFile = uploadedFile.value !== null;
    
    if (!hasText && !hasFile) return;
  
    // Prevent multiple sends
    isSendingMessage.value = true;
  
    try {
      // If no conversation ID, create a new conversation first
      if (!conversationId.value) {
        try {
          // Format the current date
          const today = new Date();
          const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
          
          // Create new conversation
          if (api && typeof api.post === 'function') {
            const response = await api.post('conversations', {
              title: `Strategy as on ${formattedDate}`
            });
            
            if (response && response.success && response.data) {
              // Store the conversation ID locally
              const newConversationId = response.data.id;
              
              // Safely emit events to refresh strategy menu
              if (emitter) {
                console.log('Emitting strategy-created event for new conversation:', newConversationId);
                // Emit events directly without try-catch and with simpler code
                emitter.emit('strategy-created');
                
                // Emit a second refresh event with a slight delay to ensure it's processed
                setTimeout(() => {
                  if (emitter) {
                    emitter.emit('refresh-strategies');
                  }
                }, 200);
              }
              
              // Prepare to send message to the new conversation
              const messageData = {
                content: hasText ? inputMessage.value.trim() : '',
                sender: 'user'
              };
              
              // Add file if uploaded
              if (hasFile && uploadedFile.value && uploadedFile.value.id) {
                messageData.file = {
                  id: uploadedFile.value.id
                };
              }
              
              // Send message to server with new conversation ID
              const msgResponse = await api.post(`conversations/${newConversationId}/messages`, messageData);
              
              if (msgResponse && msgResponse.success && msgResponse.data) {
                // Add message to UI
                const newMessage = {
                  id: msgResponse.data.id,
                  isUser: true,
                  content: msgResponse.data.content,
                  timestamp: new Date(msgResponse.data.createdAt),
                  status: 'delivered',
                  file: msgResponse.data.file ? {
                    id: msgResponse.data.file.id,
                    name: msgResponse.data.file.filename,
                    path: msgResponse.data.file.path,
                    url: msgResponse.data.file.path,
                    type: msgResponse.data.file.mimetype,
                    size: 0
                  } : null
                };
                
                if (messages.value) {
                  messages.value.push(newMessage);
                }
                
                // Reset inputs
                inputMessage.value = '';
                uploadedFile.value = null;
                
                // Scroll to bottom
                await scrollToBottom();
                
                // Navigate to the new conversation page to continue the chat
                navigateTo(`/strategies/${newConversationId}`);
                
                // AI response will be handled on the new page after navigation
              } else {
                console.error('Failed to send message:', msgResponse?.error || 'Unknown error');
                alert('Failed to send message. Please try again.');
              }
            } else {
              console.error('Failed to create conversation:', response?.error || 'Unknown error');
              alert('Failed to create conversation. Please try again.');
            }
          }
        } catch (error) {
          console.error('Error creating conversation:', error);
          alert('Error creating conversation. Please try again.');
        } finally {
          isSendingMessage.value = false;
        }
        return; // Exit early after handling the new conversation case
      }
      
      // Existing conversation case continues below
      // Prepare message data
      const messageData = {
        content: hasText ? inputMessage.value.trim() : '',
        sender: 'user'
      };
      
      // Add file if uploaded
      if (hasFile && uploadedFile.value && uploadedFile.value.id) {
        messageData.file = {
          id: uploadedFile.value.id
        };
      }
      
      // Send message to server
      const response = await api.post(`conversations/${conversationId.value}/messages`, messageData);
      
      if (response && response.success && response.data) {
        // Add message to UI
        const newMessage = {
          id: response.data.id,
          isUser: true,
          content: response.data.content,
          timestamp: new Date(response.data.createdAt),
          status: 'delivered',
          file: response.data.file ? {
            id: response.data.file.id,
            name: response.data.file.filename,
            path: response.data.file.path,
            url: response.data.file.path,
            type: response.data.file.mimetype,
            size: 0
          } : null
        };
        
        if (messages.value) {
          messages.value.push(newMessage);
        }
        
        // Reset inputs
        inputMessage.value = '';
        uploadedFile.value = null;
        
        // Scroll to bottom
        await scrollToBottom();
        
        // Simulate AI response (in real app, you'd wait for server events)
        setTimeout(async () => {
          const aiResponse = await api.post(`conversations/${conversationId.value}/messages`, {
            content: 'I received your message. This is a placeholder response.',
            sender: 'assistant'
          });
          
          if (aiResponse && aiResponse.success && aiResponse.data) {
            const aiMessage = {
              id: aiResponse.data.id,
              isUser: false,
              content: aiResponse.data.content,
              timestamp: new Date(aiResponse.data.createdAt),
              status: 'delivered',
              file: null
            };
            
            if (messages.value) {
              messages.value.push(aiMessage);
              await scrollToBottom();
            }
          }
        }, 1000);
        
      } else {
        console.error('Failed to send message:', response?.error || 'Unknown error');
        alert('Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message. Please try again.');
    } finally {
      isSendingMessage.value = false;
    }
  };
  
  // Enter key handler
  const onEnterPress = (event) => {
    if (event && !event.shiftKey) {
      sendMessage();
    }
  };
  
  // Watch for new messages
  watch(messages, () => {
    scrollToBottom();
  }, { deep: true });
  
  // Watch for conversation ID changes
  watchEffect(() => {
    // When conversation ID changes, load messages
    if (conversationId.value) {
      loadMessages(1);
    }
  });
  
  // Initialize scroll handler for infinite scrolling
  onMounted(() => {
    if (chatHistoryRef.value) {
      chatHistoryRef.value.addEventListener('scroll', handleScroll);
    }
    
    // Load messages if conversation ID is available
    if (conversationId.value) {
      loadMessages(1);
    }
  });
  
  // Clean up event listeners
  onBeforeMount(() => {
    if (chatHistoryRef.value) {
      chatHistoryRef.value.removeEventListener('scroll', handleScroll);
    }
  });
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
      padding-bottom: 8px !important;
      min-height: 48px;
    }
  
    :deep(textarea) {
      color: rgba(var(--v-theme-on-surface), 0.9);
      font-size: 0.9rem;
      line-height: 1.5;
      
      &::placeholder {
        color: rgba(var(--v-theme-on-surface), 0.5) !important;
      }
    }
  }

  .chat-input-card .v-row {
    gap: 4px;
  }
  
  .send-button {
    :deep(.v-btn__overlay) {
      opacity: 0.1 !important;
    }
    
    &:not(:disabled) {
      box-shadow: 0 3px 12px rgba(99, 102, 241, 0.2);
    }
  }
  
  // Dark theme adjustments
  .v-theme--dark {
    .chat-input-card {
      background: rgba(255, 255, 255, 0.05);
    }
    
    .chat-textarea :deep(textarea) {
      color: rgba(255, 255, 255, 0.9);
    }
  }
  </style>