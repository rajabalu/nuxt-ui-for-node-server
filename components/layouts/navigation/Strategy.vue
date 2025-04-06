<script setup>
import { ref, onMounted } from 'vue';
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
    }
  } catch (error) {
    console.error('Error fetching strategies for menu:', error);
  } finally {
    loading.value = false;
  }
};

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