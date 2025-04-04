<script setup>
import { getLocalizedPath } from '@/utils/i18n-helpers';
import { useI18n } from 'vue-i18n';

const api = useApi();
const route = useRoute();
const authStore = useAuthStore();
const isLoading = ref(true);
const isSuccess = ref(false);
const errorMessage = ref('');
const newEmail = ref('');
const { locale } = useI18n();

// Define page meta for layout
definePageMeta({
  layout: "blank",
  middleware: "public"
});

useSeoMeta({
  title: "Email Change Confirmation",
  ogTitle: "Email Change Confirmation",
  description: "Verify your new email address to complete the change process.",
  ogDescription: "Verify your new email address to complete the change process.",
  ogImage: "",
  twitterCard: "summary_large_image",
});

// Extract the hash from URL query parameter
const hash = computed(() => route.query.hash?.toString() || '');

// Verify new email on component mount
onMounted(async () => {
  if (!hash.value) {
    isLoading.value = false;
    errorMessage.value = 'Invalid confirmation link. The verification hash is missing.';
    return;
  }

  try {
    // Use the api composable instead of direct fetch
    const response = await api.post('auth/email/confirm/new', {
      hash: hash.value
    });
    
    if (response.success) {
      isSuccess.value = true;
      
      // Store the new email if returned from the API
      if (response.data?.email) {
        newEmail.value = response.data.email;
      }
      
      // Clear current session data to force re-login with new email
      if (authStore.isAuthenticated) {
        // Use clearAuthData instead of logout to avoid automatic redirect
        authStore.clearAuthData();
        authStore.isAuthenticated = false;
      }
    } else {
      errorMessage.value = response.error || 'Email change verification failed. Please try again.';
    }
  } catch (error) {
    console.error('Email confirmation error:', error);
    errorMessage.value = 'An error occurred during email verification. Please try again later.';
  } finally {
    isLoading.value = false;
  }
});

// Button click handler to ensure user is properly logged out before redirecting
const handleLoginClick = () => {
  // Clear auth data again to be extra safe
  if (authStore.isAuthenticated) {
    authStore.clearAuthData();
    authStore.isAuthenticated = false;
  }
  // Clear any lingering session data in localStorage
  if (process.client) {
    localStorage.removeItem('auth');
  }
  
  // Use the locale already defined at the top level
  const signInPath = getLocalizedPath('/sign-in', locale.value);
  
  // Navigate to sign-in page with locale
  navigateTo(signInPath);
};
</script>

<template>
  <v-container fluid class="h-100">
    <v-row justify="center" align="center" class="h-100">
      <v-col cols="12" sm="8" md="6" lg="4" xl="3">
        <v-card elevation="4">
          <v-card-item class="pa-6">
            <div class="mb-6 text-center">
              <NuxtLink :to="getLocalizedPath('/', locale.value)" class="d-flex justify-center mb-4">
                <img src="/images/brand/logo/logo-light.svg" height="60px" />
              </NuxtLink>
              
              <!-- Loading state -->
              <div v-if="isLoading" class="d-flex flex-column align-center py-8">
                <v-progress-circular indeterminate color="primary" size="70" width="5"></v-progress-circular>
                <p class="text-body-1 mt-4">Verifying your new email address...</p>
              </div>
              
              <!-- Success state -->
              <div v-else-if="isSuccess" class="py-6">
                <v-icon class="mb-4" color="success" icon="tabler-circle-check-filled" size="80"></v-icon>
                <h1 class="text-h4 mb-2">Email Changed Successfully!</h1>
                <p class="text-body-1 mb-2">
                  Your email address has been successfully changed.
                </p>
                <p class="text-body-1 mb-6" v-if="newEmail">
                  Please use <strong>{{ newEmail }}</strong> for all future logins and communications.
                </p>
                <p class="text-body-1 mb-6" v-else>
                  Please use your new email address for all future logins and communications.
                </p>
                
                <v-btn @click="handleLoginClick" color="primary" class="mt-4" block>
                  Login with New Email
                </v-btn>
              </div>
              
              <!-- Error state -->
              <div v-else class="py-6">
                <v-icon class="mb-4" color="error" icon="tabler-alert-circle-filled" size="80"></v-icon>
                <h1 class="text-h4 mb-2">Email Change Failed</h1>
                <p class="text-body-1 mb-4">
                  {{ errorMessage }}
                </p>
                
                <v-btn :to="getLocalizedPath('/', locale.value)" color="primary" variant="outlined" class="mt-4">
                  Return to Home
                </v-btn>
              </div>
            </div>
          </v-card-item>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template> 