<script setup>
import Notification from "@/components/layouts/Notification.vue";
import UserProfile from "@/components/layouts/UserProfile.vue";
import { useGlobal } from "@/stores/global";
import { useI18n } from "vue-i18n";
import { useAuthStore } from '@/stores/auth';
import { themeConfig } from '@/composables/theme';
import { watch, computed, onMounted, ref } from 'vue';
import { useNuxtApp, useRoute, useRouter, useHead } from '#app';
import { useUserPreferencesHelper } from '@/composables/useUserPreferencesHelper';
import { useUserPreferences } from '@/stores/userPreferences';
import { getLocalizedPath } from '@/utils/i18n-helpers';
import { useChatStore } from '@/stores/chat';

const theme = themeConfig();
const { themeHeaderHeight, themeSidebarWidth, smallDisplay, themeChangeMode } = theme;
const themeName = computed(() => theme.themeName.value);
const nuxtApp = useNuxtApp();
const route = useRoute();
const router = useRouter();
const chatStore = useChatStore();

const globalStore = useGlobal();
const { locale, t } = useI18n();
const authStore = useAuthStore();
const userPreferencesStore = useUserPreferences();

// Debug computed properties
const currentLocale = computed(() => locale.value);
const homePath = computed(() => getLocalizedPath('/', locale.value));

// For conversation tracking
const currentConversationTitle = ref('');

// Page title handling
const pageTitle = computed(() => {
  // Check if viewing a strategy/conversation
  if (route.path.includes('/strategies/')) {
    const conversationId = route.params.id;
    
    // If we have a stored title for the current conversation, use it
    if (currentConversationTitle.value) {
      return currentConversationTitle.value;
    }
    
    // Otherwise try to find it in the chat store
    if (chatStore.conversations) {
      const conversation = chatStore.conversations.find(c => c.id === conversationId);
      if (conversation && conversation.title) {
        currentConversationTitle.value = conversation.title;
        return conversation.title;
      }
    }
    
    // Fallback to generic title
    return t('strategies.viewing', 'Viewing Conversation');
  }
  
  // Get route name or path
  const routeName = route.name?.toString() || '';
  const routePath = route.path;
  
  // Extract title from route name or path
  let title = '';
  
  if (routeName === 'index') {
    title = t('common.welcome', 'Welcome!');
  } else if (routePath.includes('/users')) {
    if (routePath.includes('/edit')) {
      title = t('users.edit', 'Edit User');
    } else if (routePath.includes('/create')) {
      title = t('users.create', 'Create User');
    } else {
      title = t('users.title', 'Users');
    }
  } else if (routePath.includes('/strategies')) {
    title = t('strategies.title', 'Conversations');
  } else {
    // Get the last segment of the path as a fallback
    const segments = routePath.split('/').filter(Boolean);
    if (segments.length > 0) {
      const lastSegment = segments[segments.length - 1];
      // Convert to title case and translate if possible
      title = t(`routes.${lastSegment}`, lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' '));
    } else {
      title = t('common.welcome', 'Welcome!');
    }
  }
  
  return title;
});

// Watch for route changes to update conversation title when needed
watch(() => route.params.id, async (newId) => {
  if (newId && route.path.includes('/strategies/')) {
    // Clear previous title
    currentConversationTitle.value = '';
    
    // Try to find conversation title directly from chatStore
    if (chatStore.conversations) {
      const conversation = chatStore.conversations.find(c => c.id === newId);
      if (conversation && conversation.title) {
        currentConversationTitle.value = conversation.title;
      }
    }
  }
}, { immediate: true });

// Watch for chat store conversations changes to update the title
watch(() => chatStore.conversations, () => {
  const conversationId = route.params.id;
  if (conversationId && route.path.includes('/strategies/')) {
    const conversation = chatStore.conversations?.find(c => c.id === conversationId);
    if (conversation && conversation.title) {
      currentConversationTitle.value = conversation.title;
    }
  }
}, { deep: true });

// Full document title with app name
const documentTitle = computed(() => {
  return `AutoCortex - ${pageTitle.value}`;
});

// Set document title
useHead({
  title: documentTitle,
});

// Use the new preferences helper
const preferencesHelper = useUserPreferencesHelper();
const showSyncMessage = ref(false);

// Function to show sync message temporarily
const displaySyncMessage = () => {
  if (preferencesHelper.syncMessage.value) {
    showSyncMessage.value = true;
    setTimeout(() => {
      showSyncMessage.value = false;
    }, 3000); // Hide after 3 seconds
  }
};

// Need to call this on mount to ensure theme is applied
onMounted(async () => {
  // Force sync with saved preferences
  await preferencesHelper.syncLocaleWithPreferences();
});

// Handle preferences initialization in the component
preferencesHelper.initializePreferences();

const languages = [
  { code: "en", name: "English" },
  { code: "fr", name: "Français" },
  { code: "ar", name: "العربية" }
];

const toggleSidebarPhone = (tempObj) => {
  globalStore.sideBarToggle(tempObj);
};

const toggleLightDarkMode = async () => {
  // Toggle the dark mode
  globalStore.darkModeToggle();
  
  // Apply theme change through theme config
  themeChangeMode();
  
  // Save theme preference to store using our helper
  const currentTheme = globalStore.datkMode ? 'dark' : 'light';
  await preferencesHelper.saveThemePreference(currentTheme);
  
  // Show sync message
  displaySyncMessage();
};

watch(smallDisplay, (newValue, oldValue) => {
  if (newValue && !oldValue) {
    toggleSidebarPhone(false);
  } else {
    toggleSidebarPhone(true);
  }
});

if (smallDisplay.value) {
  toggleSidebarPhone(false);
}
</script>

<template>
  <v-app-bar :height="themeHeaderHeight" class="app-header" fixed>
    <template #prepend>
      <div v-if="!authStore.isAuthenticated || smallDisplay" class="d-flex align-item-center mr-3">
        <NuxtLink :to="homePath" class="d-flex">
          <img
          :src="
            themeName === 'light'
              ? '/images/brand/logo/logo-light.svg'
              : '/images/brand/logo/logo-dark.svg'
          "
          height="60px"
        />
        </NuxtLink>
        <!-- Debug info -->
        <small class="d-none">Locale: {{ currentLocale }}, Path: {{ homePath }}</small>
      </div>
      <icon-btn v-if="authStore.isAuthenticated"
        class="d-none d-sm-flex"
        @click.stop="globalStore.sideBarToggle()"
        :style="`margin-left:${
          globalStore.sideNavBar && !smallDisplay ? themeSidebarWidth : '0'
        }px;`"
      >
        <v-icon size="25" icon="tabler-menu-2" />
      </icon-btn>
      <h1 class="text-h3 ml-4 mb-0 font-weight-medium">{{ pageTitle }}</h1>
    </template>

    <template #append>
      <Notification v-if="authStore.isAuthenticated" />
      <UserProfile v-if="authStore.isAuthenticated" />
    </template>
    
    <!-- Snackbar for sync message -->
    <v-snackbar
      v-model="showSyncMessage"
      :timeout="3000"
      color="success"
      location="top"
    >
      {{ preferencesHelper.syncMessage }}
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          @click="showSyncMessage = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-app-bar>
</template>
