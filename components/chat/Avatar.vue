<!-- Avatar.vue -->
<template>
  <div class="avatar-placeholder">
    <h3 class="text-center text-body-1 mb-3">{{ selectedAvatar.name }}</h3>
    
    <!-- 3D Avatar -->
    <div class="avatar-container mb-3">
      <ThreeAvatar :avatar-id="globalStore.selectedAvatarId" />
    </div>
    
    <div class="avatar-selector text-center mb-3">
      <v-btn-group>
        <v-btn 
          v-for="avatar in globalStore.AVAILABLE_AVATARS" 
          :key="avatar.id"
          :color="globalStore.selectedAvatarId === avatar.id ? 'primary' : ''"
          icon
          size="small"
          variant="text"
          @click="selectAvatar(avatar.id)"
        >
          <v-avatar size="24">
            <v-img :src="avatar.thumbnail" :alt="avatar.name" />
          </v-avatar>
        </v-btn>
      </v-btn-group>
    </div>
    
    <p class="text-center text-caption text-medium-emphasis px-5">
      Interactive 3D avatar reacts to system messages in your conversation.
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
import { computed } from 'vue';
import { useChatStore } from '~/stores/chat';
import { useGlobal } from '~/stores/global';
import ThreeAvatar from '~/components/chat/ThreeAvatar.vue';

const router = useRouter();
const chatStore = useChatStore();
const globalStore = useGlobal();

// Select avatar function
const selectAvatar = (id) => {
  globalStore.setAvatar(id);
};

// Get selected avatar through computed property
const selectedAvatar = computed(() => globalStore.getSelectedAvatar());

const navigateToNewStrategy = () => {
  // Navigate to index page to start a new strategy
  chatStore.clearMessages();
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
  display: flex;
  flex-direction: column;
  
  .avatar-container {
    width: 100%;
    height: 300px;
    margin: 0 auto;
    border-radius: 12px;
    overflow: hidden;
    background-color: rgba(var(--v-theme-surface-variant), 0.6);
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
  background-color: transparent;
}
</style>