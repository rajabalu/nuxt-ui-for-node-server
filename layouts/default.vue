<script setup>
import TopBar from "@/components/layouts/classic-mode/TopBar.vue";
import NavBar from "@/components/layouts/classic-mode/NavBar.vue";
import Footer from "@/components/layouts/classic-mode/Footer.vue";
</script>
<template>
  <!-- Header -->
  <TopBar />

  <!-- Navbar -->
  <NavBar />

  <v-main class="app-content-area">
    <slot />
  </v-main>

  </template>
