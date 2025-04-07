import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import { useChatStore } from '~/stores/chat';
import { useNotification } from '~/composables/useNotification';

/**
 * Composable for handling chat messages and scrolling
 * @param {Object} options - Options object
 * @param {Ref<String>} options.conversationId - The conversation ID reference
 * @param {Ref<HTMLElement>} options.chatHistoryRef - Reference to the chat history container
 * @param {Ref<HTMLElement>} options.scrollAnchorRef - Reference to the scroll anchor element
 * @returns {Object} - Chat message related methods and state
 */
export const useMessages = (options = {}) => {
  const { conversationId, chatHistoryRef, scrollAnchorRef } = options;
  
  // Get the chat store
  const chatStore = useChatStore();
  const notification = useNotification();
  
  // Computed properties from the store
  const messages = computed(() => {
    // Filter out messages with undefined content
    return chatStore.messages.filter(message => 
      message && message.content !== undefined && message.content !== null
    );
  });
  const isLoadingMessages = computed(() => chatStore.isLoadingMessages);
  const isLoadingMoreMessages = computed(() => chatStore.isLoadingMoreMessages);
  const hasMoreMessages = computed(() => chatStore.hasMoreMessages);
  
  /**
   * Load messages for the current conversation
   */
  const loadMessages = async (page = 1) => {
    if (!conversationId.value) return { success: false };
    
    // Ensure the current conversation ID is set in the store
    if (chatStore.currentConversationId !== conversationId.value) {
      chatStore.currentConversationId = conversationId.value;
    }
    
    try {
      const result = await chatStore.fetchMessages(conversationId.value, page);
      
      if (result.success && page === 1) {
        // Scroll to bottom after initial load
        await nextTick();
        scrollToBottom();
      } else if (!result.success) {
        // Handle error with notification
        notification.error(result.error || 'Failed to load messages');
      }
      
      return result;
    } catch (error) {
      notification.error('An error occurred while loading messages');
      return { success: false, error: 'An error occurred while loading messages' };
    }
  };
  
  /**
   * Load more messages (infinite scrolling)
   */
  const loadMoreMessages = async () => {
    try {
      const result = await chatStore.loadMoreMessages();
      
      if (!result.success) {
        notification.error(result.error || 'Failed to load more messages');
      }
      
      return result;
    } catch (error) {
      notification.error('An error occurred while loading more messages');
      return { success: false, error: 'An error occurred while loading more messages' };
    }
  };
  
  /**
   * Scroll to the bottom of the chat
   */
  const scrollToBottom = async () => {
    await nextTick();
    
    if (scrollAnchorRef && scrollAnchorRef.value) {
      scrollAnchorRef.value.scrollIntoView({ behavior: 'smooth' });
    } else if (chatHistoryRef && chatHistoryRef.value) {
      chatHistoryRef.value.scrollTop = chatHistoryRef.value.scrollHeight;
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
  
  // Watch for new messages in the store and scroll to bottom
  watch(() => messages.value.length, (newLength, oldLength) => {
    if (newLength > oldLength) {
      nextTick(() => {
        scrollToBottom();
      });
    }
  });
  
  // Initialize scroll handler and clean up
  onMounted(() => {
    if (chatHistoryRef && chatHistoryRef.value) {
      chatHistoryRef.value.addEventListener('scroll', handleScroll);
    }
    
    // Load messages if conversation ID is available
    if (conversationId && conversationId.value) {
      loadMessages(1);
    }
  });
  
  onBeforeUnmount(() => {
    if (chatHistoryRef && chatHistoryRef.value) {
      chatHistoryRef.value.removeEventListener('scroll', handleScroll);
    }
  });
  
  return {
    messages,
    isLoadingMessages,
    isLoadingMoreMessages,
    hasMoreMessages,
    loadMessages,
    loadMoreMessages,
    scrollToBottom,
    handleScroll
  };
}; 