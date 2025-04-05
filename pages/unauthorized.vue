<template>
  <div class="d-flex flex-column align-center justify-center" style="min-height: 80vh">
    <v-icon color="error" size="92" icon="$shieldAlert"></v-icon>
    <h1 class="text-h3 font-weight-bold mt-6">Access Denied</h1>
    <p class="text-subtitle-1 my-4 text-center">
      You don't have permission to access this page.
    </p>
    <div class="d-flex mt-4">
      <v-btn color="primary" variant="outlined" class="me-4" @click="goHome">
        Go to Home
      </v-btn>
      <v-btn color="error" variant="outlined" @click="handleLogout">
        Sign Out
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { useAuth } from '~/composables/auth';
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
import { getLocalizedPath } from '@/utils/i18n-helpers';
import { useRouter } from 'vue-router';

const { logout } = useAuth();
const { locale } = useI18n();
const router = useRouter();

// Simple home path - will be localized during navigation
const homePath = '/';

const goHome = () => {
  const localizedPath = getLocalizedPath(homePath, locale.value);
  router.push(localizedPath);
};

const handleLogout = async () => {
  await logout();
  // Redirect handled by the auth store
};
</script> 