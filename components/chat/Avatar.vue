<!-- Avatar.vue -->
<template>
  <div class="avatar-placeholder" ref="placeholderRef">
    <!-- 3D Avatar -->
    <div class="avatar-container mb-3" ref="avatarContainerRef">
      <ThreeAvatar :avatar-id="globalStore.selectedAvatarId" />
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
import { computed, ref, onMounted, nextTick } from 'vue'; // Added ref, onMounted, nextTick
import { useChatStore } from '~/stores/chat';
import { useGlobal } from '~/stores/global';
import ThreeAvatar from '~/components/chat/ThreeAvatar.vue';

const router = useRouter();
const chatStore = useChatStore();
const globalStore = useGlobal();

// Refs for debugging
const placeholderRef = ref(null);
const avatarContainerRef = ref(null);
const buttonContainerRef = ref(null);

onMounted(async () => {
  await nextTick(); // Wait for DOM updates
  console.log('--- Avatar.vue Debug ---');
  if (placeholderRef.value) {
    console.log('Placeholder Offset Height:', placeholderRef.value.offsetHeight);
    console.log('Placeholder Client Height:', placeholderRef.value.clientHeight);
    console.log('Placeholder Computed Style (display):', window.getComputedStyle(placeholderRef.value).display);
    console.log('Placeholder Computed Style (justify-content):', window.getComputedStyle(placeholderRef.value).justifyContent);
    console.log('Placeholder Computed Style (align-items):', window.getComputedStyle(placeholderRef.value).alignItems);
  } else {
    console.log('Placeholder ref not found.');
  }
  if (avatarContainerRef.value) {
    console.log('Avatar Container Offset Height:', avatarContainerRef.value.offsetHeight);
    console.log('Avatar Container Offset Top:', avatarContainerRef.value.offsetTop);
  } else {
    console.log('Avatar Container ref not found.');
  }
   if (buttonContainerRef.value) {
    console.log('Button Container Offset Top:', buttonContainerRef.value.offsetTop);
  } else {
    console.log('Button Container ref not found.');
  }
  console.log('------------------------');
});


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

.text-center {
  width: 100%;
  flex-shrink: 0;
  margin-top: auto;
  margin-bottom: 20px; // Slight reduction in bottom margin
}
</style>