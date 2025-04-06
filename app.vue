<script setup>
import AppInitializer from '@/components/layouts/AppInitializer.vue';
import GlobalsNotificationSystem from '@/components/globals/NotificationSystem.vue';
</script>

<template>
  <v-app>
    <NuxtPwaAssets />
    
    <!-- Notification system rendered at the document root -->
    <GlobalsNotificationSystem />
    
    <AppInitializer>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </AppInitializer>
  </v-app>
</template>

<style>
/* Global override to ensure notifications are visible */
#notification-system-container {
  position: fixed !important;
  z-index: 999999 !important;
  top: 16px !important;
  right: 16px !important;
}
</style>
