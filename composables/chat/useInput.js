import { ref, computed } from 'vue';
import { useChatStore } from '~/stores/chat';
import { useNotification } from '~/composables/useNotification';
import { useRouter } from 'vue-router';

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
  
  // Get the chat store
  const chatStore = useChatStore();
  const notification = useNotification();
  const router = useRouter();
  
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
    if (!content && !fileId) return;
    
    try {
      // Set message sending flag
      chatStore.isSendingMessage = true;
      
      // Clear the input before sending to prevent duplicates
      const messageToSend = content;
      inputMessage.value = '';
      
      const result = await chatStore.sendMessage(
        conversationId.value, 
        messageToSend,
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
        } else {
          // Wait a moment before triggering AI response to avoid overlapping requests
          setTimeout(async () => {
            if (!chatStore.isSendingMessage) {
              await chatStore.handleAiResponse(result.conversationId || conversationId.value);
              if (scrollToBottom) {
                await scrollToBottom();
              }
            }
          }, 1000);
        }
      } else {
        notification.error(result.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      notification.error('An error occurred while sending your message');
    } finally {
      chatStore.isSendingMessage = false;
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