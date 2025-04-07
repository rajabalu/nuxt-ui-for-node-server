import { defineStore } from 'pinia';
import { useApi } from '~/composables/api';
import { useNotification } from '~/composables/useNotification';
import { useNuxtApp } from '#app';

// Helper function to map API messages to local format
const mapApiMessagesToLocalFormat = (apiMessages = []) => {
  return apiMessages.map(msg => ({
    id: msg.id,
    isUser: msg.sender === 'user',
    content: msg.content || '',  // Ensure content is never undefined
    timestamp: new Date(msg.createdAt),
    status: 'delivered',
    file: msg.file ? {
      id: msg.file.id,
      name: msg.file.filename,
      path: msg.file.path,
      url: msg.file.path,
      type: msg.file.mimetype,
      size: 0 // Size typically not included in responses
    } : null
  }));
};

export const useChatStore = defineStore('chat', {
  state: () => ({
    conversations: [],
    currentConversationId: null,
    messages: [],
    isLoadingMessages: false,
    isLoadingMoreMessages: false,
    hasMoreMessages: false,
    currentPage: 1,
    messagesPerPage: 50,
    uploadedFile: null,
    isUploading: false,
    isSendingMessage: false
  }),
  
  getters: {
    canSendMessage: (state) => {
      const hasInputText = state.inputMessage && state.inputMessage.trim().length > 0;
      const hasUploadedFile = state.uploadedFile !== null;
      return (hasInputText || hasUploadedFile) && !state.isUploading && !state.isSendingMessage;
    }
  },
  
  actions: {
    // Load conversations (strategies)
    async fetchConversations() {
      try {
        const api = useApi();
        const response = await api.get('conversations');
        
        if (response.success && response.data) {
          // Handle different response structures
          const conversations = Array.isArray(response.data) 
            ? response.data 
            : (response.data?.data || []);
          
          this.conversations = conversations;
          return { success: true, data: conversations };
        }
        return { success: false, error: response.error || 'Failed to load conversations' };
      } catch (error) {
        console.error('Error fetching conversations:', error);
        return { success: false, error: 'An error occurred while fetching conversations' };
      }
    },
    
    // Load messages for the conversation
    async fetchMessages(conversationId, page = 1) {
      if (!conversationId) return { success: false, error: 'No conversation ID provided' };
      
      const isInitialLoad = page === 1;
      
      if (isInitialLoad) {
        this.isLoadingMessages = true;
        this.messages = []; // Clear existing messages for new conversation
      } else {
        this.isLoadingMoreMessages = true;
      }
      
      try {
        const api = useApi();
        const response = await api.get(
          `conversations/${conversationId}/messages?page=${page}&limit=${this.messagesPerPage}`
        );
        
        if (response.success && response.data) {
          // Process API response data
          const newMessages = mapApiMessagesToLocalFormat(response.data.data || []);
          
          if (isInitialLoad) {
            // For initial load, set messages directly (newest first from API)
            this.messages = newMessages.reverse(); // Reverse to show oldest first
          } else {
            // For pagination, add to beginning (older messages at top)
            this.messages = [...newMessages.reverse(), ...this.messages];
          }
          
          // Update pagination state
          this.hasMoreMessages = response.data.hasNextPage || false;
          this.currentPage = page;
          this.currentConversationId = conversationId;
          
          return { success: true };
        } 
        
        return { 
          success: false, 
          error: response.error || 'Failed to load messages' 
        };
      } catch (error) {
        console.error('Error loading messages:', error);
        return { 
          success: false, 
          error: 'An error occurred while loading messages' 
        };
      } finally {
        this.isLoadingMessages = false;
        this.isLoadingMoreMessages = false;
      }
    },
    
    // Load more messages (pagination)
    async loadMoreMessages() {
      if (this.hasMoreMessages && !this.isLoadingMoreMessages && this.currentConversationId) {
        return this.fetchMessages(this.currentConversationId, this.currentPage + 1);
      }
      return { success: false, error: 'No more messages or already loading' };
    },
    
    // Upload a file
    async uploadFile(file) {
      if (!file) return { success: false, error: 'No file provided' };
      
      this.isUploading = true;
      
      try {
        const api = useApi();
        const response = await api.upload('files/upload', file);
        
        if (response.success && response.data?.file) {
          this.uploadedFile = {
            id: response.data.file.id,
            name: file.name,
            size: file.size,
            type: file.type,
            path: response.data.file.path,
            url: response.data.file.path
          };
          return { success: true, data: this.uploadedFile };
        }
        
        return { 
          success: false, 
          error: response.error || 'File upload failed' 
        };
      } catch (error) {
        console.error('Error uploading file:', error);
        return { 
          success: false, 
          error: 'An error occurred during file upload' 
        };
      } finally {
        this.isUploading = false;
      }
    },
    
    // Clear uploaded file
    clearUploadedFile() {
      this.uploadedFile = null;
    },
    
    // Create a new conversation
    async createConversation(title) {
      try {
        const api = useApi();
        const notification = useNotification();
        const nuxtApp = useNuxtApp();
        const emitter = nuxtApp?.$emitter;
        const formattedDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        
        const response = await api.post('conversations', {
          title: title || `Strategy as on ${formattedDate}`
        });
        
        if (response.success && response.data) {
          await this.fetchConversations(); // Refresh the conversations list
          
          // Emit event to refresh strategies in navigation
          if (emitter && typeof emitter.emit === 'function') {
            emitter.emit('strategy-created');
            emitter.emit('refresh-strategies');
          }
          
          return { success: true, data: response.data };
        }
        
        return { 
          success: false, 
          error: response.error || 'Failed to create conversation' 
        };
      } catch (error) {
        console.error('Error creating conversation:', error);
        return { 
          success: false, 
          error: 'An error occurred while creating the conversation' 
        };
      }
    },
    
    // Send a message in a conversation
    async sendMessage(conversationId, content, fileId = null) {
      console.log('[Send Message] Starting sendMessage with:', { 
        hasConversationId: !!conversationId, 
        contentLength: content?.length,
        hasFileId: !!fileId 
      });

      // Prevent sending blank messages
      if (!content && !fileId) {
        console.log('[Send Message] Rejected: No content or file provided');
        return {
          success: false,
          error: 'Cannot send empty message'
        };
      }

      console.log('[Send Message] Setting isSendingMessage flag to true');
      this.isSendingMessage = true;
      const notification = useNotification();
      
      try {
        const api = useApi();
        let targetConversationId = conversationId;
    
        // If no conversation ID, create a new one
        if (!targetConversationId) {
          console.log('[Send Message] No conversation ID, creating new conversation');
          const createResult = await this.createConversation();
          if (!createResult.success) {
            console.error('[Send Message] Failed to create conversation:', createResult.error);
            notification.error(createResult.error || 'Failed to create conversation');
            return createResult;
          }
          targetConversationId = createResult.data.id;
          console.log('[Send Message] New conversation created with ID:', targetConversationId);
        } else {
          console.log('[Send Message] Using existing conversation ID:', targetConversationId);
        }
    
        // Prepare message data
        const messageData = {
          content: content || '',
          sender: 'user'
        };
        
        console.log('[Send Message] Prepared message data:', messageData);
    
        // Send message
        console.log('[Send Message] Sending message to API endpoint:', `conversations/${targetConversationId}/messages`);
        const response = await api.post(
          `conversations/${targetConversationId}/messages`, 
          messageData
        );
        console.log('[Send Message] API response received:', { 
          success: response.success, 
          hasData: !!response.data,
          hasUserMessage: !!response.data?.userMessage,
          hasAiResponse: !!response.data?.aiResponse
        });
        
        // Make sure the currentConversationId is set to the target conversation
        // This ensures messages are displayed in the UI
        if (this.currentConversationId !== targetConversationId) {
          console.log('[Send Message] Updating currentConversationId to match target:', targetConversationId);
          this.currentConversationId = targetConversationId;
        }
    
        if (response.success && response.data) {
          // Handle the combined response format from the server
          const responseData = response.data;
          
          // Process user message
          if (responseData.userMessage && responseData.userMessage.content) {
            console.log('[Send Message] Processing user message from response');
            const userMessage = {
              id: responseData.userMessage.id,
              isUser: true,
              content: responseData.userMessage.content || '',
              timestamp: new Date(responseData.userMessage.createdAt),
              status: 'delivered',
              file: responseData.userMessage.file ? {
                id: responseData.userMessage.file.id,
                name: responseData.userMessage.file.filename,
                path: responseData.userMessage.file.path,
                url: responseData.userMessage.file.path,
                type: responseData.userMessage.file.mimetype,
                size: 0
              } : null
            };
            
            console.log('[Send Message] Adding user message to UI:', userMessage.id);
            
            // Check if this message is already in our list before adding
            const userExists = this.messages.some(m => m.id === userMessage.id);
            if (!userExists) {
              this.messages.push(userMessage);
              console.log('[Send Message] User message added to messages array');
            } else {
              console.log('[Send Message] User message already exists in array, skipping');
            }
          }
          
          // Process AI response directly from the same call
          if (responseData.aiResponse && responseData.aiResponse.content) {
            console.log('[Send Message] Processing AI response from the same API call');
            const aiMessage = {
              id: responseData.aiResponse.id,
              isUser: false,
              content: responseData.aiResponse.content || '',
              timestamp: new Date(responseData.aiResponse.createdAt),
              status: 'delivered',
              file: null
            };
            
            console.log('[Send Message] Adding AI response to UI:', aiMessage.id);
            
            // Check if this message is already in our list before adding
            const aiExists = this.messages.some(m => m.id === aiMessage.id);
            if (!aiExists) {
              this.messages.push(aiMessage);
              console.log('[Send Message] AI message added to messages array');
            } else {
              console.log('[Send Message] AI message already exists in array, skipping');
            }
          }
    
          // Clear uploaded file after sending
          this.uploadedFile = null;
    
          return { 
            success: true, 
            data: response.data,
            conversationId: targetConversationId
          };
        }
    
        console.error('[Send Message] Failed to send message:', response.error);
        notification.error(response.error || 'Failed to send message');
        return { 
          success: false, 
          error: response.error || 'Failed to send message' 
        };
      } catch (error) {
        console.error('[Send Message] Error sending message:', error);
        notification.error('An error occurred while sending your message');
        return { 
          success: false, 
          error: 'An error occurred while sending the message' 
        };
      } finally {
        console.log('[Send Message] Completed message sending, setting isSendingMessage to false');
        this.isSendingMessage = false;
      }
    },
    
    // Simulate or handle AI response (now only used for specific cases, not normal message flow)
    async handleAiResponse(conversationId, simulatedResponse = null) {
      // This function is now deprecated for normal message flow
      if (!conversationId) {
        console.log('[AI Response] No conversation ID provided');
        return { success: false, info: 'No conversation ID provided' };
      }
      
      // Skip making API calls in normal flow - we're already handling AI responses in sendMessage
      console.log('[AI Response] ⚠️ This function is deprecated and should not be called in normal message flow');
      console.log('[AI Response] The server already returns both user and AI messages in a single response');
      
      if (!simulatedResponse) {
        console.log('[AI Response] Skipping unnecessary API call to prevent 422 errors');
        return { 
          success: false, 
          info: 'This function is not needed in normal message flow - responses are handled in sendMessage' 
        };
      }
      
      // Only continue for simulated responses
      console.log('[AI Response] Using simulated response (for testing only)');
      try {
        // For testing or demo purposes
        const simulatedMessage = {
          id: Date.now().toString(),
          isUser: false,
          content: simulatedResponse,
          timestamp: new Date(),
          status: 'delivered',
          file: null
        };
        
        // Add to UI if needed
        const exists = this.messages.some(m => m.id === simulatedMessage.id);
        if (!exists) {
          this.messages.push(simulatedMessage);
          console.log('[AI Response] Added simulated message to UI');
        }
        
        return { 
          success: true, 
          data: { 
            id: simulatedMessage.id, 
            content: simulatedMessage.content, 
            createdAt: simulatedMessage.timestamp 
          } 
        };
      } catch (error) {
        console.error('[AI Response] Error handling simulated response:', error);
        return { success: false, error: 'An error occurred with the simulated response' };
      }
    },

    clearMessages() {
      this.messages = [];
    },
    
    // Delete a conversation
    async deleteConversation(conversationId) {
      if (!conversationId) return { success: false, error: 'No conversation ID provided' };
      
      try {
        const api = useApi();
        const notification = useNotification();
        
        const response = await api.delete(`conversations/${conversationId}`);
        
        if (response.success) {
          // Remove from local state if present
          this.conversations = this.conversations.filter(conv => conv.id !== conversationId);
          
          // Clear messages if we're viewing the deleted conversation
          if (this.currentConversationId === conversationId) {
            this.messages = [];
            this.currentConversationId = null;
          }
          
          return { success: true };
        }
        
        return { 
          success: false, 
          error: response.error || 'Failed to delete conversation' 
        };
      } catch (error) {
        console.error('Error deleting conversation:', error);
        return { 
          success: false, 
          error: 'An error occurred while deleting the conversation' 
        };
      }
    }
  }
}); 