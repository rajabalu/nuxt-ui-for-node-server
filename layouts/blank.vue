<script setup>
// Import the TopBar component
import TopBar from "@/components/layouts/classic-mode/TopBar.vue";
import { useDisplay } from 'vuetify';
import { computed } from 'vue';

const { mobile } = useDisplay();
const isMobile = computed(() => mobile.value);
</script>

<template>
  <div class="blank-layout">
    <!-- Add the TopBar component here -->
    <TopBar />
    <!-- The page content will be rendered here -->
    <v-main class="app-content-area" :class="{'mobile-content': isMobile}">
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

/* Mobile styles */
.mobile-content {
  padding: 12px 8px !important;
}

/* Small mobile screen adjustments */
@media (max-width: 600px) {
  .blank-layout > .app-content-area {
    margin-top: 56px; /* Smaller top margin on very small screens */
    padding: 12px 8px;
  }
}
</style>
