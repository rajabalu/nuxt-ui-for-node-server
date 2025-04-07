<!-- Avatar.vue -->
<template>
  <div class="avatar-placeholder">
    <div class="avatar-circle mb-2">
      <v-icon color="white" size="36">mdi-robot</v-icon>
    </div>
    <h3 class="text-center text-body-1 mt-3 mb-1">3D Assistant Avatar</h3>
    <p class="text-center text-caption text-medium-emphasis px-5">
      Interactive 3D avatar will be displayed here. The avatar will react to your conversations.
    </p>
    
    <!-- New Strategy Button -->
    <div class="text-center mt-6">
      <v-btn
        color="primary"
        variant="elevated"
        prepend-icon="mdi-plus"
        @click="navigateToNewStrategy"
        rounded="pill"
        size="small"
      >
        New Strategy
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from '#app';

const router = useRouter();

const navigateToNewStrategy = () => {
  // Navigate to index page to start a new strategy
  router.push('/');
};
</script>

<style lang="scss" scoped>
.avatar-placeholder {
  height: 100%;
  padding: 24px;
  color: rgba(var(--v-theme-on-surface), 0.9);
  position: sticky;
  top: 0;
  
  .avatar-circle {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background-color: rgb(var(--v-theme-primary));
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
  }
  
  h3 { font-weight: 500; }
  
  p {
    font-size: 0.875rem;
    line-height: 1.5;
    opacity: 0.8;
  }
}

// Dark theme adjustments
.v-theme--dark .avatar-placeholder {
  background-color: white
}
</style>