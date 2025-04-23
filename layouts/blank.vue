<script setup>
// Import the TopBar component
import TopBar from "@/components/layouts/classic-mode/TopBar.vue";
</script>

<template>
  <div class="blank-layout">
    <!-- Add the TopBar component here -->
    <TopBar />
    <!-- The page content will be rendered here -->
    <v-main class="app-content-area">
      <slot />
    </v-main>
  </div>
</template>

<style>
.blank-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.blank-layout > .app-content-area {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 16px;
  margin-top: 64px; /* Same as in default layout to push content below TopBar */
}
</style>
