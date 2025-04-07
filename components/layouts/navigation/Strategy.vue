<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useApi } from '@/composables/api';

defineProps({
  menuType: {
    type: String,
    default: "vertical",
  },
});

// Define strategies array that will hold our menu items
const Strategies = ref([]);

const loading = ref(false);

// Try to get the emitter through the provide/inject system first
const nuxtApp = useNuxtApp();
// Access emitter through the provide system or global properties as fallback
const providedEmitter = nuxtApp.$emitter;
// If it's available through inject, use it; otherwise fall back to global properties
const emitter = providedEmitter || nuxtApp.vueApp?.config?.globalProperties?.$emitter || null;

// Fetch strategies from the API and update the navigation menu
const fetchStrategies = async () => {
  loading.value = true;
  
  try {
    const api = useApi();
    const response = await api.get('conversations?page=1&limit=5');
    
    if (response.success && response.data.data) {
      // Map API response to menu items, truncating titles if needed
      Strategies.value = response.data.data.map(item => ({
        title: item.title.length > 30 ? item.title.substring(0, 30) + '...' : item.title,
        to: `strategies/${item.id}`,
        icon: "tabler-message"
      }));
      console.log('Strategies menu updated:', Strategies.value);
    }
  } catch (error) {
    console.error('Error fetching strategies for menu:', error);
  } finally {
    loading.value = false;
  }
};

// Listen for strategy-created events and handle cleanup if emitter exists
if (emitter) {
  try {
    // Set up event listeners
    const setupEventListeners = () => {
      emitter.on('strategy-created', fetchStrategies);
      emitter.on('refresh-strategies', fetchStrategies);
    };
    
    // Initial setup
    setupEventListeners();
    
    // Clean up event listeners when component is unmounted
    onBeforeUnmount(() => {
      if (emitter) {
        try {
          emitter.off('strategy-created', fetchStrategies);
          emitter.off('refresh-strategies', fetchStrategies);
        } catch (err) {
          console.warn('Error removing event listeners:', err);
        }
      }
    });
  } catch (err) {
    console.warn('Error setting up event listeners:', err);
  }
}

// Fetch strategies when component is mounted
onMounted(() => {
  fetchStrategies();
});
</script>

<template>
  <template v-if="menuType === 'vertical'">
    <v-list-group value="strategy" color="primary">
      <template #activator="{ props }">
        <v-list-item v-bind="props" title="Strategies" class="vertical-nav-list__item py-2">
          <template #prepend>
            <v-icon icon="tabler-message" color="primary" bold />
          </template>
        </v-list-item>
      </template>

      <v-list-item
        v-for="item in Strategies"
        :key="item.to"
        class="vertical-nav-list__group"
        :title="item.title"
        :to="`/${item.to}`"
      />
    </v-list-group>
  </template>
</template> 