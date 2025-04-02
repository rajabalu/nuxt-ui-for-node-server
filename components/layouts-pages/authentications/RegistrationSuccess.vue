<script setup>
import { useI18n } from 'vue-i18n'; // Import useI18n
const { t } = useI18n(); // Initialize i18n
// Registration Success component
</script>

<template>
  <v-card elevation="4">
    <v-card-item class="pa-6">
      <div class="mb-6 text-center">
        <NuxtLink to="/" class="d-flex justify-center mb-4">
          <img src="/images/brand/logo/logo-light.svg" height="60px" />
        </NuxtLink>
        <v-icon class="mb-4" color="success" icon="tabler-circle-check-filled" size="80"></v-icon>
        <h1 class="text-h4 mb-2">{{ t('auth.registrationSuccess.title') }}</h1>
        <p class="text-body-1 mb-4">
          {{ t('auth.registrationSuccess.message') }}
        </p>
      </div>

      <v-card class="mb-6 pa-4 bg-surface rounded" flat>
        <h2 class="text-h6 mb-2">{{ t('auth.registrationSuccess.nextStepsTitle') }}</h2>
        <ol class="text-body-1 ml-4 mb-4">
          <li class="mb-2">{{ t('auth.registrationSuccess.step1') }}</li>
          <li class="mb-2">{{ t('auth.registrationSuccess.step2') }}</li>
          <li class="mb-2">{{ t('auth.registrationSuccess.step3') }}</li>
          <li>{{ t('auth.registrationSuccess.step4') }}</li>
        </ol>
      </v-card>

      <div class="d-flex flex-column align-center">
        <v-btn to="/sign-in" color="primary" class="mb-4" block>
          {{ t('auth.registrationSuccess.loginBtn') }}
        </v-btn>
        <NuxtLink to="/forget-password" class="text-body-1">
          {{ t('auth.forgotPasswordLink') }}
        </NuxtLink>
      </div>
    </v-card-item>
  </v-card>
</template> 