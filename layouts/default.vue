<script setup>
import TopBar from "@/components/layouts/classic-mode/TopBar.vue";
import NavBar from "@/components/layouts/classic-mode/NavBar.vue";
import Footer from "@/components/layouts/classic-mode/Footer.vue";
</script>
<template>
  <div class="layout-root">
    <!-- Header -->
    <TopBar />

    <!-- Navbar -->
    <NavBar />

    <v-main class="app-content-area">
      <slot />
    </v-main>
  </div>
</template>

<style>
.layout-root {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}
.app-content-area {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
}
</style>
