<script setup>
import { ref, onMounted, onBeforeUnmount, onUnmounted } from 'vue';
import { useApi } from '@/composables/api';
import { useNuxtApp } from '#app';

const drawer = ref(false);
const loading = ref(false);
const activeItem = ref(0);
const Strategies = ref([]);
const api = useApi();

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
    const response = await api.get('conversations');
    
    if (response && response.success) {
      // Check the actual structure of the response
      console.log('API response structure:', response);
      
      // Get the array of conversations from the correct path
      const conversations = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.data || []);
      
      // Map API response to menu items
      Strategies.value = conversations.map(item => ({
        id: item.id,
        title: item.title && item.title.length > 30 ? item.title.substring(0, 27) + '...' : item.title || 'Untitled',
        icon: 'mdi-message-outline',
        to: `/strategies/${item.id}`,
        subtitle: formatDate(item.createdAt)
      }));
    } else {
      console.error('Failed to load strategies:', response?.error || 'Unknown error');
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
    <v-navigation-drawer
      v-model="drawer"
      location="left"
      temporary
      class="rounded-r-xl border-r"
      style="min-width:290px"
    >
      <v-list class="mt-2">
        <template v-for="(item, index) in Strategies" :key="index">
          <v-list-item
            :to="item.to"
            :active="index === activeItem"
            @click="activeItem = index"
            class="my-1 rounded-r-xl mx-1"
          >
            <template v-slot:prepend>
              <v-icon :icon="item.icon"></v-icon>
            </template>
            <v-list-item-title>{{ item.title }}</v-list-item-title>
            <v-list-item-subtitle>{{ item.subtitle }}</v-list-item-subtitle>
          </v-list-item>
        </template>
      </v-list>
    </v-navigation-drawer>
  </div>
</template>

<style scoped>
.v-navigation-drawer {
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
}
</style> 