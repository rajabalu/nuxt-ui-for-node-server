<script setup>
import Notification from "@/components/layouts/Notification.vue";
import UserProfile from "@/components/layouts/UserProfile.vue";
import LanguageSwitcher from '@/components/LanguageSwitcher.vue';
import { useGlobal } from "@/stores/global";
import { useI18n } from "vue-i18n";
import { useAuthStore } from '@/stores/auth';
import { themeConfig } from '@/composables/theme';
import { watch, computed, onMounted, ref } from 'vue';
import { useNuxtApp } from '#app';
import { useUserPreferencesHelper } from '@/composables/useUserPreferencesHelper';
import { useUserPreferences } from '@/stores/userPreferences';
import { getLocalizedPath } from '@/utils/i18n-helpers';

const theme = themeConfig();
const { themeHeaderHeight, themeSidebarWidth, smallDisplay, themeChangeMode } = theme;
const themeName = computed(() => theme.themeName.value);
const nuxtApp = useNuxtApp();

const globalStore = useGlobal();
const { locale, t } = useI18n();
const authStore = useAuthStore();
const userPreferencesStore = useUserPreferences();

// Debug computed properties
const currentLocale = computed(() => locale.value);
const homePath = computed(() => getLocalizedPath('/', locale.value));

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
    </template>

    <template #append>
      <icon-btn @click="toggleLightDarkMode">
        <v-icon size="25" :icon="globalStore.datkMode ? 'tabler-sun' : 'tabler-moon'"/>
      </icon-btn>
      <LanguageSwitcher />
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
