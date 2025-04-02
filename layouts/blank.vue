<script setup>
// Import the TopBar component
import TopBar from "@/components/layouts/classic-mode/TopBar.vue";
</script>

<template>
  <v-main class="app-content-area">
    <!-- Add the TopBar component here -->
    <TopBar />
    <!-- The page content will be rendered here -->
    <slot />
  </v-main>
</template>
