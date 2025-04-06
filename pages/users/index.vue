<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import CrudList from '@/components/globals/CrudList.vue';
import { useApi } from '@/composables/api';
import { useNotification } from '@/composables/useNotification';

const { t } = useI18n();
const api = useApi();
const notification = useNotification();

// Test direct API call
onMounted(async () => {
  try {
    // Test both with and without /api/v1 prefix to see which works
    const response = await api.get('users');
  } catch (error) {
    console.error('Error testing API:', error);
    notification.error(`API test error: ${error.message}`);
  }
});

// Users list columns
const columns = ref([
  { key: 'id', title: t('common.id', 'ID'), sortable: true },
  { key: 'firstName', title: t('users.firstName', 'First Name'), type: 'text', editable: true, primary: true },
  { key: 'lastName', title: t('users.lastName', 'Last Name'), type: 'text', editable: true },
  { key: 'email', title: t('users.email', 'Email'), type: 'text', editable: true },
  { 
    key: 'role.name', 
    title: t('users.role', 'Role'),
    type: 'select',
    editable: true,
    options: [
      { text: t('roles.admin', 'Admin'), value: 1 },
      { text: t('roles.user', 'User'), value: 2 }
    ]
  },
  { 
    key: 'status.name',
    title: t('users.status', 'Status'),
    type: 'select',
    editable: true,
    options: [
      { text: t('statuses.active', 'Active'), value: 1 },
      { text: t('statuses.inactive', 'Inactive'), value: 2 }
    ]
  },
  { key: 'createdAt', title: t('common.createdAt', 'Created Date'), type: 'date' }
]);

// API configuration - updated to work with the server's API structure
const apiConfig = {
  list: 'users', // Without leading slash to work with BASE_URL that has trailing slash
  delete: 'users/:id',
  edit: '/users/:id/edit', // This is a frontend route, not API
  create: '/users/create' // Add explicit create path
};

// Filters configuration
const filters = ref([
  { key: 'search', label: t('common.search', 'Search'), type: 'text' },
  { 
    key: 'filter.role.id', 
    label: t('users.role', 'Role'), 
    type: 'select',
    options: [
      { text: t('roles.admin', 'Admin'), value: 1 },
      { text: t('roles.user', 'User'), value: 2 }
    ]
  },
  { 
    key: 'filter.status.id', 
    label: t('users.status', 'Status'), 
    type: 'select',
    options: [
      { text: t('statuses.active', 'Active'), value: 1 },
      { text: t('statuses.inactive', 'Inactive'), value: 2 }
    ]
  }
]);

// Configuration
const config = {
  canAdd: true,
  canEdit: true,
  canDelete: true,
  canExport: true,
  addPath: '/users/create'
};

// Initial sort
const initialSort = [
  {
    key: 'createdAt',
    order: 'desc'
  }
];
</script>

<template>
  <div>
    <h1 class="text-h4 mb-4">{{ $t('users.management', 'User Management') }}</h1>
    
    <CrudList
      :columns="columns"
      :api-config="apiConfig"
      :filters="filters"
      :config="config"
      :initial-sort="initialSort"
    >
      <!-- Custom photo renderer -->
      <template #cell-photo.path="{ item }">
        <v-avatar v-if="item.photo && item.photo.path" size="32">
          <v-img :src="item.photo.path" alt="User photo"></v-img>
        </v-avatar>
        <span v-else>{{ $t('common.no_photo', 'No photo') }}</span>
      </template>
    </CrudList>
  </div>
</template> 