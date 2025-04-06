<!-- index.vue -->
<template>
  <v-container fluid class="pa-0 fill-height d-flex flex-column">
    <v-row no-gutters class="flex-grow-1" style="min-height: 0">
      <!-- Fixed Avatar Column -->
      <v-col cols="12" md="4" lg="3" class="avatar-container d-none d-md-block bg-surface">
        <AvatarPlaceholder />
      </v-col>

      <!-- Scrollable Chat Column -->
      <v-col cols="12" md="8" lg="9" class="chat-container d-flex flex-column">
        <ChatInterface />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import AvatarPlaceholder from '~/components/chat/Avatar.vue';
import ChatInterface from '~/components/chat/ChatInterface.vue';

definePageMeta({
  layout: 'default',
});

useHead({ title: 'Welcome!' });
</script>

<style lang="scss" scoped>
.avatar-container {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  z-index: 2;
}

.chat-container {
  height: 100vh;
  overflow-y: auto;
  
  // Compensate for layout headers
  .v-row {
    margin-top: -128px; // Adjust based on header height
    padding-top: 128px;
  }
}

.v-container {
  position: relative;
  overflow: visible;
}

@media (max-width: 959px) {
  .avatar-container {
    display: none !important;
  }
  
  .chat-container {
    height: calc(100vh - 96px); // Adjust for mobile header
  }
}

</style>