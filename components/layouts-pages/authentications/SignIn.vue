<script setup>
import { ref } from 'vue';
import { useAuth } from '~/composables/auth';
const { requiredValidator } = useValidators();

const refVForm = ref();
const isPasswordVisible = ref(false);
const email = ref("");
const password = ref("");
const rememberMe = ref(false);
const errorMessage = ref(null);

// Get the auth composable
const { login, loading: isLoading } = useAuth();

const errors = ref({
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
      // Redirect to dashboard instead of the root path
      navigateTo('/dashboards/analytics');
    } else {
      // Handle specific errors based on the API response
      errorMessage.value = result.error;
      
      // Handle field-specific errors if available
      if (result.status === 422 && result.error?.errors) {
        const apiErrors = result.error.errors;
        
        if (apiErrors.email === 'notFound') {
          errors.value.email = 'Email not found';
        } else if (apiErrors.email?.startsWith('needLoginViaProvider:')) {
          const provider = apiErrors.email.split(':')[1];
          errors.value.email = `Please login using ${provider}`;
        } else if (apiErrors.password === 'incorrectPassword') {
          errors.value.password = 'Incorrect password';
        }
      }
    }
  }
};
</script>
<template>
  <v-card elevation="4">
    <v-card-item class="pa-6">
      <div class="mb-6">
        <NuxtLink to="/" class="d-flex mb-2">
          <img src="/images/brand/logo/logo-light.svg" height="60px" />
        </NuxtLink>
        <p class="text-body-1">Please enter your user information.</p>
      </div>

      <v-alert
        v-if="errorMessage"
        type="error"
        density="compact"
        class="mb-4"
        closable
        @click:close="errorMessage = null"
      >
        {{ errorMessage }}
      </v-alert>

      <v-form ref="refVForm" @submit.prevent="onSubmit">
        <GlobalsTextField
          v-model="email"
          label="Email"
          type="email"
          autofocus
          placeholder="Email address here"
          :rules="[requiredValidator]"
          :error-messages="errors.email"
          :loading="isLoading"
          :disabled="isLoading"
          class="mb-3"
        />

        <GlobalsTextField
          v-model="password"
          label=" Password"
          placeholder="************"
          :rules="[requiredValidator]"
          :type="isPasswordVisible ? 'text' : 'password'"
          :error-messages="errors.password"
          :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
          :loading="isLoading"
          :disabled="isLoading"
          @click:append-inner="isPasswordVisible = !isPasswordVisible"
          class="mb-3"
        />

        <v-checkbox v-model="rememberMe" label="Remember me" class="mb-4" />

        <v-btn type="submit" block :loading="isLoading" :disabled="isLoading"> Sign in </v-btn>
        <div class="mt-4 d-flex align-center justify-space-between ga-2 flex-wrap">
          <NuxtLink to="sign-up" class="font-weight-5 text-primary"> Create An Account </NuxtLink>
          <NuxtLink to="forget-password" class="font-weight-5"> Forgot your password? </NuxtLink>
        </div>
      </v-form>
    </v-card-item>
  </v-card>
</template>
