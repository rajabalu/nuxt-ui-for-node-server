<template>
  <v-container fluid class="pa-0 fill-height d-flex flex-column">
    <v-row no-gutters class="flex-grow-1" style="min-height: 0">
      <!-- Fixed Avatar Column -->
      <v-col cols="12" md="4" lg="3" class="avatar-container d-none d-md-block">
        <AvatarPlaceholder />
      </v-col>

      <!-- Scrollable Chat Column -->
      <v-col cols="12" md="8" lg="9" class="chat-container d-flex flex-column">
        <ChatInterface :conversation-id="conversationId" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed } from 'vue';
import AvatarPlaceholder from '~/components/chat/Avatar.vue';
import ChatInterface from '~/components/chat/ChatInterface.vue';
import { useRoute } from 'vue-router';

definePageMeta({
  layout: 'default',
});

const route = useRoute();
const conversationId = computed(() => route.params.id);

useHead({ title: 'Strategy Details' });
</script>

<style lang="scss" scoped>
.avatar-container {
  position: sticky;
  top: 0;
  height: calc(100vh - 64px); // Account for header
  border-right: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background-color: rgb(var(--v-theme-surface));
  overflow-y: auto; // Keep this if content within might exceed height
  overflow-x: hidden; // Prevent horizontal overflow
  z-index: 2;
  display: flex;
  flex-direction: column;
  width: 300px; // Example fixed width
  max-width: 300px; // Ensure it doesn't exceed this
  min-width: 300px; // Ensure it doesn't shrink below this
  flex-basis: 300px !important; // Force the basis width in flex context
  flex-grow: 0 !important; // Prevent growing
  flex-shrink: 0 !important; // Prevent shrinking
}

.chat-container {
  height: calc(100vh - 64px); // Account for header
  overflow: hidden;
  position: relative;
  background-color: rgb(var(--v-theme-background));
  flex-grow: 1;
  flex-shrink: 1;
  min-width: 0; // Allow shrinking below content size

  > div {
    height: 100%;
  }
}

.v-container {
  overflow: hidden;
  
  .v-row {
    height: 100%;
    min-height: 0;
  }
}

@media (max-width: 959px) {
  .avatar-container {
    display: none !important;
    width: auto;
    max-width: none;
    min-width: auto;
    flex-basis: auto !important;
    flex-grow: 1 !important;
    flex-shrink: 1 !important;
  }
  
  .chat-container {
    height: calc(100vh - 56px); // Adjust for mobile header
    border-left: none;
  }
}
</style>