<template>
  <div class="notification-container">
    <v-snackbar
      v-for="notification in notifications"
      :key="notification.id"
      :value="true"
      :color="typeToColor[notification.type] || 'primary'"
      :timeout="notification.timeout"
      location="top end"
      class="mt-4"
      multi-line
      elevation="4"
    >
      <div class="d-flex align-center">
        <v-icon :icon="typeToIcon[notification.type] || notification.icon" class="mr-3"></v-icon>
        <div>
          <div v-if="notification.title" class="font-weight-bold">{{ notification.title }}</div>
          <div>{{ notification.message }}</div>
        </div>
      </div>
      
      <template v-slot:actions>
        <v-btn
          variant="text"
          icon="tabler-x"
          @click="remove(notification.id)"
        ></v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { useNotification } from '@/composables/useNotification';

const { notifications, remove } = useNotification();

// Map notification types to Vuetify colors
const typeToColor = {
  success: 'success',
  error: 'error',
  info: 'info',
  warning: 'warning'
};

// Map notification types to icons
const typeToIcon = {
  success: 'tabler-check-circle',
  error: 'tabler-alert-circle',
  info: 'tabler-info-circle',
  warning: 'tabler-alert-triangle'
};
</script>

<style lang="scss" scoped>
.notification-container {
  position: fixed;
  top: 10px;
  right: 10px;
  z-index: 9999;
  pointer-events: none;
  
  :deep(.v-snackbar) {
    pointer-events: auto;
  }
}
</style> 