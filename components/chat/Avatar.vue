<template>
    <div class="avatar-placeholder d-flex flex-column align-center justify-center">
      <v-avatar size="180" color="primary" class="mb-4">
        <v-icon size="x-large" color="white">mdi-robot</v-icon>
      </v-avatar>
      <h2 class="text-center text-body-1 mb-3">{{ $t('avatar.title') }}</h2>
      <p class="text-center text-body-2 text-medium-emphasis px-4">
        {{ $t('avatar.description') }}
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
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 120px;
      background: linear-gradient(to top, rgba(var(--v-theme-surface-variant), 1), rgba(var(--v-theme-surface-variant), 0));
      pointer-events: none;
    }
  }
  </style>