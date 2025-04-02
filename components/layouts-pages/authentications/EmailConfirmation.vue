<script setup>
import { useI18n } from 'vue-i18n';
import { useApi } from '~/composables/api';

const api = useApi();
const route = useRoute();
const { t } = useI18n();

const isLoading = ref(true);
const isSuccess = ref(false);
const errorMessage = ref('');

// Extract the hash from URL query parameter
const hash = computed(() => route.query.hash?.toString() || '');

// Verify email on component mount
onMounted(async () => {
  if (!hash.value) {
    isLoading.value = false;
    errorMessage.value = t('auth.emailVerification.failMessageInvalidLink');
    return;
  }

  try {
    const response = await api.post('auth/email/confirm/new', { hash: hash.value });
    
    if (response.success) {
      isSuccess.value = true;
    } else {
      errorMessage.value = response.error || t('auth.emailVerification.failMessageGeneric');
    }
  } catch (error) {
    console.error('Email confirmation error:', error);
    errorMessage.value = t('auth.emailVerification.failMessageError');
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <v-card elevation="4">
    <v-card-item class="pa-6">
      <div class="mb-6 text-center">
        <NuxtLink to="/" class="d-flex justify-center mb-4">
          <img src="/images/brand/logo/logo-light.svg" height="60px" />
        </NuxtLink>
        
        <!-- Loading state -->
        <div v-if="isLoading" class="d-flex flex-column align-center py-8">
          <v-progress-circular indeterminate color="primary" size="70" width="5"></v-progress-circular>
          <p class="text-body-1 mt-4">{{ t('auth.emailVerification.verifying') }}</p>
        </div>
        
        <!-- Success state -->
        <div v-else-if="isSuccess" class="py-6">
          <v-icon class="mb-4" color="success" icon="tabler-circle-check-filled" size="80"></v-icon>
          <h1 class="text-h4 mb-2">{{ t('auth.emailVerification.successTitle') }}</h1>
          <p class="text-body-1 mb-6">
            {{ t('auth.emailVerification.successMessage') }}
          </p>
          
          <v-btn to="/sign-in" color="primary" class="mt-4" block>
            {{ t('auth.emailVerification.loginBtn') }}
          </v-btn>
        </div>
        
        <!-- Error state -->
        <div v-else class="py-6">
          <v-icon class="mb-4" color="error" icon="tabler-alert-circle-filled" size="80"></v-icon>
          <h1 class="text-h4 mb-2">{{ t('auth.emailVerification.failTitle') }}</h1>
          <p class="text-body-1 mb-4">
            {{ errorMessage }}
          </p>
          
          <v-btn to="/" color="primary" variant="outlined" class="mt-4">
            {{ t('auth.emailVerification.returnHomeBtn') }}
          </v-btn>
        </div>
      </div>
    </v-card-item>
  </v-card>
</template> 