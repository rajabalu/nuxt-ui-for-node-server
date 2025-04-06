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
              >
                <v-icon>mdi-microphone</v-icon>
              </v-btn>
  
              <v-btn
                icon
                variant="flat"
                color="primary"
                :disabled="!inputMessage.trim()"
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
  import { ref, onMounted, nextTick, watch } from 'vue';
  import ChatMessage from '~/components/chat/ChatMessage.vue';
  
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
  
  // File upload handlers
  const triggerFileInput = () => {
    fileInput.value.click();
  };

  const handleFileUpload = (event) => {
    const files = event.target.files;
    if (files.length > 0) {
      // Handle the uploaded file here
      console.log('Selected file:', files[0]);
      // You can add file validation and upload logic here
      // Example: validateFile(files[0]);
      // Example: uploadFile(files[0]);
      
      // Clear the input after handling
      event.target.value = '';
    }
  };
  
  // Auto-scroll to bottom
  const scrollToBottom = async () => {
    await nextTick();
    if (scrollAnchorRef.value) {
      scrollAnchorRef.value.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  // Send message handler
  const sendMessage = async () => {
    if (!inputMessage.value.trim()) return;
  
    // Add user message
    messages.value.push({
      isUser: true,
      content: inputMessage.value.trim(),
      timestamp: new Date(),
      status: 'sent'
    });
  
    // Clear input
    inputMessage.value = '';
  
    // Scroll to bottom
    await scrollToBottom();
  
    // Simulate AI response
    setTimeout(async () => {
      messages.value.push({
        isUser: false,
        content: 'I received your message. This is a placeholder response.',
        timestamp: new Date(),
        status: 'delivered'
      });
      await scrollToBottom();
    }, 1000);
  };
  
  // Enter key handler
  const onEnterPress = (event) => {
    if (!event.shiftKey) {
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