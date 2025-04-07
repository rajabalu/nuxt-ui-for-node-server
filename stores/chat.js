import { defineStore } from 'pinia';
import { useApi } from '~/composables/api';
import { useNotification } from '~/composables/useNotification';

// Helper function to map API messages to local format
const mapApiMessagesToLocalFormat = (apiMessages = []) => {
  return apiMessages.map(msg => ({
    id: msg.id,
    isUser: msg.sender === 'user',
    content: msg.content || '',
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
        const formattedDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        
        const response = await api.post('conversations', {
          title: title || `Strategy as on ${formattedDate}`
        });
        
        if (response.success && response.data) {
          await this.fetchConversations(); // Refresh the conversations list
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
      this.isSendingMessage = true;
      const notification = useNotification();
      
      try {
        const api = useApi();
        let targetConversationId = conversationId;
    
        // If no conversation ID, create a new one
        if (!targetConversationId) {
          const createResult = await this.createConversation();
          if (!createResult.success) {
            notification.error(createResult.error || 'Failed to create conversation');
            return createResult;
          }
          targetConversationId = createResult.data.id;
        }
    
        // Prepare message data
        const messageData = {
          content: content || '',
          sender: 'user'
        };
    
        // Send message
        const response = await api.post(
          `conversations/${targetConversationId}/messages`, 
          messageData
        );
    
        if (response.success && response.data) {
          // Add message to UI if we're in the same conversation
          if (this.currentConversationId === targetConversationId) {
            const newMessage = {
              id: response.data.id,
              isUser: true,
              content: response.data.content,
              timestamp: new Date(response.data.createdAt),
              status: 'delivered',
              file: response.data.file ? {
                id: response.data.file.id,
                name: response.data.file.filename,
                path: response.data.file.path,
                url: response.data.file.path,
                type: response.data.file.mimetype,
                size: 0
              } : null
            };
            
            this.messages.push(newMessage);
          }
    
          // Call handleAiResponse to get the AI's response
          await this.handleAiResponse(targetConversationId);
    
          // Clear uploaded file after sending
          this.uploadedFile = null;
    
          return { 
            success: true, 
            data: response.data,
            conversationId: targetConversationId
          };
        }
    
        notification.error(response.error || 'Failed to send message');
        return { 
          success: false, 
          error: response.error || 'Failed to send message' 
        };
      } catch (error) {
        console.error('Error sending message:', error);
        notification.error('An error occurred while sending your message');
        return { 
          success: false, 
          error: 'An error occurred while sending the message' 
        };
      } finally {
        this.isSendingMessage = false;
      }
    },
    
    // Simulate or handle AI response
    async handleAiResponse(conversationId, simulatedResponse = null) {
      if (!conversationId) return;
      
      try {
        const api = useApi();
        
        // If simulated response provided, use it, otherwise make real API call
        let aiResponse;
        
        if (simulatedResponse) {
          // For testing or demo purposes
          aiResponse = {
            success: true,
            data: {
              id: Date.now().toString(),
              content: simulatedResponse,
              createdAt: new Date().toISOString(),
              sender: 'assistant'
            }
          };
        } else {
          // Real API call - but don't trigger if already waiting for response
          if (this.isSendingMessage) {
            return { success: false, error: 'Already processing a message' };
          }
          
          this.isSendingMessage = true;
          
          aiResponse = await api.post(`conversations/${conversationId}/messages`, {
            content: null,  // Use null instead of empty string
            sender: 'assistant',
            isAssistantRequest: true  // Flag to indicate this is specifically an AI request
          });
          
          this.isSendingMessage = false;
        }
        
        if (aiResponse.success && aiResponse.data) {
          // Add AI message to UI if we're in the same conversation and message has content
          if (this.currentConversationId === conversationId && aiResponse.data.content?.trim()) {
            const aiMessage = {
              id: aiResponse.data.id,
              isUser: false,
              content: aiResponse.data.content,
              timestamp: new Date(aiResponse.data.createdAt),
              status: 'delivered',
              file: null
            };
            
            this.messages.push(aiMessage);
          }
          
          return { success: true, data: aiResponse.data };
        }
        
        return { success: false, error: 'Failed to get AI response' };
      } catch (error) {
        console.error('Error with AI response:', error);
        return { success: false, error: 'An error occurred with the AI response' };
      } finally {
        this.isSendingMessage = false;
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