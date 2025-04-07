<template>
    <div class="chat-interface d-flex flex-column">
      <!-- Chat Messages Area -->
      <div ref="chatHistoryRef" class="chat-history flex-grow-1">
        <v-slide-y-transition group>
          <ChatMessage
            v-for="(message, index) in messages"
            :key="index"
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
                :disabled="isUploading"
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
                :disabled="isUploading"
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
  import { ref, onMounted, nextTick, watch, computed } from 'vue';
  import ChatMessage from '~/components/chat/ChatMessage.vue';
  import { useApi } from '~/composables/api';
  import { useAuthStore } from '~/stores/auth';
  
  // Message data
  const messages = ref([
    { 
      isUser: false, 
      content: 'Hello! How can I help you today?', 
      timestamp: new Date('2023-04-14T05:42:00'), 
      status: 'delivered' 
    },
  ]);
  
  // Reactive references
  const inputMessage = ref('');
  const chatHistoryRef = ref(null);
  const scrollAnchorRef = ref(null);
  const fileInput = ref(null);
  const conversationId = ref(null);
  const api = useApi();
  
  // Try to get the emitter with safe access
  let emitter = null;
  try {
    const nuxtApp = useNuxtApp();
    if (nuxtApp && nuxtApp.vueApp && nuxtApp.vueApp.config && nuxtApp.vueApp.config.globalProperties) {
      emitter = nuxtApp.vueApp.config.globalProperties.$emitter;
    }
  } catch (err) {
    console.warn('Error accessing emitter:', err);
  }
  
  const uploadedFile = ref(null);
  const isUploading = ref(false);
  const authStore = useAuthStore();
  
  // Computed property for button disabled state to avoid null reference errors
  const isButtonDisabled = computed(() => {
    const hasInputText = inputMessage.value && inputMessage.value.trim && inputMessage.value.trim().length > 0;
    const hasUploadedFile = uploadedFile.value !== null;
    return (!hasInputText && !hasUploadedFile) || isUploading.value;
  });
  
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
        
        // Add file message to chat
        if (messages.value) {
          messages.value.push({
            isUser: true,
            content: `Uploaded file: ${file.name}`,
            file: uploadedFile.value,
            timestamp: new Date(),
            status: 'sent'
          });
        }
        
        // Scroll to bottom after adding the file message
        scrollToBottom();
      } catch (error) {
        console.error('Error uploading file:', error);
        
        // Fallback to local file display if upload fails
        uploadedFile.value = {
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file)
        };
        
        // Add file message to chat with error indication
        if (messages.value) {
          messages.value.push({
            isUser: true,
            content: `File: ${file.name} (upload failed)`,
            file: uploadedFile.value,
            timestamp: new Date(),
            status: 'error'
          });
        }
        
        // Scroll to bottom
        scrollToBottom();
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
  
    // Add user message if there's text input
    if (hasText && messages.value) {
      messages.value.push({
        isUser: true,
        content: inputMessage.value.trim(),
        timestamp: new Date(),
        status: 'sent'
      });
    }
  
    // Clear input
    const userMessage = hasText ? inputMessage.value.trim() : '';
    inputMessage.value = '';
  
    // Scroll to bottom
    await scrollToBottom();
  
    // If this is a new conversation, create it on the server
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
            // Store the conversation ID
            conversationId.value = response.data.id;
            
            // Safely emit events if emitter is available
            if (emitter && typeof emitter.emit === 'function') {
              // Try-catch to prevent any potential errors
              try {
                emitter.emit('strategy-created');
                
                // Emit a second refresh event with a slight delay to ensure it's processed
                setTimeout(() => {
                  if (emitter && typeof emitter.emit === 'function') {
                    emitter.emit('refresh-strategies');
                  }
                }, 200);
              } catch (err) {
                console.warn('Error emitting event:', err);
              }
            } else {
              console.warn('Event emitter not available or invalid');
            }
          } else {
            console.error('Failed to create conversation:', response?.error || 'Unknown error');
          }
        }
      } catch (error) {
        console.error('Error creating conversation:', error);
      }
    }
  
    // Simulate AI response
    if (messages.value) {
      setTimeout(async () => {
        messages.value.push({
          isUser: false,
          content: 'I received your message. This is a placeholder response.',
          timestamp: new Date(),
          status: 'delivered'
        });
        await scrollToBottom();
      }, 1000);
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
  
  // Initial scroll on mount
  onMounted(() => {
    scrollToBottom();
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