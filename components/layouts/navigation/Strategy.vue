<script setup>
import { ref, onMounted, onBeforeUnmount, onUnmounted } from 'vue';
import { useChatStore } from '@/stores/chat';
import { useNuxtApp } from '#app';
import VerticalNavItem from './VerticalNavItem.vue';

const drawer = ref(false);
const loading = ref(false);
const activeItem = ref(0);
const Strategies = ref([]);
const chatStore = useChatStore();

// Get emitter from Nuxt plugin
const nuxtApp = useNuxtApp();
const emitter = nuxtApp.$emitter;

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

// Function to fetch strategies from API
const fetchStrategies = async () => {
  loading.value = true;
  try {
    const response = await chatStore.fetchConversations();
    
    if (response.success) {
      // Map API response to menu items
      Strategies.value = response.data.map(item => ({
        id: item.id,
        title: item.title && item.title.length > 30 ? item.title.substring(0, 27) + '...' : item.title || 'Untitled',
        icon: 'mdi-message-outline',
        to: `/strategies/${item.id}`,
        subtitle: formatDate(item.createdAt)
      }));
    } else {
      console.error('Failed to load strategies:', response.error);
      Strategies.value = [];
    }
  } catch (error) {
    console.error('Error fetching strategies:', error);
    Strategies.value = [];
  } finally {
    loading.value = false;
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
    <v-list class="mt-2">
      <VerticalNavItem
        v-for="(item, index) in Strategies"
        :key="index"
        :active="activeItem === index"
        :item="item"
        @click="activeItem = index"
      />
      
      <div v-if="loading" class="d-flex justify-center py-2">
        <v-progress-circular indeterminate size="20" color="primary"></v-progress-circular>
      </div>
      
    </v-list>
  </div>
</template>

<style scoped>
.v-navigation-drawer {
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
}
</style> 