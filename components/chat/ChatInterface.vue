<template>
    <div class="chat-interface d-flex flex-column">
      <!-- Chat history area (scrollable) -->
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
  
        <!-- Auto-scroll anchor -->
        <div ref="scrollAnchorRef"></div>
      </div>
  
      <!-- Chat input area (fixed at bottom) -->
      <div class="chat-input-container pa-3">
        <v-card class="chat-input-card" elevation="0">
          <v-row no-gutters align="center">
            <!-- Text input -->
            <v-col>
              <v-textarea
                v-model="inputMessage"
                placeholder="Type a message..."
                auto-grow
                rows="1"
                row-height="20"
                max-rows="5"
                hide-details
                variant="plain"
                density="comfortable"
                class="chat-textarea px-2"
                @keydown.enter.prevent="onEnterPress"
              ></v-textarea>
            </v-col>
  
            <!-- Voice input button -->
            <v-col cols="auto">
              <v-btn
                icon
                color="#6366F1"
                variant="text"
                aria-label="Voice input"
                class="mx-1"
              >
                <v-icon>mdi-microphone</v-icon>
              </v-btn>
            </v-col>
  
            <!-- Send button -->
            <v-col cols="auto">
              <v-btn
                icon
                color="white"
                :disabled="!inputMessage.trim()"
                @click="sendMessage"
                aria-label="Send message"
                class="send-button"
              >
                <v-icon>mdi-arrow-right</v-icon>
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
  
  // Define the chat messages
  const messages = ref([
    { isUser: false, content: 'Hello! How can I help you today?', timestamp: new Date('2023-04-14T05:42:00'), status: 'delivered' },
  ]);
  
  // Input message binding
  const inputMessage = ref('');
  const chatHistoryRef = ref(null);
  const scrollAnchorRef = ref(null);
  
  // Scroll to bottom of chat
  const scrollToBottom = async () => {
    await nextTick();
    if (scrollAnchorRef.value) {
      scrollAnchorRef.value.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  // Send message function
  const sendMessage = async () => {
    if (!inputMessage.value.trim()) return;
    
    // Add user message
    messages.value.push({
      isUser: true,
      content: inputMessage.value,
      timestamp: new Date(),
      status: 'sent'
    });
    
    // Clear input
    inputMessage.value = '';
    
    // Scroll to bottom
    await scrollToBottom();
    
    // Simulate assistant response (replace with actual API call)
    setTimeout(() => {
      messages.value.push({
        isUser: false,
        content: 'I received your message. This is a placeholder response.',
        timestamp: new Date(),
        status: 'delivered'
      });
      scrollToBottom();
    }, 1000);
  };
  
  // Handle Enter key
  const onEnterPress = (event) => {
    // Allow new line with Shift+Enter
    if (!event.shiftKey) {
      sendMessage();
    }
  };
  
  // Watch messages to auto-scroll on new messages
  watch(messages, () => {
    scrollToBottom();
  }, { deep: true });
  
  // Initial scroll to bottom on mount
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
    padding: 16px;
    overflow-y: auto;
    scroll-behavior: smooth;
  }
  
  .chat-input-container {
    border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12);
    background-color: rgb(var(--v-theme-surface));
  }
  
  .chat-input-card {
    border-radius: 100px;
    background-color: #303030; // Dark input background
    padding: 4px;
  }
  
  .chat-textarea {
    :deep(.v-field__field) {
      padding-top: 8px !important;
      padding-bottom: 8px !important;
    }
    
    :deep(.v-field) {
      color: white;
    }
    
    :deep(textarea::placeholder) {
      color: rgba(255, 255, 255, 0.7);
    }
  }
  
  .send-button {
    background-color: #6366F1 !important; // Purple send button
    margin-right: 4px;
  }
  </style>