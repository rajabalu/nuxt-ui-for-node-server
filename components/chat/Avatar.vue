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
