<script setup>
import { useI18n } from 'vue-i18n';
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const { t } = useI18n();
const { requiredValidator, emailValidator } = useValidators();
const api = useApi();

const refVForm = ref();
const email = ref("");
const isLoading = ref(false);
const showAlert = ref(false);
const alertType = ref("success");
const alertMessage = ref("");

const errors = ref({
  email: undefined,
});

// Show notification for success or error
const showNotification = (type, message) => {
  alertType.value = type;
  alertMessage.value = message;
  showAlert.value = true;
};

// Check for expired token query param
onMounted(() => {
  if (route.query.expired === 'true') {
    showNotification('error', t('resetTokenExpired', 'Your password reset link has expired. Please request a new one below.'));
  }
});

const onSubmit = async () => {
  const { valid: isValid } = await refVForm.value?.validate();
  
  if (isValid) {
    try {
      isLoading.value = true;
      errors.value.email = undefined;
      
      // Call the forgot password API endpoint
      const response = await api.post('auth/forgot/password', {
        email: email.value
      });
      
      if (response.success) {
        // Show success message
        showNotification('success', t('passwordResetEmailSent', 'An email has been sent to your email address with instructions to reset your password.'));
        email.value = ""; // Clear the input field
      } else {
        // Show error message from API
        showNotification('error', response.error || t('passwordResetFailed', 'Password reset request failed. Please try again.'));
        
        // Handle field-specific errors if available
        if (response.status === 422 && response.error?.errors?.email) {
          errors.value.email = response.error.errors.email;
        }
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      showNotification('error', t('passwordResetError', 'An error occurred while processing your request. Please try again later.'));
    } finally {
      isLoading.value = false;
    }
  }
};
</script>
<template>
  <v-card elevation="4">
    <v-card-item class="pa-6">
      <!-- Alert to show success or error messages with distinct icons -->
      <v-alert 
        v-if="showAlert" 
        :type="alertType" 
        closable 
        @click:close="showAlert = false" 
        class="mb-4"
        :icon="alertType === 'error' ? 'tabler-alert-triangle' : 'tabler-circle-check'"
      >
        {{ alertMessage }}
      </v-alert>

      <v-form ref="refVForm" @submit.prevent="onSubmit">
        <GlobalsTextField
          v-model="email"
          label="Email"
          type="email"
          autofocus
          placeholder="Email address here"
          :rules="[requiredValidator, emailValidator]"
          :error-messages="errors.email"
          :loading="isLoading"
          :disabled="isLoading"
          class="mb-3"
        />

        <v-btn type="submit" block :loading="isLoading" :disabled="isLoading">
          {{ t('resetPassword', 'Reset Password') }}
        </v-btn>
        <div class="mt-4 d-flex align-center justify-space-between ga-2 flex-wrap">
          <p class="text-body-1">
            {{ t('noAccount', "Don't have an account?") }}
            <NuxtLink to="sign-up" class="font-weight-5 text-primary">
              {{ t('signUp', 'sign up') }}
            </NuxtLink>
          </p>
        </div>
      </v-form>
    </v-card-item>
  </v-card>
</template>
