import { ref, computed } from 'vue';
import { useChatStore } from '~/stores/chat';
import { useNotification } from '~/composables/useNotification';

/**
 * Composable for handling file uploads in chat
 * @returns {Object} - File upload methods and state
 */
export const useFileUpload = () => {
  // File input reference
  const fileInput = ref(null);
  
  // Get the chat store
  const chatStore = useChatStore();
  const notification = useNotification();
  
  // Computed properties from the store
  const uploadedFile = computed(() => chatStore.uploadedFile);
  const isUploading = computed(() => chatStore.isUploading);
  
  /**
   * Trigger the file input click
   */
  const triggerFileInput = () => {
    if (fileInput.value) {
      fileInput.value.click();
    }
  };
  
  /**
   * Handle file selection and upload
   */
  const handleFileUpload = async (event) => {
    if (!event?.target?.files?.length) return;
    
    const file = event.target.files[0];
    
    try {
      const result = await chatStore.uploadFile(file);
      
      if (!result.success) {
        notification.error(result.error || 'File upload failed');
      }
    } catch (error) {
      notification.error('An error occurred while uploading the file');
    } finally {
      // Reset the input to allow uploading the same file again
      if (event.target) {
        event.target.value = '';
      }
    }
  };
  
  /**
   * Clear the uploaded file
   */
  const clearUploadedFile = () => {
    chatStore.clearUploadedFile();
  };
  
  return {
    fileInput,
    uploadedFile,
    isUploading,
    triggerFileInput,
    handleFileUpload,
    clearUploadedFile
  };
}; 