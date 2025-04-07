<script setup>
import { ref, onMounted, onBeforeUnmount, onUnmounted, computed } from 'vue';
import { useChatStore } from '@/stores/chat';
import { useNuxtApp } from '#app';
import VerticalNavItem from './VerticalNavItem.vue';

const drawer = ref(false);
const loading = ref(false);
const activeItem = ref(0);
const strategiesData = ref([]);
const chatStore = useChatStore();

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
      />
      
      <div v-if="loading" class="d-flex justify-center py-3">
        <v-progress-circular indeterminate size="20" color="primary"></v-progress-circular>
      </div>
      
      <div v-if="!loading && Strategies.length === 0" class="text-center pa-4 text-medium-emphasis">
        No conversations yet
      </div>
    </v-list>
  </div>
</template>

<style lang="scss" scoped>
.navigation-list {
  padding: 0.5rem 0;
}
</style> 