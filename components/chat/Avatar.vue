<!-- Avatar.vue -->
<template>
  <div class="avatar-placeholder" ref="placeholderRef">
    <!-- 3D Avatar - Only show when avatar is enabled -->
    <div v-if="globalStore.isAvatarEnabled()" class="avatar-container mb-3" ref="avatarContainerRef">
      <ThreeAvatar ref="threeAvatarRef" :avatar-id="globalStore.selectedAvatarId" />
    </div>
    
    <!-- Show placeholder message when no avatar is selected -->
    <div v-else class="no-avatar-container">
      <v-icon size="100" color="grey-lighten-1">mdi-account-off</v-icon>
      <p class="text-body-2 text-center mt-3 text-grey">{{ $t('avatar.disabled') }}</p>
    </div>
    
    <!-- New Strategy Button -->
    <div class="text-center mt-6" ref="buttonContainerRef">
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
import { computed, ref } from 'vue';
import { useChatStore } from '~/stores/chat';
import { useGlobal } from '~/stores/global';
import ThreeAvatar from '~/components/chat/ThreeAvatar.vue';

const router = useRouter();
const chatStore = useChatStore();
const globalStore = useGlobal();

// Refs for component elements
const placeholderRef = ref(null);
const avatarContainerRef = ref(null);
const buttonContainerRef = ref(null);
const threeAvatarRef = ref(null);

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
  height: 100%; // Takes full height of parent
  padding: 12px; // Reduced padding to allow more space for avatar
  color: rgba(var(--v-theme-on-surface), 0.9);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  background-color: transparent;
  overflow: hidden;
}

.avatar-container {
  width: 100%; // Use full width
  max-width: 100%; // Remove max-width limitation
  height: 60vh; // Increased height to 60% of the viewport height
  min-height: 400px; // Ensure minimum height
  margin: 0 auto; // Center horizontally
  margin-top: 5vh; // Reduced top margin
  margin-bottom: auto;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
  flex-grow: 1; // Allow growing to fill space
}

.no-avatar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh; // Match the height of the avatar container
  min-height: 400px; // Ensure minimum height
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.text-center {
  width: 100%;
  flex-shrink: 0;
  margin-top: auto;
  margin-bottom: 20px; // Slight reduction in bottom margin
}
</style>