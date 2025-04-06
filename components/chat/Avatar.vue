<template>
  <div class="avatar-placeholder d-flex flex-column align-center justify-center">
    <!-- Circular avatar with robot icon -->
    <div class="avatar-circle mb-2">
      <v-icon color="white" size="36">mdi-robot</v-icon>
    </div>
    <h3 class="text-center text-body-1 mt-3 mb-1">3D Assistant Avatar</h3>
    <p class="text-center text-caption text-medium-emphasis px-5">
      Interactive 3D avatar will be displayed here. The avatar will react to your conversations.
    </p>
  </div>
</template>

<script setup>
// Future three.js integration would go here
</script>

<style lang="scss" scoped>
.avatar-placeholder {
  height: 100%;
  padding: 24px;
  text-align: center;
  color: white;
  
  .avatar-circle {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background-color: #6366F1; // Purple color from screenshot
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  h3 {
    font-weight: normal;
    color: white;
  }
  
  p {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.4;
  }
}
</style>