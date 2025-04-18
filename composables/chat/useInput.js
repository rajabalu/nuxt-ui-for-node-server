import { ref, computed } from 'vue';
import { useChatStore } from '~/stores/chat';
import { useNotification } from '~/composables/useNotification';
import { useRouter } from 'vue-router';
import { useNuxtApp } from '#app';
import { useSanitization } from './useSanitization';

/**
 * Composable for handling chat input and message sending
 * @param {Object} options - Options object
 * @param {Ref<String>} options.conversationId - The conversation ID reference
 * @param {Function} options.scrollToBottom - Function to scroll to bottom after sending
 * @returns {Object} - Chat input methods and state
 */
export const useInput = (options = {}) => {
  const { conversationId, scrollToBottom } = options;
  
  // Input message
  const inputMessage = ref('');
  
  // Get the chat store and sanitization utility
  const chatStore = useChatStore();
  const notification = useNotification();
  const router = useRouter();
  const nuxtApp = useNuxtApp();
  const emitter = nuxtApp?.$emitter;
  const { sanitizeForStorage } = useSanitization();
  
  // Computed properties from the store
  const isSendingMessage = computed(() => chatStore.isSendingMessage);
  const uploadedFile = computed(() => chatStore.uploadedFile);
  const isUploading = computed(() => chatStore.isUploading);
  
  // Computed property for button disabled state
  const isButtonDisabled = computed(() => {
    const hasInputText = inputMessage.value && inputMessage.value.trim && inputMessage.value.trim().length > 0;
    const hasUploadedFile = uploadedFile.value !== null;
    return (!hasInputText && !hasUploadedFile) || isUploading.value || isSendingMessage.value;
  });
  
  /**
   * Send a message in the current conversation
   */
  const sendMessage = async () => {
    if (isButtonDisabled.value) return;
    
    const content = inputMessage.value.trim();
    const fileId = uploadedFile.value?.id;
    
    // Check if we have content or file to send
    if (!content && !fileId) {
      return;
    }
    
    // Additional check for empty string
    if (content === '' && !fileId) {
      inputMessage.value = '';
      return;
    }
    
    try {
      // Set message sending flag to prevent duplicate submissions
      if (chatStore.isSendingMessage) {
        return;
      }
      
      // Sanitize the message before sending
      const sanitizedContent = sanitizeForStorage(content);
      
      // Clear the input before sending to prevent duplicates
      inputMessage.value = '';
      
      const result = await chatStore.sendMessage(
        conversationId.value, 
        sanitizedContent,
        fileId
      );
      
      if (result.success) {
        // Scroll to bottom
        if (scrollToBottom) {
          await scrollToBottom();
        }
        
        // If we created a new conversation, navigate to it
        if (!conversationId.value && result.conversationId) {
          router.push(`/strategies/${result.conversationId}`);
          
          // Emit events to refresh the strategy list
          if (emitter && typeof emitter.emit === 'function') {
            emitter.emit('strategy-created');
            emitter.emit('refresh-strategies');
          }
        } else {
          // Since we're handling both user message and AI response in a single call,
          // make sure the UI is updated properly
          if (scrollToBottom) {
            // Add a small delay to ensure messages are rendered before scrolling
            await new Promise(resolve => setTimeout(resolve, 100));
            await scrollToBottom();
          }
        }
      } else {
        notification.error(result.error || 'Failed to send message');
      }
    } catch (error) {
      notification.error('An error occurred while sending your message');
    }
  };
  
  /**
   * Handle Enter key press to send message
   */
  const onEnterPress = (event) => {
    if (event && !event.shiftKey) {
      sendMessage();
    }
  };
  
  return {
    inputMessage,
    isSendingMessage,
    isButtonDisabled,
    sendMessage,
    onEnterPress
  };
}; 