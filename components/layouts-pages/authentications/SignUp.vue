<script setup>
import { useI18n } from 'vue-i18n';
import { getLocalizedPath } from '@/utils/i18n-helpers';
import { useUserPreferences } from '@/stores/userPreferences';

const { alphaValidator, emailValidator, requiredValidator, passwordValidator, confirmedValidator } =
  useValidators();
const api = useApi();
const router = useRouter();
const { t, locale } = useI18n();
const userPreferencesStore = useUserPreferences();

const refVForm = ref();
const isPasswordVisible = ref(false);
const firstName = ref("");
const lastName = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const policyCheck = ref(false);
const isLoading = ref(false);
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
</script>
<template>
  <v-card elevation="4">
    <v-card-item class="pa-6">
      <h5 class="text-h5 text-center mb-4">{{ t('auth.signUpTitle') }}</h5>
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
            v-model="firstName"
            :label="t('common.firstName')"
            :placeholder="t('auth.firstNamePlaceholder')"
            :rules="[requiredValidator, alphaValidator]"
            :error-messages="errors.firstName"
          />

          <GlobalsTextField
            v-model="lastName"
            :label="t('common.lastName')"
            :placeholder="t('auth.lastNamePlaceholder')"
            :rules="[requiredValidator, alphaValidator]"
            :error-messages="errors.lastName"
          />

        <GlobalsTextField
          v-model="email"
          :label="t('common.email')"
          type="email"
          :placeholder="t('auth.emailPlaceholder')"
          :rules="[requiredValidator, emailValidator]"
          :error-messages="errors.email"
          class="mb-3"
        />

        <GlobalsTextField
          v-model="password"
          :label="t('common.password')"
          :placeholder="t('auth.passwordPlaceholder')"
          :rules="[requiredValidator, passwordValidator]"
          type="password"
          :error-messages="errors.password"
          class="mb-3"
        />

        <GlobalsTextField
          v-model="confirmPassword"
          :label="t('common.confirmPassword')"
          :placeholder="t('auth.passwordPlaceholder')"
          :rules="[requiredValidator, confirmedValidator(confirmPassword, password)]"
          :type="isPasswordVisible ? 'text' : 'password'"
          :error-messages="errors.confirmPassword"
          :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
          @click:append-inner="isPasswordVisible = !isPasswordVisible"
          class="mb-3"
        />

        <v-checkbox
          v-model="policyCheck"
          class="mb-4"
          :rules="[requiredValidator]"
          :error-messages="errors.policyCheck"
        >
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

        <v-btn type="submit" block :loading="isLoading"> {{ t('auth.createFreeAccountBtn') }} </v-btn>
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
