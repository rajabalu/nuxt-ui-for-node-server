<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuth } from '~/composables/auth';

// Get auth composable
const { user, loading, error, getCurrentUser, logout } = useAuth();

// Format date to readable string
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

// Computed properties
const fullName = computed(() => {
  if (!user.value) return 'N/A';
  
  const firstName = user.value.firstName || '';
  const lastName = user.value.lastName || '';
  
  return [firstName, lastName].filter(Boolean).join(' ') || 'N/A';
});

const userInitials = computed(() => {
  if (!user.value) return '';
  
  const firstName = user.value.firstName || '';
  const lastName = user.value.lastName || '';
  
  return [firstName[0], lastName[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase();
});

// Fetch user data on component mount
onMounted(async () => {
  await refreshUserData();
});

// Refresh user data
const refreshUserData = async () => {
  await getCurrentUser();
};

// Handle logout
const handleLogout = async () => {
  await logout();
  // Redirect to login page handled by auth store
};

// Define page meta for middleware
definePageMeta({
  middleware: ['auth']
});
</script>
<template>
  <div>
    <v-card class="mx-auto my-8" max-width="800">
      <v-card-title class="text-h5 font-weight-bold d-flex justify-space-between align-center">
        User Profile
        <v-btn color="primary" variant="text" :loading="loading" @click="refreshUserData">
          <v-icon icon="$refresh"></v-icon> Refresh
        </v-btn>
      </v-card-title>

      <v-card-text>
        <v-alert
          v-if="error"
          type="error"
          density="compact"
          class="mb-4"
          closable
          icon="tabler-alert-triangle"
          @click:close="error = null"
        >
          {{ error }}
        </v-alert>

        <div v-if="loading" class="d-flex justify-center align-center py-8">
          <v-progress-circular indeterminate color="primary" />
        </div>

        <div v-else-if="user">
          <v-row>
            <v-col cols="12" md="4" class="text-center">
              <v-avatar size="150" color="grey-lighten-3" class="mb-4">
                <v-img v-if="user.photo" :src="user.photo" alt="User Photo" />
                <span v-else class="text-h3">{{ userInitials }}</span>
              </v-avatar>
            </v-col>

            <v-col cols="12" md="8">
              <v-list>
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon icon="$email" class="me-3" />
                  </template>
                  <v-list-item-title>Email</v-list-item-title>
                  <v-list-item-subtitle>{{ user.email }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon icon="$account" class="me-3" />
                  </template>
                  <v-list-item-title>Full Name</v-list-item-title>
                  <v-list-item-subtitle>{{ fullName }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon icon="$shield" class="me-3" />
                  </template>
                  <v-list-item-title>Role</v-list-item-title>
                  <v-list-item-subtitle>{{ user.role?.name || 'Unknown' }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon icon="$check" class="me-3" />
                  </template>
                  <v-list-item-title>Status</v-list-item-title>
                  <v-list-item-subtitle>{{ user.status?.name || 'Unknown' }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon icon="$login" class="me-3" />
                  </template>
                  <v-list-item-title>Provider</v-list-item-title>
                  <v-list-item-subtitle>{{ user.provider }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon icon="$calendar" class="me-3" />
                  </template>
                  <v-list-item-title>Member Since</v-list-item-title>
                  <v-list-item-subtitle>{{ formatDate(user.createdAt) }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-col>
          </v-row>
        </div>

        <div v-else class="text-center py-8">
          <v-icon color="grey" size="64" icon="$accountOff"></v-icon>
          <div class="text-h6 mt-4">User data not available</div>
        </div>
      </v-card-text>

      <v-card-actions class="d-flex justify-end pa-4">
        <v-btn color="error" variant="outlined" :loading="loading" @click="handleLogout">
          <v-icon icon="$logout" class="me-2"></v-icon> Sign Out
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>
