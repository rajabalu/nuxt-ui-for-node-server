<script setup>
import { useI18n } from 'vue-i18n';
import { ref, reactive } from 'vue';
const { t } = useI18n();
const { requiredValidator, passwordValidator, confirmedValidator } = useValidators();
const api = useApi();
const router = useRouter();

// Props to receive the reset hash
const props = defineProps({
  hash: {
    type: String,
    required: true
  }
});

const refPasswordVForm = ref();
const isSubmitting = ref(false);
const showAlert = ref(false);
const alertType = ref("success");
const alertMessage = ref("");
const passwordResetSuccess = ref(false);

const passwordForm = reactive({
  newPassword: "",
  confirmPassword: "",
});

const errors = ref({
  newPassword: undefined,
  confirmPassword: undefined,
});

// Show notification for success or error
const showNotification = (type, message) => {
  alertType.value = type;
  alertMessage.value = message;
  showAlert.value = true;
};

const onSubmit = async () => {
  const { valid: isValid } = await refPasswordVForm.value?.validate();
  
  if (isValid) {
    try {
      isSubmitting.value = true;
      
      // Reset any previous errors
      errors.value = {
        newPassword: undefined,
        confirmPassword: undefined
      };
      
      // Call the reset password API endpoint
      const response = await api.post('auth/reset/password', {
        password: passwordForm.newPassword,
        hash: props.hash
      });
      
      if (response.success) {
        // Show success message and clear fields
        showNotification('success', t('passwordResetSuccessful', 'Your password has been reset successfully. You can now login with your new password.'));
        passwordForm.newPassword = "";
        passwordForm.confirmPassword = "";
        refPasswordVForm.value?.reset();
        passwordResetSuccess.value = true;
        
        // Clear the stored hash
        sessionStorage.removeItem('password_reset_hash');
        sessionStorage.removeItem('password_reset_expires');
      } else {
        // Show error from API
        showNotification('error', response.error || t('passwordResetFailed', 'Password reset failed. Please try again or request a new reset link.'));
        
        // Handle validation errors if returned
        if (response.status === 422 && response.error?.errors) {
          const apiErrors = response.error.errors;
          
          if (apiErrors.password) {
            errors.value.newPassword = apiErrors.password;
          }
          
          if (apiErrors.hash) {
            showNotification('error', t('invalidResetLink', 'Invalid or expired reset link. Please request a new one.'));
          }
        }
      }
    } catch (error) {
      console.error('Password reset error:', error);
      showNotification('error', t('passwordResetError', 'An error occurred while processing your request. Please try again later.'));
    } finally {
      isSubmitting.value = false;
    }
  }
};

const navigateToLogin = () => {
  router.push('/sign-in');
};
</script>

<template>
  <v-card elevation="4">
    <v-card-item class="pa-6">
      <div class="mb-6 text-center">
        <h1 class="text-h4 mb-2">{{ t('resetYourPassword', 'Reset Your Password') }}</h1>
        <p class="text-body-1 mb-6" v-if="!passwordResetSuccess">
          {{ t('createNewPassword', 'Create a new secure password for your account.') }}
        </p>
      </div>
      
      <!-- Alert to show success or error messages -->
      <v-alert 
        v-if="showAlert" 
        :type="alertType" 
        closable 
        @click:close="showAlert = false" 
        class="mb-4"
      >
        {{ alertMessage }}
      </v-alert>

      <!-- Success View -->
      <div v-if="passwordResetSuccess" class="text-center">
        <v-icon class="mb-4" color="success" icon="tabler-circle-check-filled" size="80"></v-icon>
        <h2 class="text-h5 mb-4">{{ t('passwordResetComplete', 'Password Reset Complete') }}</h2>
        <v-btn color="primary" block @click="navigateToLogin">
          {{ t('signIn', 'Login to Your Account') }}
        </v-btn>
      </div>
      
      <!-- Reset Password Form -->
      <v-form v-else ref="refPasswordVForm" @submit.prevent="onSubmit">
        <v-row no-gutters class="pb-3">
          <v-col cols="12">
            <GlobalsTextField
              v-model="passwordForm.newPassword"
              :label="t('newPassword', 'New Password')"
              :rules="[requiredValidator, passwordValidator]"
              :error-messages="errors.newPassword"
              placeholder="Enter new password"
              type="password"
              :loading="isSubmitting"
              :disabled="isSubmitting"
              class="mb-3"
            />
          </v-col>
        </v-row>
        
        <v-row no-gutters class="pb-3">
          <v-col cols="12">
            <GlobalsTextField
              v-model="passwordForm.confirmPassword"
              :label="t('confirmPassword', 'Confirm Password')"
              :rules="[
                requiredValidator,
                confirmedValidator(passwordForm.confirmPassword, passwordForm.newPassword),
              ]"
              :error-messages="errors.confirmPassword"
              placeholder="Confirm new password"
              type="password"
              :loading="isSubmitting"
              :disabled="isSubmitting"
              class="mb-3"
            />

            <div class="mt-4">
              <p class="text-body-2 font-weight-8">{{ t('passwordRequirements', 'Password requirements:') }}</p>
              <p class="text-body-1 mb-4">{{ t('requirementsMustBeMet', 'Ensure that these requirements are met:') }}</p>
              <ul>
                <li class="text-body-2 py-0">{{ t('minimumLength', 'Minimum 8 characters long - the more, the better') }}</li>
                <li class="text-body-2 py-0">{{ t('lowercase', 'At least one lowercase character') }}</li>
                <li class="text-body-2 py-0">{{ t('uppercase', 'At least one uppercase character') }}</li>
                <li class="text-body-2 py-0">{{ t('special', 'At least one number, symbol, or whitespace character') }}</li>
              </ul>
            </div>
          </v-col>
        </v-row>
        
        <v-btn type="submit" block :loading="isSubmitting" :disabled="isSubmitting" color="primary">
          {{ t('resetPassword', 'Reset Password') }}
        </v-btn>
        
        <div class="mt-4 text-center">
          <NuxtLink to="/sign-in" class="font-weight-5 text-primary">
            {{ t('backToLogin', 'Back to Login') }}
          </NuxtLink>
        </div>
      </v-form>
    </v-card-item>
  </v-card>
</template> 