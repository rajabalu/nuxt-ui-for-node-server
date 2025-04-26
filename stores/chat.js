import { defineStore } from 'pinia';
import { useApi } from '~/composables/api';
import { useNotification } from '~/composables/useNotification';
import { useNuxtApp } from '#app';
import { mapApiMessagesToUiFormat, mapApiMessageToUiFormat, generateMessageId } from '~/utils/chat';

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
    messagesPerPage: 10,
    uploadedFile: null,
    isUploading: false,
    isSendingMessage: false,
    pendingMessages: {}, // Track messages being sent with their IDs
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
      
      try {
        // Set loading state
        if (page === 1) {
          this.isLoadingMessages = true;
        } else {
          this.isLoadingMoreMessages = true;
        }
        
        // Update current page
        this.currentPage = page;
        
        const api = useApi();
        
        // Log request details for debugging
        console.log(`[Chat] Fetching messages for conversation ${conversationId}, page ${page}, limit ${this.messagesPerPage}`);
        
        const response = await api.get(`conversations/${conversationId}/messages`, {
          params: {
            page,
            limit: this.messagesPerPage
          }
        });
        
        // Log response for debugging
        console.log(`[Chat] Messages response:`, response);
        
        if (response.success && response.data) {
          // Handle different response structures
          const apiMessages = Array.isArray(response.data) 
            ? response.data 
            : (response.data?.data || []);
          
          console.log(`[Chat] Received ${apiMessages.length} messages from API`);
          
          // Use our utility function to map messages
          const mappedMessages = mapApiMessagesToUiFormat(apiMessages);
          
          // For first page, replace messages; otherwise, prepend
          if (page === 1) {
            this.messages = mappedMessages;
          } else {
            // Add only new messages to avoid duplicates
            const existingIds = new Set(this.messages.map(m => m.id));
            const newMessages = mappedMessages.filter(m => !existingIds.has(m.id));
            
            // Make sure messages are sorted by timestamp (oldest messages first for proper display)
            // This is important especially when adding older messages from pagination
            this.messages = [...newMessages, ...this.messages].sort((a, b) => {
              return new Date(a.timestamp) - new Date(b.timestamp);
            });
            
            console.log(`[Chat] Added ${newMessages.length} new messages from page ${page}`);
          }
          
          // Check if there are more messages to load
          // If the API returns exactly the number we requested, assume there might be more
          this.hasMoreMessages = apiMessages.length >= this.messagesPerPage;
          console.log(`[Chat] Has more messages: ${this.hasMoreMessages}`);
          
          return { success: true, data: mappedMessages };
        }
        
        console.error('[Chat] Failed to load messages:', response.error);
        return { success: false, error: response.error || 'Failed to load messages' };
      } catch (error) {
        console.error('Error loading messages:', error);
        return { success: false, error: 'An error occurred while loading messages' };
      } finally {
        // Reset loading states
        if (page === 1) {
          this.isLoadingMessages = false;
        } else {
          this.isLoadingMoreMessages = false;
        }
      }
    },
    
    // Load more messages (pagination)
    async loadMoreMessages() {
      if (this.hasMoreMessages && !this.isLoadingMoreMessages && this.currentConversationId) {
        console.log(`[Chat] Loading more messages, current page: ${this.currentPage}, next page: ${this.currentPage + 1}`);
        return this.fetchMessages(this.currentConversationId, this.currentPage + 1);
      }
      
      console.log(`[Chat] Cannot load more messages. hasMoreMessages: ${this.hasMoreMessages}, isLoading: ${this.isLoadingMoreMessages}, convoId: ${this.currentConversationId}`);
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
    
    // Set the sending state for a specific message
    setMessageSendingState(messageId, isSending) {
      if (isSending) {
        this.pendingMessages[messageId] = true;
      } else {
        delete this.pendingMessages[messageId];
      }
      
      // Update the global sending flag based on whether any messages are pending
      this.isSendingMessage = Object.keys(this.pendingMessages).length > 0;
    },

    // Send a message with improved tracking
    async sendMessage(conversationId, content, fileId = null) {
      // Generate a unique ID for this message sending operation
      const messageId = generateMessageId();
      
      try {
        // Set message as pending
        this.setMessageSendingState(messageId, true);
        
        let targetConversationId = conversationId;
        
        // If no conversation ID, create a new one
        if (!targetConversationId) {
          const createResult = await this.createConversation();
          
          if (!createResult.success) {
            return { success: false, error: createResult.error || 'Failed to create conversation' };
          }
          
          targetConversationId = createResult.data.id;
        }
        
        // Prepare message data
        const messageData = {
          content: content || '',
          sender: 'user'
        };
        
        // Add file if provided
        if (fileId) {
          messageData.file = { id: fileId };
        }
        
        // Reset uploaded file after sending
        if (fileId) {
          this.clearUploadedFile();
        }
        
        // Send the message
        const api = useApi();
        const response = await api.post(
          `conversations/${targetConversationId}/messages`, 
          messageData
        );
        
        // Make sure the currentConversationId is set to the target conversation
        // This ensures messages are displayed in the UI
        if (this.currentConversationId !== targetConversationId) {
          this.currentConversationId = targetConversationId;
        }
        
        if (response.success && response.data) {
          // Handle the combined response format from the server
          const responseData = response.data;
          
          // Process user message using our utility functions
          if (responseData.userMessage) {
            const userMessage = mapApiMessageToUiFormat(responseData.userMessage);
            
            if (userMessage) {
              // Check if this message is already in our list before adding
              const userExists = this.messages.some(m => m.id === userMessage.id);
              if (!userExists) {
                this.messages.push(userMessage);
              }
            }
          }
          
          // Process AI response using our utility functions
          if (responseData.aiResponse) {
            const aiMessage = mapApiMessageToUiFormat(responseData.aiResponse);
            
            if (aiMessage) {
              // Check if this message is already in our list before adding
              const aiExists = this.messages.some(m => m.id === aiMessage.id);
              if (!aiExists) {
                this.messages.push(aiMessage);
              }
            }
          }
          
          // Return success with conversation ID for navigation
          return { 
            success: true, 
            data: response.data,
            conversationId: targetConversationId
          };
        }
        
        return { 
          success: false, 
          error: response.error || 'Failed to send message'
        };
      } catch (error) {
        console.error('Error sending message:', error);
        return { 
          success: false, 
          error: 'An error occurred while sending your message'
        };
      } finally {
        // Always clear the sending state for this message
        this.setMessageSendingState(messageId, false);
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