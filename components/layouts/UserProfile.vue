<script setup>
import { useAuthStore } from '~/stores/auth';
import { computed, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { forceLoadMessages, getLocalizedPath } from '@/utils/i18n-helpers';
import { useNuxtApp } from '#app';

// Initialize i18n
const { t, locale } = useI18n();

// Debug current locale
console.log("🚀 Current Locale:", locale.value);

// Get user data from auth store
const authStore = useAuthStore();

// Compute user properties
const userPhoto = computed(() => authStore.user?.photo?.path || '/images/avatar/avatar-fallback.jpg');
const userName = computed(() => {
  if (authStore.user) {
    return `${authStore.user.firstName} ${authStore.user.lastName}`;
  }
  return t('guestUser'); // Translated "Guest User"
});

// Menu visibility state
const menuVisible = ref(false);

const itemList = computed(() => [
  {
    name: t("settingsMenu"),
    icon: "tabler-settings",
    value: "settings",
    action: () => {
      // Navigate to settings with locale
      const settingsPath = getLocalizedPath('/settings', locale.value);
      console.log(`[UserProfile] Navigating to localized settings: ${settingsPath}`);
      navigateTo(settingsPath);
    }
  },
  {
    name: t("signOut"),
    icon: "tabler-power",
    value: "sign-out",
    action: () => authStore.logout()
  },
]);

// Handle item click
const handleItemClick = (item) => {
  // Close the menu first
  menuVisible.value = false;
  
  // Then execute the action
  if (item.action) {
    item.action();
  }
};

const nuxtApp = useNuxtApp();

// Before using translations, ensure they're loaded
onMounted(async () => {
  console.log('[UserProfile] Component mounted, current locale:', locale.value);
  
  // Force load messages for the current locale
  if (locale.value) {
    try {
      await forceLoadMessages(nuxtApp.$i18n, locale.value);
      console.log('[UserProfile] Forced loading of messages for:', locale.value);
    } catch (error) {
      console.warn('[UserProfile] Error loading messages:', error);
    }
  }
});
</script>


<template>
  <v-menu v-model="menuVisible" :close-on-content-click="false">
    <template #activator="{ props }">
      <v-badge
        dot
        location="bottom right"
        offset-x="3"
        offset-y="3"
        color="success"
        bordered
        v-bind="props"
      >
        <v-avatar class="cursor-pointer">
          <VImg :src="userPhoto" />
        </v-avatar>
      </v-badge>
    </template>
    <v-list>
      <div class="px-4 pt-2">
        <h5 class="text-h5">{{ userName }}</h5>
        <v-divider class="my-2" />
      </div>
      <v-list-item 
        v-for="item in itemList" 
        :key="item.value" 
        :value="item.value"
        @click="handleItemClick(item)"
      >
        <template #prepend>
          <v-icon :icon="item.icon" size="small" />
        </template>
        <v-list-item-title>{{ item.name }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>
