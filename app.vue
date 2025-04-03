<script setup>
import AppInitializer from '@/components/layouts/AppInitializer.vue';
</script>

<template>
  <v-app>
    <NuxtPwaAssets />
    <AppInitializer>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </AppInitializer>
  </v-app>
</template>
