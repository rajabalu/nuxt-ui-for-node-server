<script setup>
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';
import { useNotification } from '@/composables/useNotification';

const props = defineProps({
  userId: {
    type: [Number, String],
    default: null
  }
});

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const notification = useNotification();

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
    const response = await fetch('/api/v1/roles');
    const data = await response.json();
    roles.value = data;
  } catch (error) {
    notification.error(t('common.error_loading', 'Error loading roles'));
    console.error('Error loading roles:', error);
  }
};

// Load statuses from API
const loadStatuses = async () => {
  try {
    const response = await fetch('/api/v1/statuses');
    const data = await response.json();
    statuses.value = data;
  } catch (error) {
    notification.error(t('common.error_loading', 'Error loading statuses'));
    console.error('Error loading statuses:', error);
  }
};

// Load user data
const loadUser = async () => {
  isLoading.value = true;
  try {
    const response = await fetch(`/api/v1/users/${props.userId}`);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    const userData = await response.json();
    
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
    notification.error(t('users.load_error', 'Error loading user data'));
    console.error('Error loading user:', error);
  } finally {
    isLoading.value = false;
  }
};

// Save user data
const saveUser = async () => {
  if (!form.value.validate()) return;
  
  isSaving.value = true;
  
  try {
    const url = isEditMode.value 
      ? `/api/v1/users/${props.userId}` 
      : '/api/v1/users';
    
    const method = isEditMode.value ? 'PATCH' : 'POST';
    
    // Create payload (omit password if empty in edit mode)
    const payload = { ...formData.value };
    if (isEditMode.value && !payload.password) {
      delete payload.password;
    }
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    notification.success(
      isEditMode.value 
        ? t('users.update_success', 'User updated successfully')
        : t('users.create_success', 'User created successfully')
    );
    
    // Navigate back to users list
    router.push('/users');
  } catch (error) {
    notification.error(
      isEditMode.value 
        ? t('users.update_error', 'Error updating user')
        : t('users.create_error', 'Error creating user')
    );
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
              {{ $t('common.cancel', 'Cancel') }}
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