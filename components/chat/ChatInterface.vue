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
        <v-card class="chat-input-card" elevation="3">
          <v-row no-gutters align="center">
            <!-- File upload button -->
            <v-col cols="auto" class="pl-2">
              <v-btn
                icon
                color="primary"
                variant="text"
                :aria-label="$t('chat.uploadFile')"
              >
                <v-icon>mdi-attachment</v-icon>
                <v-tooltip activator="parent" location="top">
                  {{ $t('chat.uploadFile') }}
                </v-tooltip>
              </v-btn>
            </v-col>
  
            <!-- Text input -->
            <v-col>
              <v-textarea
                v-model="inputMessage"
                :placeholder="$t('chat.typeMessage')"
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
                color="primary"
                variant="text"
                :aria-label="$t('chat.voiceInput')"
              >
                <v-icon>mdi-microphone</v-icon>
                <v-tooltip activator="parent" location="top">
                  {{ $t('chat.voiceInput') }}
                </v-tooltip>
              </v-btn>
            </v-col>
  
            <!-- Send button -->
            <v-col cols="auto" class="pr-2">
              <v-btn
                icon
                color="primary"
                :disabled="!inputMessage.trim()"
                @click="sendMessage"
                :aria-label="$t('chat.send')"
              >
                <v-icon>mdi-send</v-icon>
                <v-tooltip activator="parent" location="top">
                  {{ $t('chat.send') }}
                </v-tooltip>
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
    { isUser: false, content: 'Hello! How can I help you today?', timestamp: new Date(), status: 'delivered' },
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
    border-radius: 24px;
    background-color: rgb(var(--v-theme-surface-variant));
  }
  
  .chat-textarea {
    :deep(.v-field__field) {
      padding-top: 8px !important;
      padding-bottom: 8px !important;
    }
  }
  </style>