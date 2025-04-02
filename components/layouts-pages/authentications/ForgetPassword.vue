<script setup>
import { useI18n } from 'vue-i18n';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useValidators } from '~/composables/validators';
import { useApi } from '~/composables/api';

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
    showNotification('error', t('auth.errors.resetTokenExpired'));
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
        showNotification('success', t('auth.errors.passwordResetEmailSent'));
        email.value = ""; // Clear the input field
      } else {
        // Show error message from API or fallback translation
        showNotification('error', response.error || t('auth.errors.passwordResetFailed'));
        
        // Handle field-specific errors if available
        if (response.status === 422 && response.error?.errors?.email) {
          errors.value.email = response.error.errors.email;
        }
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      showNotification('error', t('auth.errors.passwordResetError'));
    } finally {
      isLoading.value = false;
    }
  }
};
</script>
<template>
  <v-card elevation="4">
    <v-card-item class="pa-6">
      <h5 class="text-h5 text-center mb-2">{{ t('auth.forgotPasswordTitle') }}</h5>
      <p class="text-body-2 text-center mb-4">{{ t('auth.forgotPasswordInstructions') }}</p>
      
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
          :label="t('common.email')"
          type="email"
          autofocus
          :placeholder="t('auth.emailPlaceholder')"
          :rules="[requiredValidator, emailValidator]"
          :error-messages="errors.email"
          :loading="isLoading"
          :disabled="isLoading"
          class="mb-3"
        />

        <v-btn type="submit" block :loading="isLoading" :disabled="isLoading">
          {{ t('auth.resetPasswordBtn') }}
        </v-btn>
        <div class="mt-4 d-flex align-center justify-center ga-2 flex-wrap">
           <NuxtLink to="sign-in" class="font-weight-5 text-primary">
            <v-icon start icon="tabler-chevron-left" />
            {{ t('backToLogin') }}
          </NuxtLink>
        </div>
      </v-form>
    </v-card-item>
  </v-card>
</template>
