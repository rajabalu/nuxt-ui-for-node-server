<template>
  <v-container fluid class="pa-0 fill-height d-flex flex-column">
    <v-row no-gutters class="flex-grow-1" style="min-height: 0">
      <!-- Left column: Avatar area (30%) -->
      <v-col cols="12" md="4" lg="3" class="avatar-container d-none d-md-block">
        <AvatarPlaceholder />
      </v-col>

      <!-- Right column: Chat area (70% or 100% on mobile) -->
      <v-col cols="12" md="8" lg="9" class="chat-container d-flex flex-column">
        <ChatInterface />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import AvatarPlaceholder from '~/components/chat/Avatar.vue';
import ChatInterface from '~/components/chat/ChatInterface.vue';

// Page metadata
definePageMeta({
  layout: 'default',
});

// Page title
useHead({
  title: 'Welcome!'
});
</script>

<style lang="scss" scoped>
.avatar-container {
  border-right: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background-color: #424242; // Darker background matching screenshot
  overflow: hidden;
  position: relative;
}

.chat-container {
  overflow: hidden;
  background-color: rgb(var(--v-theme-surface));
}

:deep(.v-container) {
  max-width: 100%;
}
</style>