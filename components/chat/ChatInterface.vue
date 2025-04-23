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

    <!-- Chat Input Component -->
    <ChatInput 
      :conversation-id="conversationId"
      @message-sent="handleMessageSent"
      @conversation-created="handleConversationCreated"
    />
  </div>
</template>

<script setup>
import { ref, computed, watchEffect, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import ChatMessage from '~/components/chat/ChatMessage.vue';
import ChatInput from '~/components/chat/ChatInput.vue';
import { useMessages } from '~/composables/chat';
import { useChatStore } from '~/stores/chat';
import { mapApiMessageToUiFormat } from '~/utils/chat';

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

// Memoized sorted messages to optimize performance
const sortedMessagesCache = ref({
  messages: [],
  sorted: []
});

// Sort messages by timestamp
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

// Handle message sent event from ChatInput component
const handleMessageSent = async (responseData) => {
  // Process and display user message
  if (responseData.userMessage && responseData.userMessage.content?.trim()) {
    const userMessage = responseData.userMessage.id ? 
      responseData.userMessage : // Use as-is if it already has an ID (temporary message)
      mapApiMessageToUiFormat(responseData.userMessage); // Format API message
    
    if (userMessage) {
      // If this is a temporary message, just add it
      if (userMessage.status === 'sending') {
        messages.value = [...messages.value, userMessage];
      } else {
        // For server messages, check if we need to replace a temporary message
        const tempIndex = messages.value.findIndex(m => 
          m.status === 'sending' && 
          m.isUser && 
          m.content === userMessage.content
        );
        
        if (tempIndex >= 0) {
          // Replace temporary message with server version
          const updatedMessages = [...messages.value];
          updatedMessages[tempIndex] = userMessage;
          messages.value = updatedMessages;
        } else {
          // Otherwise add as new message if not already present
          const exists = messages.value.some(m => m.id === userMessage.id);
          if (!exists) {
            messages.value = [...messages.value, userMessage];
          }
        }
      }
      
      // Force invalidation of the sortedMessages computed property
      sortedMessagesCache.value = {
        messages: messages.value,
        sorted: null // Force recalculation
      };
    }
  }
  
  // Process and display AI response if available
  if (responseData.aiResponse && responseData.aiResponse.content?.trim()) {
    const aiMessage = mapApiMessageToUiFormat(responseData.aiResponse);
    
    if (aiMessage) {
      // Check if this message is already in our list before adding
      const exists = messages.value.some(m => m.id === aiMessage.id);
      if (!exists) {
        // Use a reactive update to ensure Vue detects the change
        messages.value = [...messages.value, aiMessage];
        
        // Force invalidation of the sortedMessages computed property
        sortedMessagesCache.value = {
          messages: messages.value,
          sorted: null // Force recalculation
        };
        
        // Emit the new AI message for external components (like talking head)
        emit('new-ai-message', aiMessage);
      }
    }
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

// Watch for new messages and scroll to bottom
watchEffect(() => {
  if (messages.value && messages.value.length > 0) {
    // Small delay to ensure DOM is updated
    setTimeout(() => {
      scrollToBottom();
    }, 100);
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