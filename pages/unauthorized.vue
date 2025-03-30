<template>
  <div class="d-flex flex-column align-center justify-center" style="min-height: 80vh">
    <v-icon color="error" size="92" icon="$shieldAlert"></v-icon>
    <h1 class="text-h3 font-weight-bold mt-6">Access Denied</h1>
    <p class="text-subtitle-1 my-4 text-center">
      You don't have permission to access this page.
    </p>
    <div class="d-flex mt-4">
      <v-btn color="primary" variant="outlined" class="me-4" to="/">
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

const { logout } = useAuth();

const handleLogout = async () => {
  await logout();
  // Redirect handled by the auth store
};
</script> 