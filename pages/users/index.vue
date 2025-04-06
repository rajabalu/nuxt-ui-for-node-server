<script setup>
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useApi } from '@/composables/api';
import { useNotification } from '@/composables/useNotification';
import { useFormatters } from '@/composables/formatters';
import { useAuthStore } from '@/stores/auth';

const { t } = useI18n();
const api = useApi();
const notification = useNotification();
const { avatarText } = useFormatters();
const authStore = useAuthStore();

// Data from API
const users = ref([]);
const loading = ref(true);

// Fetch data
onMounted(async () => {
  try {
    // No need to check tokens here anymore - it's handled globally by the API interceptor
    const response = await api.get('users');
    users.value = response.data || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    notification.error(`API error: ${error.message || 'Failed to fetch users'}`);
    users.value = []; // Ensure users is always an array even on error
  } finally {
    loading.value = false;
  }
});

// Computed property for pagination total
const totalItems = computed(() => users.value?.length || 0);

// Table headers
const headers = [
  {
    title: 'Name',
    key: 'firstName'
  },
  {
    title: 'Email',
    key: 'email'
  },
  {
    title: 'Date',
    key: 'createdAt'
  },
  {
    title: 'Status',
    key: 'status.name'
  }
];

// Handle status display
const resolveStatusVariant = (status) => {
  if (status === 1)
    return {
      color: 'primary',
      text: 'Active'
    }
  else if (status === 2)
    return {
      color: 'success',
      text: 'Inactive'
    }
  else if (status === 3)
    return {
      color: 'error',
      text: 'Pending'
    }
  else if (status === 4)
    return {
      color: 'warning',
      text: 'Suspended'
    }
  else
    return {
      color: 'info',
      text: 'Applied'
    }
};

// Pagination settings
const itemsPerPage = ref(5);
const page = ref(1);
const selectedItems = ref([]);

// Delete confirmation dialog
const deleteDialog = ref(false);

// Calculate full name for display
const getFullName = (item) => {
  if (!item) return '';
  return `${item.firstName || ''} ${item.lastName || ''}`.trim();
};

// Get position or role for display
const getPosition = (item) => {
  if (!item) return '';
  return item.position || (item.role ? item.role.name : '');
};

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return '';
  
  // Check if it's already in MM/DD/YYYY format
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
    return dateString;
  }
  
  // Otherwise convert from ISO format
  try {
    const date = new Date(dateString);
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
  } catch (e) {
    return dateString;
  }
};

// Configuration from original code
const apiConfig = {
  list: 'users',
  delete: 'users/:id',
  edit: '/users/:id/edit',
  create: '/users/create'
};

// Configuration for actions
const config = {
  canAdd: true,
  canEdit: true,
  canDelete: true,
  canExport: true,
  addPath: '/users/create'
};

// Add new user
const handleAddUser = () => {
  navigateTo(config.addPath);
};

// Edit user - for row click
const handleRowClick = (item) => {
  console.log('Row clicked:', item);
  
  if (item && typeof item === 'object') {
    // The first argument to @click:row in Vuetify 3 Data Table is the item object itself
    // Access id property either from root or a possible nested structure
    const id = item.id;
    
    if (id) {
      const path = apiConfig.edit.replace(':id', id);
      navigateTo(path);
    } else {
      console.error('Item does not have an id property:', item);
      notification.error(t('users.invalid_id', 'Could not access user ID. Please try again.'));
    }
  } else {
    console.error('Invalid item:', item);
    notification.error(t('users.invalid_id', 'Could not access user ID. Please try again.'));
  }
};

// Confirm bulk delete
const confirmBulkDelete = () => {
  if (!selectedItems.value || selectedItems.value.length === 0) {
    notification.info('Please select items to delete');
    return;
  }
  deleteDialog.value = true;
};

// Delete selected users
const handleBulkDelete = async () => {
  if (!selectedItems.value || selectedItems.value.length === 0) return;
  
  try {
    console.log('Selected items for deletion:', selectedItems.value);
    
    // Process deletions one by one sequentially, as server can only handle one at a time
    for (const item of selectedItems.value) {
      console.log('Processing item for deletion:', item);
      
      // Handle different item types - could be an ID directly or an object
      let id;
      
      if (typeof item === 'number' || typeof item === 'string') {
        // Item is directly the ID
        id = item;
      } else if (item && typeof item === 'object') {
        // Item is an object, try to extract ID
        id = item.id || (item.raw && item.raw.id);
      } else {
        console.error('Invalid item structure:', item);
        continue; // Skip this item and move to next
      }
      
      if (!id) {
        console.error('Could not find ID in item:', item);
        continue; // Skip this item and move to next
      }
      
      console.log(`Deleting user with ID: ${id}`);
      
      // Delete one user at a time
      const deleteEndpoint = apiConfig.delete.replace(':id', id);
      const result = await api.delete(deleteEndpoint);
      
      if (!result.success) {
        console.error(`Failed to delete user ${id}:`, result.error);
        notification.error(`Failed to delete user ID ${id}: ${result.error || 'Unknown error'}`);
      }
    }
    
    // Show success message
    notification.success('Users deleted successfully');
    
    // Refresh the list
    const response = await api.get(apiConfig.list);
    users.value = response.data || [];
    deleteDialog.value = false;
    selectedItems.value = [];
  } catch (error) {
    console.error('Error in bulk delete:', error);
    notification.error('Error deleting users: ' + (error.message || error));
  }
};
</script>

<template>
  <div>
    <v-card class="elevation-1 rounded">
      <v-row class="ma-2">
        <v-col cols="auto">
          <v-btn
            v-if="config.canAdd"
            color="primary"
            prepend-icon="tabler-plus"
            @click="handleAddUser"
          >
            {{ $t('common.add', 'Add') }}
          </v-btn>
        </v-col>
        <v-col cols="auto">
          <v-btn
            color="error"
            variant="outlined"
            prepend-icon="tabler-trash"
            :disabled="!selectedItems || selectedItems.length === 0"
            @click="confirmBulkDelete"
            class="mr-2"
          >
            {{ $t('common.delete', 'Delete') }}
          </v-btn>
        </v-col>

      </v-row>
      
      <v-data-table
        v-model="selectedItems"
        :headers="headers"
        :items="users || []"
        :items-per-page="itemsPerPage"
        :loading="loading"
        show-select
        class="text-no-wrap"
      >
        <!-- Name column with avatar -->
        <template #item.firstName="{ item }">
          <div class="d-flex align-center">
            <v-avatar
              size="48"
              :color="item.photo && item.photo.path ? '' : 'primary'"
              :class="item.photo && item.photo.path ? '' : 'v-avatar-light-bg primary--text'"
              :variant="!(item.photo && item.photo.path) ? 'tonal' : undefined"
            >
              <v-img v-if="item.photo && item.photo.path" :src="item.photo.path" />
              <span v-else>{{ avatarText(getFullName(item)) }}</span>
            </v-avatar>
            <div class="d-flex flex-column ms-3">
              <span 
                class="d-block font-weight-medium text-high-emphasis cursor-pointer"
                @click="item && item.id ? navigateTo(apiConfig.edit.replace(':id', item.id)) : null"
              >
                {{ getFullName(item) }}
              </span>
              <small>{{ getPosition(item) }}</small>
            </div>
          </div>
        </template>

        <!-- Email column -->
        <template #item.email="{ item }">
          {{ item ? item.email : '' }}
        </template>
        
        <!-- Date column -->
        <template #item.createdAt="{ item }">
          {{ item ? formatDate(item.createdAt) : '' }}
        </template>
        
        <!-- Status chip -->
        <template #item.status.name="{ item }">
          <v-chip
            v-if="item && item.status"
            :color="resolveStatusVariant(item.status ? item.status.id : 5).color"
            class="font-weight-medium"
            size="small"
          >
            {{ resolveStatusVariant(item.status ? item.status.id : 5).text }}
          </v-chip>
          <span v-else></span>
        </template>
        
        <!-- Pagination at the bottom -->
        <template #bottom>
          <div class="d-flex align-center justify-end pt-4">
            <span class="text-subtitle-2 text-medium-emphasis me-2">
              {{ $t('common.items_per_page', 'Items per page') }}:
            </span>
            <v-select
              v-model="itemsPerPage"
              :items="[5, 10, 15, 20]"
              variant="outlined"
              density="compact"
              class="pagination-select"
              hide-details
            ></v-select>
            <v-pagination
              v-model="page"
              :length="Math.ceil(totalItems / itemsPerPage)"
              :total-visible="5"
            ></v-pagination>
          </div>
        </template>
      </v-data-table>
    </v-card>
    
    <!-- Delete confirmation dialog -->
    <v-dialog v-model="deleteDialog" max-width="500px">
      <v-card>
        <v-card-title>{{ $t('common.confirm_delete', 'Confirm Delete') }}</v-card-title>
        <v-card-text>
          {{ selectedItems && selectedItems.length > 1 
            ? $t('common.delete_multiple_confirmation', 'Are you sure you want to delete the selected items?') 
            : $t('common.delete_confirmation', 'Are you sure you want to delete this item?') 
          }}
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="deleteDialog = false">
            {{ $t('common.cancel', 'Cancel') }}
          </v-btn>
          <v-btn color="error" @click="handleBulkDelete">
            {{ $t('common.delete', 'Delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.pagination-select {
  max-width: 80px;
}

.cursor-pointer {
  cursor: pointer;
  text-decoration: none;
}

.cursor-pointer:hover {
  color: #1867c0;
  text-decoration: underline;
}
</style> 