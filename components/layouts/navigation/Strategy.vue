<script setup>
import { ref, onMounted, onBeforeUnmount, onUnmounted, computed } from 'vue';
import { useChatStore } from '@/stores/chat';
import { useNuxtApp } from '#app';
import { useNotification } from '~/composables/useNotification';
import { useApi } from '~/composables/api';
import VerticalNavItem from './VerticalNavItem.vue';

const drawer = ref(false);
const loading = ref(false);
const activeItem = ref(0);
const strategiesData = ref([]);
const chatStore = useChatStore();
const notification = useNotification();
const api = useApi();

// Confirmation dialog
const deleteDialog = ref(false);
const itemToDelete = ref(null);
const deleteLoading = ref(false);

// Rename operation
const renameLoading = ref(false);

// Get emitter from Nuxt plugin
const nuxtApp = useNuxtApp();
const emitter = nuxtApp.$emitter;

// Sort strategies by updatedAt in descending order (newest first)
const Strategies = computed(() => {
  return strategiesData.value.sort((a, b) => {
    const dateA = new Date(a.updatedAt || a.createdAt || 0);
    const dateB = new Date(b.updatedAt || b.createdAt || 0);
    return dateB - dateA;
  });
});

// Function to fetch strategies from API
const fetchStrategies = async () => {
  loading.value = true;
  try {
    const response = await chatStore.fetchConversations();
    
    if (response.success) {
      // Map API response to menu items
      strategiesData.value = response.data.map(item => ({
        id: item.id,
        title: item.title && item.title.length > 30 ? item.title.substring(0, 27) + '...' : item.title || 'Untitled',
        icon: 'tabler-message-circle',
        to: `/strategies/${item.id}`,
        updatedAt: item.updatedAt || item.createdAt
      }));
    } else {
      console.error('Failed to load strategies:', response.error);
      strategiesData.value = [];
    }
  } catch (error) {
    console.error('Error fetching strategies:', error);
    strategiesData.value = [];
  } finally {
    loading.value = false;
  }
};

// Handle delete item click
const handleDeleteClick = (item) => {
  itemToDelete.value = item;
  deleteDialog.value = true;
};

// Handle rename item
const handleRenameItem = async (data) => {
  if (!data || !data.id || !data.title) return;
  
  renameLoading.value = true;
  try {
    const response = await api.patch(`conversations/${data.id}`, {
      title: data.title
    });
    
    if (response.success) {
      // Update the local item
      const index = strategiesData.value.findIndex(item => item.id === data.id);
      if (index !== -1) {
        // Create new title with ellipsis if needed
        const displayTitle = data.title.length > 30 ? data.title.substring(0, 27) + '...' : data.title;
        
        // Update local data
        strategiesData.value[index] = {
          ...strategiesData.value[index],
          title: displayTitle,
          // Update the timestamp to move it to the top
          updatedAt: new Date().toISOString()
        };
      }
      
      // Show success notification
      notification.success('Conversation renamed successfully');
      
      // Also update in the chat store if present
      if (chatStore.conversations && Array.isArray(chatStore.conversations)) {
        const storeIndex = chatStore.conversations.findIndex(item => item.id === data.id);
        if (storeIndex !== -1) {
          chatStore.conversations[storeIndex].title = data.title;
        }
      }
    } else {
      notification.error(response.error || 'Failed to rename conversation');
    }
  } catch (error) {
    console.error('Error renaming conversation:', error);
    notification.error('An error occurred while renaming the conversation');
  } finally {
    renameLoading.value = false;
  }
};

// Direct API delete method (alternative to store method)
const deleteConversation = async (conversationId) => {
  if (!conversationId) return { success: false, error: 'No conversation ID provided' };
  
  try {
    const response = await api.delete(`conversations/${conversationId}`);
    
    if (response.success) {
      // Remove from chatStore state if present
      chatStore.conversations = chatStore.conversations.filter(conv => conv.id !== conversationId);
      
      // Clear messages if we're viewing the deleted conversation
      if (chatStore.currentConversationId === conversationId) {
        chatStore.messages = [];
        chatStore.currentConversationId = null;
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
};

// Confirm delete
const confirmDelete = async () => {
  if (!itemToDelete.value) return;
  
  deleteLoading.value = true;
  try {
    // Call our local deleteConversation method instead of store method
    const result = await deleteConversation(itemToDelete.value.id);
    
    if (result.success) {
      // Success notification
      notification.success('Conversation deleted successfully');
      
      // Close dialog
      deleteDialog.value = false;
      
      // Update the list by removing the deleted item
      strategiesData.value = strategiesData.value.filter(item => item.id !== itemToDelete.value.id);
    } else {
      // Error notification
      notification.error(result.error || 'Failed to delete conversation');
    }
  } catch (error) {
    console.error('Error deleting conversation:', error);
    notification.error('An error occurred while deleting the conversation');
  } finally {
    deleteLoading.value = false;
  }
};

// Setup event listener
onMounted(() => {
  fetchStrategies();
  
  // Listen for events to refresh strategies
  if (emitter && typeof emitter.on === 'function') {
    emitter.on('strategy-created', fetchStrategies);
    emitter.on('refresh-strategies', fetchStrategies);
  }
});

// Cleanup event listeners on component unmount
onUnmounted(() => {
  if (emitter && typeof emitter.off === 'function') {
    emitter.off('strategy-created', fetchStrategies);
    emitter.off('refresh-strategies', fetchStrategies);
  }
});

// Expose drawer for parent components
defineExpose({
  drawer
});
</script>

<template>
  <div>
    <v-list class="mt-2 navigation-list">
      <VerticalNavItem
        v-for="(item, index) in Strategies"
        :key="item.id"
        :active="activeItem === index"
        :item="item"
        @click="activeItem = index"
        @deleteItem="handleDeleteClick"
        @renameItem="handleRenameItem"
      />
      
      <div v-if="loading" class="d-flex justify-center py-3">
        <v-progress-circular indeterminate size="20" color="primary"></v-progress-circular>
      </div>
      
      <div v-if="!loading && Strategies.length === 0" class="text-center pa-4 text-medium-emphasis">
        No conversations yet
      </div>
    </v-list>
    
    <!-- Confirmation dialog for delete -->
    <v-dialog v-model="deleteDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5 pa-4">Confirm Delete</v-card-title>
        <v-card-text class="pa-4">
          Are you sure you want to delete this conversation? This action cannot be undone.
          <div class="mt-2 text-subtitle-1">
            <strong>{{ itemToDelete?.title }}</strong>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="deleteDialog = false">
            Cancel
          </v-btn>
          <v-btn 
            color="error" 
            variant="flat" 
            @click="confirmDelete"
            :loading="deleteLoading"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style lang="scss" scoped>
.navigation-list {
  padding: 0.5rem 0;
}
</style> 