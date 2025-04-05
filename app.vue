<script setup>
import AppInitializer from '@/components/layouts/AppInitializer.vue';
import GlobalsNotificationSystem from '@/components/globals/NotificationSystem.vue';
</script>

<template>
  <v-app>
    <NuxtPwaAssets />
    <GlobalsNotificationSystem />
    <AppInitializer>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </AppInitializer>
  </v-app>
</template>
