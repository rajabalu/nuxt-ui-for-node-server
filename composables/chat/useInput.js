import { ref, computed } from 'vue';
import { useChatStore } from '~/stores/chat';
import { useNotification } from '~/composables/useNotification';
import { useRouter } from 'vue-router';
import { useNuxtApp } from '#app';

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
  const nuxtApp = useNuxtApp();
  const emitter = nuxtApp?.$emitter;
  
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
    console.log('[useInput] sendMessage called, button disabled:', isButtonDisabled.value);
    if (isButtonDisabled.value) return;
    
    const content = inputMessage.value.trim();
    const fileId = uploadedFile.value?.id;
    
    console.log('[useInput] Message content length:', content?.length, 'Has file:', !!fileId);
    
    // Check if we have content or file to send
    if (!content && !fileId) {
      console.log('[useInput] No content or file, returning early');
      return;
    }
    
    // Additional check for empty string
    if (content === '' && !fileId) {
      console.log('[useInput] Empty content and no file, clearing input and returning');
      inputMessage.value = '';
      return;
    }
    
    try {
      // Set message sending flag to prevent duplicate submissions
      if (chatStore.isSendingMessage) {
        console.log('[useInput] Already sending a message, aborting to prevent duplicates');
        console.log('[useInput] Store state:', { isSendingMessage: chatStore.isSendingMessage });
        return;
      }
      
      console.log('[useInput] Starting message send process');
      chatStore.isSendingMessage = true;
      
      // Clear the input before sending to prevent duplicates
      const messageToSend = content;
      inputMessage.value = '';
      
      console.log('[useInput] Calling chatStore.sendMessage with:', { 
        conversationId: conversationId.value,
        contentLength: messageToSend?.length,
        hasFileId: !!fileId
      });
      
      const result = await chatStore.sendMessage(
        conversationId.value, 
        messageToSend,
        fileId
      );
      
      console.log('[useInput] sendMessage result:', { 
        success: result.success, 
        hasData: !!result.data,
        conversationId: result.conversationId 
      });
      debugger;
      if (result.success) {
        // Scroll to bottom
        if (scrollToBottom) {
          await scrollToBottom();
          console.log('[useInput] Scrolled to bottom after message send');
        }
        
        // If we created a new conversation, navigate to it
        if (!conversationId.value && result.conversationId) {
          console.log('[useInput] Navigating to new conversation:', result.conversationId);
          router.push(`/strategies/${result.conversationId}`);
          
          // Emit events to refresh the strategy list
          if (emitter && typeof emitter.emit === 'function') {
            console.log('[useInput] Emitting refresh events for new conversation');
            emitter.emit('strategy-created');
            emitter.emit('refresh-strategies');
          }
        } else {
          console.log('[useInput] Using existing conversation, message flow completed');
          
          // Since we're handling both user message and AI response in a single call,
          // we just need to make sure the UI is updated properly
          if (scrollToBottom) {
            // Add a small delay to ensure messages are rendered before scrolling
            await new Promise(resolve => setTimeout(resolve, 100));
            await scrollToBottom();
            console.log('[useInput] Scrolled to bottom after message flow completed');
          }
        }
      } else {
        console.error('[useInput] Failed to send message:', result.error);
        notification.error(result.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('[useInput] Error in sendMessage:', error);
      notification.error('An error occurred while sending your message');
      chatStore.isSendingMessage = false; // Reset only on error
    } finally {
      console.log('[useInput] sendMessage completed, isSendingMessage delegated to store');
      // Don't reset isSendingMessage here, let the store handle it
      // The store will reset it after the AI response is processed
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