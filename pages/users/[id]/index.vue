<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useNotification } from '@/composables/useNotification';
import { useApi } from '@/composables/api';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const notification = useNotification();
const api = useApi();

const userId = route.params.id;
const user = ref(null);
const isLoading = ref(true);

definePageMeta({
  title: 'users.view_user',
  middleware: 'auth'
});

onMounted(async () => {
  await loadUser();
});

const loadUser = async () => {
  isLoading.value = true;
  try {
    const response = await api.get(`users/${userId}`);
    if (!response.success) {
      throw new Error(`Error: ${response.error}`);
    }
    user.value = response.data;
  } catch (error) {
    notification.error(t('users.load_error', 'Error loading user data'));
    console.error('Error loading user:', error);
  } finally {
    isLoading.value = false;
  }
};

const handleEdit = () => {
  router.push(`/users/${userId}/edit`);
};

const handleDelete = async () => {
  try {
    const response = await api.delete(`users/${userId}`);
    
    if (!response.success) {
      throw new Error(`Error: ${response.error}`);
    }
    
    notification.success(t('users.delete_success', 'User deleted successfully'));
    router.push('/users');
  } catch (error) {
    notification.error(t('users.delete_error', 'Error deleting user'));
    console.error('Error deleting user:', error);
  }
};

const confirmDelete = () => {
  if (confirm(t('users.confirm_delete', 'Are you sure you want to delete this user?'))) {
    handleDelete();
  }
};
</script>

<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center mb-4">
          <h1 class="text-h4">{{ $t('users.user_details', 'User Details') }}</h1>
          <v-spacer></v-spacer>
          <v-btn 
            color="primary" 
            class="ml-2" 
            prepend-icon="tabler-edit"
            @click="handleEdit"
          >
            {{ $t('common.edit', 'Edit') }}
          </v-btn>
          <v-btn 
            color="error" 
            class="ml-2" 
            prepend-icon="tabler-trash"
            @click="confirmDelete"
          >
            {{ $t('common.delete', 'Delete') }}
          </v-btn>
        </div>
        
        <v-card>
          <v-card-text>
            <v-skeleton-loader
              v-if="isLoading"
              type="card"
            ></v-skeleton-loader>
            
            <div v-else-if="user">
              <v-row>
                <v-col cols="12" md="4" class="text-center">
                  <v-avatar size="150" class="mb-3">
                    <v-img
                      v-if="user.photo && user.photo.path"
                      :src="user.photo.path"
                      alt="User photo"
                    ></v-img>
                    <v-icon v-else size="150">tabler-user</v-icon>
                  </v-avatar>
                </v-col>
                
                <v-col cols="12" md="8">
                  <v-list>
                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon icon="tabler-mail"></v-icon>
                      </template>
                      <v-list-item-title>{{ $t('users.email', 'Email') }}</v-list-item-title>
                      <v-list-item-subtitle>{{ user.email }}</v-list-item-subtitle>
                    </v-list-item>
                    
                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon icon="tabler-user"></v-icon>
                      </template>
                      <v-list-item-title>{{ $t('users.fullName', 'Full Name') }}</v-list-item-title>
                      <v-list-item-subtitle>{{ user.firstName }} {{ user.lastName }}</v-list-item-subtitle>
                    </v-list-item>
                    
                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon icon="tabler-user-circle"></v-icon>
                      </template>
                      <v-list-item-title>{{ $t('users.role', 'Role') }}</v-list-item-title>
                      <v-list-item-subtitle>{{ user.role?.name }}</v-list-item-subtitle>
                    </v-list-item>
                    
                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon icon="tabler-circle"></v-icon>
                      </template>
                      <v-list-item-title>{{ $t('users.status', 'Status') }}</v-list-item-title>
                      <v-list-item-subtitle>{{ user.status?.name }}</v-list-item-subtitle>
                    </v-list-item>
                    
                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon icon="tabler-calendar"></v-icon>
                      </template>
                      <v-list-item-title>{{ $t('common.createdAt', 'Created Date') }}</v-list-item-title>
                      <v-list-item-subtitle>{{ new Date(user.createdAt).toLocaleDateString() }}</v-list-item-subtitle>
                    </v-list-item>
                    
                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon icon="tabler-calendar"></v-icon>
                      </template>
                      <v-list-item-title>{{ $t('common.updatedAt', 'Updated Date') }}</v-list-item-title>
                      <v-list-item-subtitle>{{ new Date(user.updatedAt).toLocaleDateString() }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </v-col>
              </v-row>
            </div>
            
            <div v-else class="text-center py-4">
              <v-icon size="64" color="error">tabler-alert-circle</v-icon>
              <p class="text-h6 mt-2">{{ $t('users.not_found', 'User not found') }}</p>
            </div>
          </v-card-text>
          
          <v-card-actions v-if="user">
            <v-spacer></v-spacer>
            <v-btn 
              color="secondary" 
              variant="outlined" 
              @click="router.push('/users')"
            >
              {{ $t('common.back_to_list', 'Back to List') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template> 