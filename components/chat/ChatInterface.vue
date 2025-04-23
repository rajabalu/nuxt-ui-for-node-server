<template>
  <div class="chat-interface d-flex flex-column">
    <!-- Loading Indicator -->
    <v-progress-linear v-if="isLoadingMessages" indeterminate></v-progress-linear>

    <!-- Chat Messages Area -->
    <div ref="chatHistoryRef" class="chat-history">
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

    <!-- Chat Input Component -->
    <div class="chat-input-wrapper">
      <ChatInput 
        :conversation-id="conversationId"
        @message-sent="handleMessageSent"
        @conversation-created="handleConversationCreated"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watchEffect, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import ChatMessage from '~/components/chat/ChatMessage.vue';
import ChatInput from '~/components/chat/ChatInput.vue';
import { useMessages } from '~/composables/chat';
import { useChatStore } from '~/stores/chat';

// Accept conversation ID as a prop
const props = defineProps({
  conversationId: {
    type: String,
    default: null
  }
});

// Define emitted events
const emit = defineEmits(['new-ai-message', 'conversation-created']);

// Router for navigation
const router = useRouter();

// Reactive references for DOM elements
const chatHistoryRef = ref(null);
const scrollAnchorRef = ref(null);

// Initialize conversation ID from prop
const conversationId = computed(() => props.conversationId);

// Use chat store
const chatStore = useChatStore();

// Message handling with composable
const { 
  messages, 
  isLoadingMessages, 
  isLoadingMoreMessages,
  hasMoreMessages,
  loadMessages,
  loadMoreMessages,
  scrollToBottom
} = useMessages({
  conversationId,
  chatHistoryRef,
  scrollAnchorRef
});

// Sort messages by timestamp
const sortedMessages = computed(() => {
  // If no messages, return empty array
  if (!messages.value || messages.value.length === 0) return [];
  
  // Filter out messages with undefined content and then sort
  const filtered = messages.value.filter(msg => msg.content !== undefined);
  return [...filtered].sort((a, b) => {
    const timeA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
    const timeB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
    return timeA - timeB; // Ascending order (oldest to newest)
  });
});

// Handle message sent event from ChatInput component
const handleMessageSent = async (responseData) => {
  // Emit the new AI message for external components (like talking head) if available
  if (responseData.aiResponse && responseData.aiResponse.content?.trim()) {
    emit('new-ai-message', responseData.aiResponse);
  }
  
  // Force immediate UI update and then scroll to bottom
  await nextTick();
  scrollToBottom();
};

// Handle new conversation created event
const handleConversationCreated = (newConversationId) => {
  // Navigate to the new conversation if needed
  if (newConversationId && !conversationId.value) {
    router.push(`/strategies/${newConversationId}`);
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
</script>

<style lang="scss" scoped>
.chat-interface {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-history {
  flex: 1;
  overflow-y: auto;
  scroll-behavior: smooth;
  padding: 16px 16px 0 16px;
  
  @media (max-width: 600px) {
    padding: 12px 8px 0 8px;
  }
  
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
  
  // Make scrollbars smaller on mobile
  @media (max-width: 600px) {
    &::-webkit-scrollbar {
      width: 4px;
    }
  }
}

.chat-input-wrapper {
  flex-shrink: 0;
}

// Mobile optimizations for buttons
@media (max-width: 600px) {
  :deep(.v-btn--size-small) {
    padding: 0 8px !important;
    font-size: 0.8rem !important;
  }
  
  :deep(.v-icon) {
    font-size: 1.2rem !important;
  }
}
</style>