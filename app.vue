<script setup>
import { onMounted, ref } from 'vue';
import { useNuxtApp } from '#app';
import AppInitializer from '@/components/layouts/AppInitializer.vue';
import GlobalsNotificationSystem from '@/components/globals/NotificationSystem.vue';

const showTestButton = ref(true);
const { $testNotification } = useNuxtApp();

// Function to test notifications on demand
function testNotifications() {
  console.log('Test button clicked');
  $testNotification(); // Use global method from plugin
}
</script>

<template>
  <v-app>
    <NuxtPwaAssets />
    
    <!-- Put notification system outside the main layout -->
    <GlobalsNotificationSystem />
    
    <!-- Test button fixed at bottom right corner -->
    <div class="notification-test-button">
      <v-btn 
        color="primary" 
        @click="testNotifications"
        variant="elevated"
      >
        Test Notifications
      </v-btn>
    </div>
    
    <AppInitializer>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </AppInitializer>
  </v-app>
</template>

<style>
.notification-test-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9000;
}

/* Global override to ensure notifications are visible */
#notification-system-container {
  position: fixed !important;
  z-index: 999999 !important;
  top: 16px !important;
  right: 16px !important;
}
</style>
