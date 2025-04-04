<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '~/composables/auth';
import { useI18n } from 'vue-i18n';
import { useValidators } from '~/composables/validators';
import { getLocalizedPath } from '@/utils/i18n-helpers';

const { requiredValidator } = useValidators();
const { t, locale } = useI18n();

const refVForm = ref();
const isPasswordVisible = ref(false);
const email = ref("");
const password = ref("");
const rememberMe = ref(false);
const errorMessage = ref<string | null>(null);

// Get the auth composable
const { login, loading: isLoading } = useAuth();

const errors = ref<{ email: string | undefined; password: string | undefined }>({
  email: undefined,
  password: undefined,
});

const onSubmit = async () => {
  const { valid: isValid } = await refVForm.value?.validate();
  
  if (isValid) {
    // Clear any previous error messages
    errorMessage.value = null;
    errors.value = {
      email: undefined,
      password: undefined,
    };

    // Attempt login
    const result = await login(email.value, password.value);
    
    if (result.success) {
      // Navigate with proper locale path
      const homePath = getLocalizedPath('/', locale.value);
      navigateTo(homePath);
    } else {
      // Handle specific errors based on the API response
      errorMessage.value = result.error?.message || result.error || t('auth.errors.loginFailedGeneric', 'Login failed. Please check your credentials.');
      
      // Handle field-specific errors if available
      if (result.status === 422 && result.error && typeof result.error === 'object' && 'errors' in result.error && result.error.errors) {
        const apiErrors = result.error.errors as Record<string, string>;
        
        if (apiErrors.email === 'notFound') {
          errors.value.email = t('auth.errors.emailNotFound');
        } else if (apiErrors.email?.startsWith('needLoginViaProvider:')) {
          const provider = apiErrors.email.split(':')[1];
          errors.value.email = t('auth.errors.loginViaProvider', { provider });
        } else if (apiErrors.password === 'incorrectPassword') {
          errors.value.password = t('auth.errors.incorrectPassword');
        }
      } else if (!result.error) {
        errorMessage.value = t('auth.errors.loginFailedGeneric', 'Login failed. Please check your credentials.');
      }
    }
  }
};
</script>
<template>
  <v-card elevation="4">
    <v-card-item class="pa-6">
      <h5 class="text-h5 text-center mb-4">{{ t('auth.signInTitle') }}</h5>
      <v-alert
        v-if="errorMessage && !errors.email && !errors.password"
        type="error"
        density="compact"
        class="mb-4"
        closable
        icon="tabler-alert-triangle"
        @click:close="errorMessage = null"
      >
        {{ errorMessage }}
      </v-alert>

      <v-form ref="refVForm" @submit.prevent="onSubmit">
        <GlobalsTextField
          v-model="email"
          :label="t('common.email')"
          type="email"
          autofocus
          :placeholder="t('auth.emailPlaceholder')"
          :rules="[requiredValidator]"
          :error-messages="errors.email"
          :loading="isLoading"
          :disabled="isLoading"
          class="mb-3"
        />

        <GlobalsTextField
          v-model="password"
          :label="t('common.password')"
          :placeholder="t('auth.passwordPlaceholder')"
          :rules="[requiredValidator]"
          :type="isPasswordVisible ? 'text' : 'password'"
          :error-messages="errors.password"
          :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
          :loading="isLoading"
          :disabled="isLoading"
          @click:append-inner="isPasswordVisible = !isPasswordVisible"
          class="mb-3"
        />

        <v-checkbox v-model="rememberMe" :label="t('auth.rememberMe')" class="mb-4" />

        <v-btn type="submit" block :loading="isLoading" :disabled="isLoading"> {{ t('signIn') }} </v-btn>
        <div class="mt-4 d-flex align-center justify-space-between ga-2 flex-wrap">
          <NuxtLink to="sign-up" class="font-weight-5 text-primary"> {{ t('auth.createAccountLink') }} </NuxtLink>
          <NuxtLink to="forget-password" class="font-weight-5"> {{ t('auth.forgotPasswordLink') }} </NuxtLink>
        </div>
      </v-form>
    </v-card-item>
  </v-card>
</template>
