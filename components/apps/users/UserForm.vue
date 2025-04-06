<script setup>
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';
import { useApi } from '@/composables/api';
import { useAuthStore } from '@/stores/auth';
import { useNuxtApp } from '#app';

const props = defineProps({
  userId: {
    type: [Number, String],
    default: null
  }
});

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const api = useApi();
const authStore = useAuthStore();
const { $notification } = useNuxtApp();

// Form data
const formData = ref({
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  photo: null,
  role: null,
  status: null
});

// Loading states
const isLoading = ref(false);
const isSaving = ref(false);

// References to form elements
const form = ref(null);

// Available roles and statuses
const roles = ref([]);
const statuses = ref([]);

// Password visibility toggle
const showPassword = ref(false);

// Computed properties
const isEditMode = computed(() => !!props.userId);
const formTitle = computed(() => isEditMode.value ? t('users.edit_user', 'Edit User') : t('users.add_user', 'Add User'));

// Load user data if in edit mode
onMounted(async () => {
  loadRoles();
  loadStatuses();
  
  if (isEditMode.value) {
    await loadUser();
  }
});

// Load roles from API
const loadRoles = async () => {
  try {
    const response = await api.get('roles');
    if (response.success) {
      console.log('Roles loaded:', response.data);
      roles.value = response.data;
    } else {
      throw new Error(response.error || 'Failed to load roles');
    }
  } catch (error) {
    console.error('Error loading roles, using fallback data:', error);
    // Use fallback data if API fails
    roles.value = [
      { id: 1, name: 'Admin' },
      { id: 2, name: 'User' },
      { id: 3, name: 'Manager' },
      { id: 4, name: 'Editor' }
    ];
    $notification.info(t('common.using_fallback', 'Using fallback roles data'));
  }
};

// Load statuses from API
const loadStatuses = async () => {
  try {
    const response = await api.get('statuses');
    if (response.success) {
      console.log('Statuses loaded:', response.data);
      statuses.value = response.data;
    } else {
      throw new Error(response.error || 'Failed to load statuses');
    }
  } catch (error) {
    console.error('Error loading statuses, using fallback data:', error);
    // Use fallback data if API fails
    statuses.value = [
      { id: 1, name: 'Active' },
      { id: 2, name: 'Inactive' },
      { id: 3, name: 'Pending' },
      { id: 4, name: 'Suspended' }
    ];
    $notification.info(t('common.using_fallback', 'Using fallback statuses data'));
  }
};

// Load user data
const loadUser = async () => {
  isLoading.value = true;
  try {
    const response = await api.get(`users/${props.userId}`);
    if (!response.success) {
      throw new Error(`Error: ${response.error}`);
    }
    const userData = response.data;
    
    // Map API data to form fields
    formData.value.email = userData.email || '';
    formData.value.firstName = userData.firstName || '';
    formData.value.lastName = userData.lastName || '';
    formData.value.role = userData.role || null;
    formData.value.status = userData.status || null;
    formData.value.photo = userData.photo || null;
    
    // Don't set password on edit
    formData.value.password = '';
  } catch (error) {
    $notification.error(t('users.load_error', 'Error loading user data'));
    console.error('Error loading user:', error);
    
    // Use mock data for testing when API fails
    formData.value.email = `user${props.userId}@example.com`;
    formData.value.firstName = 'Test';
    formData.value.lastName = 'User';
    formData.value.role = roles.value[0];
    formData.value.status = statuses.value[0];
    formData.value.password = '';
  } finally {
    isLoading.value = false;
  }
};

// Save user data
const saveUser = async () => {
  if (!form.value.validate()) return;
  
  isSaving.value = true;
  
  try {
    // Create payload with the exact structure expected by the API
    const payload = {
      email: formData.value.email,
      firstName: formData.value.firstName,
      lastName: formData.value.lastName
    };
    
    // Include the user ID in the payload when editing
    if (isEditMode.value && props.userId) {
      payload.id = parseInt(props.userId);
    }
    
    // Only include password if it's not empty
    if (formData.value.password) {
      payload.password = formData.value.password;
    }
    
    // Format role, status and photo with exact structure required
    if (formData.value.role && formData.value.role.id) {
      payload.role = { 
        id: formData.value.role.id
      };
    }
    
    if (formData.value.status && formData.value.status.id) {
      payload.status = { 
        id: formData.value.status.id
      };
    }
    
    if (formData.value.photo && formData.value.photo.id) {
      payload.photo = { 
        id: formData.value.photo.id
      };
    }
    
    // Handle create vs update differently
    let response;
    if (isEditMode.value) {
      // For update, use direct fetch for more control
      const updateUrl = `${api.getBaseUrl()}users/${props.userId}`;
      
      const fetchResponse = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!fetchResponse.ok) {
        const errorData = await fetchResponse.json();
        console.error('Update error details:', errorData);
        let errorMessage = 'Failed to update user';
        
        // Extract detailed error message if available
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          // Handle validation errors array
          errorMessage = errorData.errors.map(err => err.message || err).join(', ');
        }
        
        // Show error notification with the detailed message
        $notification.error(errorMessage, {
          title: 'Update Failed',
          timeout: 8000
        });
        
        throw new Error(`Update failed: ${errorMessage}`);
      }
      
      const data = await fetchResponse.json();
      response = { success: true, data };
    } else {
      // For create, use the API composable
      response = await api.post('users', payload);
      
      if (!response.success) {
        console.error('API Error Response:', response);
        let errorMessage = response.error || 'Failed to create user';
        $notification.error(errorMessage, {
          title: 'Create Failed',
          timeout: 8000
        });
        throw new Error(`Error: ${errorMessage}`);
      }
    }
    
    $notification.success(
      isEditMode.value 
        ? t('users.update_success', 'User updated successfully')
        : t('users.create_success', 'User created successfully'),
      {
        title: isEditMode.value ? 'Update Success' : 'Create Success',
        timeout: 5000
      }
    );
  } catch (error) {
    // Only show generic error if a specific one wasn't already shown
    if (!error.message.includes('Update failed:') && !error.message.includes('Error:')) {
      $notification.error(
        isEditMode.value 
          ? t('users.update_error', 'Error updating user') 
          : t('users.create_error', 'Error creating user')
      );
    }
    console.error('Error saving user:', error);
  } finally {
    isSaving.value = false;
  }
};

// Cancel form
const cancelForm = () => {
  router.push('/users');
};
</script>

<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">{{ formTitle }}</h1>
        
        <v-card>
          <v-card-text>
            <v-form ref="form">
              <v-row>
                <!-- Email -->
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.email"
                    :label="$t('users.email', 'Email')"
                    type="email"
                    required
                    :rules="[
                      v => !!v || $t('validation.required', 'This field is required'),
                      v => /.+@.+\..+/.test(v) || $t('validation.email', 'Must be a valid email')
                    ]"
                    variant="outlined"
                  />
                </v-col>
                
                <!-- Password -->
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.password"
                    :label="$t('users.password', 'Password')"
                    :type="showPassword ? 'text' : 'password'"
                    :rules="[
                      v => (isEditMode && v === '') ? true : (!!v && v.length >= 8) || $t('validation.password', 'Password must be at least 8 characters')
                    ]"
                    variant="outlined"
                    :placeholder="isEditMode ? $t('users.leave_blank', 'Leave blank to keep current password') : ''"
                    :append-inner-icon="showPassword ? 'tabler-eye-off' : 'tabler-eye'"
                    @click:append-inner="showPassword = !showPassword"
                  />
                </v-col>
                
                <!-- First Name -->
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.firstName"
                    :label="$t('users.firstName', 'First Name')"
                    required
                    :rules="[v => !!v || $t('validation.required', 'This field is required')]"
                    variant="outlined"
                  />
                </v-col>
                
                <!-- Last Name -->
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.lastName"
                    :label="$t('users.lastName', 'Last Name')"
                    required
                    :rules="[v => !!v || $t('validation.required', 'This field is required')]"
                    variant="outlined"
                  />
                </v-col>
                
                <!-- Role -->
                <v-col cols="12" md="6">
                  <v-select
                    v-model="formData.role"
                    :items="roles"
                    item-title="name"
                    item-value="id"
                    return-object
                    :label="$t('users.role', 'Role')"
                    required
                    :rules="[v => !!v || $t('validation.required', 'This field is required')]"
                    variant="outlined"
                  />
                </v-col>
                
                <!-- Status -->
                <v-col cols="12" md="6">
                  <v-select
                    v-model="formData.status"
                    :items="statuses"
                    item-title="name"
                    item-value="id"
                    return-object
                    :label="$t('users.status', 'Status')"
                    required
                    :rules="[v => !!v || $t('validation.required', 'This field is required')]"
                    variant="outlined"
                  />
                </v-col>
                
                <!-- Photo Upload -->
                <v-col cols="12">
                  <FileUpload
                    v-model="formData.photo"
                    :label="$t('users.photo', 'Profile Photo')"
                    accept="image/*"
                  />
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
          
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn 
              color="secondary" 
              variant="outlined" 
              :disabled="isSaving" 
              @click="cancelForm"
            >
              {{ $t('common.close', 'Close') }}
            </v-btn>
            <v-btn 
              color="primary" 
              :loading="isSaving" 
              @click="saveUser"
            >
              {{ isEditMode ? $t('common.update', 'Update') : $t('common.create', 'Create') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template> 