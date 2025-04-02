<script setup>
import Notification from "@/components/layouts/Notification.vue";
import UserProfile from "@/components/layouts/UserProfile.vue";
import LanguageSwitcher from '@/components/LanguageSwitcher.vue';
import { useGlobal } from "@/stores/global";
import { useI18n } from "vue-i18n";
import { useAuthStore } from '@/stores/auth';
import { themeConfig } from '@/composables/theme';
import { watch, computed } from 'vue';

const theme = themeConfig();
const { themeHeaderHeight, themeSidebarWidth, smallDisplay, themeChangeMode } = theme;
const themeName = computed(() => theme.themeName.value);
console.log('TopBar - Initial theme:', themeName.value);

const globalStore = useGlobal();
const { locale } = useI18n();
const authStore = useAuthStore();

const languages = [
  { code: "en", name: "English" },
  { code: "fr", name: "Français" },
];

const toggleSidebarPhone = (tempObj) => {
  globalStore.sideBarToggle(tempObj);
};

const toggleLightDarkMode = () => {
  console.log('TopBar - Before toggle - Dark mode:', globalStore.datkMode);
  console.log('TopBar - Before toggle - Theme:', themeName.value);
  globalStore.darkModeToggle();
  themeChangeMode();
  console.log('TopBar - After toggle - Dark mode:', globalStore.datkMode);
  console.log('TopBar - After toggle - Theme:', themeName.value);
};

watch(() => globalStore.datkMode, (newVal) => {
  console.log('TopBar - Dark mode changed:', newVal);
  console.log('TopBar - Current theme:', themeName.value);
}, { immediate: true });

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
        <NuxtLink to="/" class="d-flex">
          <img
          :src="
            themeName === 'light'
              ? '/images/brand/logo/logo-light.svg'
              : '/images/brand/logo/logo-dark.svg'
          "
          height="60px"
        />
        </NuxtLink>
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
  </v-app-bar>
</template>
