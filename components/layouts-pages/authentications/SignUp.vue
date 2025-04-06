<script setup>
import { useI18n } from 'vue-i18n';
import { getLocalizedPath } from '@/utils/i18n-helpers';
import { useUserPreferences } from '@/stores/userPreferences';
import { useAuth } from '~/composables/auth';

const { alphaValidator, emailValidator, requiredValidator, passwordValidator, confirmedValidator } =
  useValidators();
const api = useApi();
const router = useRouter();
const { t, locale } = useI18n();
const userPreferencesStore = useUserPreferences();
const nuxtApp = useNuxtApp();
const { loginWithFacebook, loginWithGoogle, loginWithApple } = useAuth();

const refVForm = ref();
const isPasswordVisible = ref(false);
const firstName = ref("");
const lastName = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const policyCheck = ref(false);
const isLoading = ref(false);
const facebookLoading = ref(false);
const googleLoading = ref(false);
const appleLoading = ref(false);
const showAlert = ref(false);
const alertType = ref("success");
const alertMessage = ref("");

const errors = ref({
  firstName: undefined,
  lastName: undefined,
  email: undefined,
  password: undefined,
  confirmPassword: undefined,
  policyCheck: undefined,
});

const showNotification = (type, message) => {
  alertType.value = type;
  alertMessage.value = message;
  showAlert.value = true;
};

const onSubmit = async () => {
  const { valid: isValid } = await refVForm.value?.validate();
  
  if (isValid) {
    try {
      isLoading.value = true;
      
      // Get the current theme and language from user preferences
      const currentTheme = userPreferencesStore.theme || 'light';
      const currentLanguage = locale.value || 'en';
      
      const response = await api.post('auth/email/register', {
        firstName: firstName.value,
        lastName: lastName.value,
        email: email.value,
        password: password.value,
        // Include theme and language preferences
        theme: currentTheme,
        language: currentLanguage
      });
      
      if (response.success) {
        // Navigate with locale path
        const successPath = getLocalizedPath('/registration-success', locale.value);
        
        router.push(successPath);
      } else {
        showNotification('error', response.error || t('auth.errors.registrationFailed'));
      }
    } catch (error) {
      showNotification('error', t('auth.errors.registrationFailedGeneric'));
      console.error(error);
    } finally {
      isLoading.value = false;
    }
  }
};

const handleFacebookLogin = async () => {
  facebookLoading.value = true;
  showAlert.value = false;
  
  try {
    // Use the plugin to trigger Facebook login dialog
    const fbResponse = await nuxtApp.$fbLogin();
    
    if (fbResponse.success) {
      // Send token to our API
      const result = await loginWithFacebook(fbResponse.accessToken);
      
      if (result.success) {
        // Navigate with proper locale path
        const homePath = getLocalizedPath('/', locale.value);
        router.push(homePath);
      } else {
        showNotification('error', result.error?.message || result.error || t('auth.errors.facebookLoginFailed', 'Facebook login failed'));
      }
    } else {
      showNotification('error', fbResponse.error || t('auth.errors.facebookLoginCancelled', 'Facebook login was cancelled'));
    }
  } catch (error) {
    console.error('Facebook login error:', error);
    showNotification('error', t('auth.errors.facebookLoginError', 'An error occurred during Facebook login'));
  } finally {
    facebookLoading.value = false;
  }
};

const handleGoogleLogin = async () => {
  googleLoading.value = true;
  showAlert.value = false;
  
  try {
    // Use the plugin to trigger Google login dialog
    const googleResponse = await nuxtApp.$googleLogin();
    
    if (googleResponse.success) {
      // Send token to our API
      const result = await loginWithGoogle(googleResponse.idToken);
      
      if (result.success) {
        // Navigate with proper locale path
        const homePath = getLocalizedPath('/', locale.value);
        router.push(homePath);
      } else {
        showNotification('error', result.error?.message || result.error || t('auth.errors.googleLoginFailed', 'Google login failed'));
      }
    } else {
      showNotification('error', googleResponse.error || t('auth.errors.googleLoginCancelled', 'Google login was cancelled'));
    }
  } catch (error) {
    console.error('Google login error:', error);
    showNotification('error', t('auth.errors.googleLoginError', 'An error occurred during Google login'));
  } finally {
    googleLoading.value = false;
  }
};

const handleAppleLogin = async () => {
  appleLoading.value = true;
  showAlert.value = false;
  
  try {
    // Use the plugin to trigger Apple login dialog
    const appleResponse = await nuxtApp.$appleLogin();
    
    if (appleResponse.success) {
      // Send token to our API
      const result = await loginWithApple(appleResponse.idToken);
      
      if (result.success) {
        // Navigate with proper locale path
        const homePath = getLocalizedPath('/', locale.value);
        router.push(homePath);
      } else {
        showNotification('error', result.error?.message || result.error || t('auth.errors.appleLoginFailed', 'Apple login failed'));
      }
    } else {
      showNotification('error', appleResponse.error || t('auth.errors.appleLoginCancelled', 'Apple login was cancelled'));
    }
  } catch (error) {
    console.error('Apple login error:', error);
    showNotification('error', t('auth.errors.appleLoginError', 'An error occurred during Apple login'));
  } finally {
    appleLoading.value = false;
  }
};
</script>
<template>
  <v-card elevation="4">
    <v-card-item class="pa-6">
      <h5 class="text-h5 text-center mb-4">{{ t('auth.signUpTitle') }}</h5>
      <v-alert v-if="showAlert" :type="alertType" closable @click:close="showAlert = false" class="mb-4"
        :icon="alertType === 'error' ? 'tabler-alert-triangle' : 'tabler-circle-check'">
        {{ alertMessage }}
      </v-alert>

      <v-form ref="refVForm" @submit.prevent="onSubmit">
        <GlobalsTextField v-model="firstName" :label="t('common.firstName')"
          :placeholder="t('auth.firstNamePlaceholder')" :rules="[requiredValidator, alphaValidator]"
          :error-messages="errors.firstName" />

        <GlobalsTextField v-model="lastName" :label="t('common.lastName')" :placeholder="t('auth.lastNamePlaceholder')"
          :rules="[requiredValidator, alphaValidator]" :error-messages="errors.lastName" />

        <GlobalsTextField v-model="email" :label="t('common.email')" type="email"
          :placeholder="t('auth.emailPlaceholder')" :rules="[requiredValidator, emailValidator]"
          :error-messages="errors.email" class="mb-3" />

        <GlobalsTextField v-model="password" :label="t('common.password')" :placeholder="t('auth.passwordPlaceholder')"
          :rules="[requiredValidator, passwordValidator]" type="password" :error-messages="errors.password"
          class="mb-3" />

        <GlobalsTextField v-model="confirmPassword" :label="t('common.confirmPassword')"
          :placeholder="t('auth.passwordPlaceholder')"
          :rules="[requiredValidator, confirmedValidator(confirmPassword, password)]"
          :type="isPasswordVisible ? 'text' : 'password'" :error-messages="errors.confirmPassword"
          :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
          @click:append-inner="isPasswordVisible = !isPasswordVisible" class="mb-3" />

        <v-checkbox v-model="policyCheck" class="mb-4" :rules="[requiredValidator]"
          :error-messages="errors.policyCheck">
          <template #label>
            <p class="text-body-1">
              {{ t('auth.agreeTo') }}
              <NuxtLink :to="getLocalizedPath('/', locale.value)" class="mx-1 font-weight-5 text-primary">
                {{ t('common.termsOfService') }}
              </NuxtLink>
              {{ t('common.and') }}
              <NuxtLink :to="getLocalizedPath('/', locale.value)" class="ml-1 font-weight-5 text-primary">
                {{ t('common.privacyPolicy') }}
              </NuxtLink>.
            </p>
          </template>
        </v-checkbox>

        <v-btn type="submit" block :loading="isLoading" class="mb-3">
          {{ t('auth.createFreeAccountBtn') }}
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
          <NuxtLink :to="getLocalizedPath('/sign-in', locale.value)" class="font-weight-5 text-primary">
            {{ t('auth.alreadyMember') }}
          </NuxtLink>
          <NuxtLink :to="getLocalizedPath('/forget-password', locale.value)" class="font-weight-5">
            {{ t('auth.forgotPasswordLink') }}
          </NuxtLink>
        </div>
      </v-form>
    </v-card-item>
  </v-card>
</template>
