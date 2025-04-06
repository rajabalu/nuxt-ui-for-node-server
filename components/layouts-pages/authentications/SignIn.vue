<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '~/composables/auth';
import { useI18n } from 'vue-i18n';
import { useValidators } from '~/composables/validators';
import { getLocalizedPath } from '@/utils/i18n-helpers';

const { requiredValidator } = useValidators();
const { t, locale } = useI18n();
const nuxtApp = useNuxtApp();

const refVForm = ref();
const isPasswordVisible = ref(false);
const email = ref("");
const password = ref("");
const rememberMe = ref(false);
const errorMessage = ref<string | null>(null);
const facebookLoading = ref(false);
const googleLoading = ref(false);
const appleLoading = ref(false);

// Get the auth composable
const { login, loginWithFacebook, loginWithGoogle, loginWithApple, loading: isLoading } = useAuth();

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

const handleFacebookLogin = async () => {
  facebookLoading.value = true;
  errorMessage.value = null;
  errors.value = {
    email: undefined,
    password: undefined,
  };

  try {
    // Use the plugin to trigger Facebook login dialog
    const fbResponse = await nuxtApp.$fbLogin();

    if (fbResponse.success) {
      // Send token to our API
      const result = await loginWithFacebook(fbResponse.accessToken);

      if (result.success) {
        // Navigate with proper locale path
        const homePath = getLocalizedPath('/', locale.value);
        navigateTo(homePath);
      } else {
        errorMessage.value = result.error?.message || result.error || t('auth.errors.facebookLoginFailed', 'Facebook login failed');
      }
    } else {
      errorMessage.value = fbResponse.error || t('auth.errors.facebookLoginCancelled', 'Facebook login was cancelled');
    }
  } catch (error) {
    console.error('Facebook login error:', error);
    errorMessage.value = t('auth.errors.facebookLoginError', 'An error occurred during Facebook login');
  } finally {
    facebookLoading.value = false;
  }
};

const handleGoogleLogin = async () => {
  googleLoading.value = true;
  errorMessage.value = null;
  errors.value = {
    email: undefined,
    password: undefined,
  };

  try {
    // Use the plugin to trigger Google login dialog
    const googleResponse = await nuxtApp.$googleLogin();

    if (googleResponse.success) {
      // Send token to our API
      const result = await loginWithGoogle(googleResponse.idToken);

      if (result.success) {
        // Navigate with proper locale path
        const homePath = getLocalizedPath('/', locale.value);
        navigateTo(homePath);
      } else {
        errorMessage.value = result.error?.message || result.error || t('auth.errors.googleLoginFailed', 'Google login failed');
      }
    } else {
      errorMessage.value = googleResponse.error || t('auth.errors.googleLoginCancelled', 'Google login was cancelled');
    }
  } catch (error) {
    console.error('Google login error:', error);
    errorMessage.value = t('auth.errors.googleLoginError', 'An error occurred during Google login');
  } finally {
    googleLoading.value = false;
  }
};

const handleAppleLogin = async () => {
  appleLoading.value = true;
  errorMessage.value = null;
  errors.value = {
    email: undefined,
    password: undefined,
  };

  try {
    // Use the plugin to trigger Apple login dialog
    const appleResponse = await nuxtApp.$appleLogin();

    if (appleResponse.success) {
      // Send token to our API
      const result = await loginWithApple(appleResponse.idToken);

      if (result.success) {
        // Navigate with proper locale path
        const homePath = getLocalizedPath('/', locale.value);
        navigateTo(homePath);
      } else {
        errorMessage.value = result.error?.message || result.error || t('auth.errors.appleLoginFailed', 'Apple login failed');
      }
    } else {
      errorMessage.value = appleResponse.error || t('auth.errors.appleLoginCancelled', 'Apple login was cancelled');
    }
  } catch (error) {
    console.error('Apple login error:', error);
    errorMessage.value = t('auth.errors.appleLoginError', 'An error occurred during Apple login');
  } finally {
    appleLoading.value = false;
  }
};
</script>
<template>
  <v-card elevation="4">
    <v-card-item class="pa-6">
      <h5 class="text-h5 text-center mb-4">{{ t('auth.signInTitle') }}</h5>
      <v-alert v-if="errorMessage && !errors.email && !errors.password" type="error" density="compact" class="mb-4"
        closable icon="tabler-alert-triangle" @click:close="errorMessage = null">
        {{ errorMessage }}
      </v-alert>

      <v-form ref="refVForm" @submit.prevent="onSubmit">
        <GlobalsTextField v-model="email" :label="t('common.email')" type="email" autofocus
          :placeholder="t('auth.emailPlaceholder')" :rules="[requiredValidator]" :error-messages="errors.email"
          :loading="isLoading" :disabled="isLoading" class="mb-3" />

        <GlobalsTextField v-model="password" :label="t('common.password')" :placeholder="t('auth.passwordPlaceholder')"
          :rules="[requiredValidator]" :type="isPasswordVisible ? 'text' : 'password'" :error-messages="errors.password"
          :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'" :loading="isLoading"
          :disabled="isLoading" @click:append-inner="isPasswordVisible = !isPasswordVisible" class="mb-3" />

        <v-checkbox v-model="rememberMe" :label="t('auth.rememberMe')" class="mb-4" />

        <v-btn type="submit" block :loading="isLoading" :disabled="isLoading" class="mb-3">
          {{ t('signIn') }}
        </v-btn>

        <!-- Social Login Buttons -->
        <p class="text-center text-body-2 text-medium-emphasis my-2">{{ t('auth.orContinueWith') }}</p>

        <!-- Facebook Login Button -->
        <v-btn block color="#4267B2" class="mb-3" :loading="facebookLoading"
          :disabled="facebookLoading || isLoading || googleLoading || appleLoading" @click="handleFacebookLogin">
          <v-icon start icon="tabler-brand-facebook" class="mr-2"></v-icon>
          {{ t('auth.continueWithFacebook', 'Continue with Facebook') }}
        </v-btn>

        <!-- Google Login Button -->
        <v-btn block variant="outlined" class="mb-3" :loading="googleLoading"
          :disabled="googleLoading || isLoading || facebookLoading || appleLoading" @click="handleGoogleLogin"
          style="border-radius: 8px;">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="20"
            class="mr-2" />
          {{ t('auth.continueWithGoogle', 'Continue with Google') }}
        </v-btn>

        <!-- Apple Login Button -->
        <v-btn block variant="outlined" class="mb-3" :loading="appleLoading"
          :disabled="appleLoading || isLoading || googleLoading || facebookLoading" @click="handleAppleLogin"
          style="border-width: 2px; border-color: #000000;">
          <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" alt="Apple" width="20"
            class="mr-2" />
          {{ t('auth.continueWithApple', 'Continue with Apple') }}
        </v-btn>

        <div class="mt-4 d-flex align-center justify-space-between ga-2 flex-wrap">
          <NuxtLink to="sign-up" class="font-weight-5 text-primary"> {{ t('auth.createAccountLink') }} </NuxtLink>
          <NuxtLink to="forget-password" class="font-weight-5"> {{ t('auth.forgotPasswordLink') }} </NuxtLink>
        </div>
      </v-form>
    </v-card-item>
  </v-card>
</template>
