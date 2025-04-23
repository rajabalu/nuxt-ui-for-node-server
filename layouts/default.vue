<script setup>
import TopBar from "@/components/layouts/classic-mode/TopBar.vue";
import NavBar from "@/components/layouts/classic-mode/NavBar.vue";
import Footer from "@/components/layouts/classic-mode/Footer.vue";
import { useGlobal } from "@/stores/global";
import { computed } from 'vue';

const globalStore = useGlobal();
// Track sidebar state for responsive styling
const sidebarVisible = computed(() => globalStore.sideNavBar);
</script>
<template>
  <div class="layout-root">
    <!-- Header -->
    <TopBar />
    <div class="main-area">
      <!-- Navbar on the left -->
      <NavBar />
      <!-- Main content fills the rest -->
      <v-main class="app-content-area" :class="{'content-expanded': !sidebarVisible}">
        <slot />
      </v-main>
    </div>
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
.main-area {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  overflow: hidden;
  margin-top: 64px; /* Add top margin to push content below TopBar */
}
.main-area > .app-content-area {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: auto; /* Changed to auto for scrolling content */
  padding: 16px; /* Add padding to the content area */
  transition: margin-left 0.3s ease, margin-right 0.3s ease; /* Smooth transition for sidebar opening/closing */
}

/* Adjust content area margin based on navbar visibility */
@media (min-width: 960px) {
  .main-area > .app-content-area {
    margin-left: 256px; /* Default sidebar width */
  }
  
  /* When sidebar is hidden, remove the margin */
  .main-area > .app-content-area.content-expanded {
    margin-left: 0;
  }
  
  /* RTL support */
  [dir="rtl"] .main-area > .app-content-area {
    margin-left: 0;
    margin-right: 256px;
  }
  
  /* RTL support when sidebar is hidden */
  [dir="rtl"] .main-area > .app-content-area.content-expanded {
    margin-right: 0;
  }
}
</style>
