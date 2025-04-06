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
  </div>
</template>

<style lang="scss" scoped>
.avatar-placeholder {
  height: 100%;
  padding: 24px;
  color: white;
  position: sticky;
  top: 0;
  
  .avatar-circle {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background-color: #6366F1;
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
</style>