<template>
  <v-container fluid class="pa-0 fill-height d-flex flex-column">
    <v-row no-gutters class="flex-grow-1" style="min-height: 0">
      <!-- Fixed Avatar Column - Only shown when avatar is enabled -->
      <v-col v-if="globalStore.isAvatarEnabled()" cols="12" md="4" lg="3" class="avatar-container d-none d-md-block">
        <AvatarPlaceholder />
      </v-col>

      <!-- Scrollable Chat Column - Takes full width when no avatar is shown -->
      <v-col cols="12" :md="globalStore.isAvatarEnabled() ? 8 : 12" :lg="globalStore.isAvatarEnabled() ? 9 : 12" class="chat-container d-flex flex-column">
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
import { useGlobal } from '~/stores/global';

const globalStore = useGlobal();
const route = useRoute();
const conversationId = computed(() => route.params.id);

definePageMeta({
  layout: 'default',
});

useHead({ title: 'Strategy Details' });
</script>

<style lang="scss" scoped>
.avatar-container {
  position: relative; /* Changed from sticky to ensure proper flow */
  height: calc(100vh - 64px); /* Account for header */
  border-right: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background-color: rgb(var(--v-theme-surface));
  overflow-y: auto;
  z-index: 2;
  display: flex;
  flex-direction: column;
}

.chat-container {
  height: calc(100vh - 64px); /* Account for header */
  overflow: hidden;
  position: relative;
  background-color: rgb(var(--v-theme-background));

  > div {
    height: 100%;
  }
}

.v-container {
  overflow: hidden;
  
  .v-row {
    height: 100%;
    min-height: 0;
    flex-direction: row !important; /* Force row direction */
    display: flex !important;
  }
}

@media (max-width: 959px) {
  .avatar-container {
    display: none !important;
  }
  
  .chat-container {
    height: calc(100vh - 56px); /* Adjust for mobile header */
    border-left: none;
  }
}
</style>