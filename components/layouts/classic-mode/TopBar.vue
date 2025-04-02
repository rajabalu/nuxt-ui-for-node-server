<script setup>
import Notification from "@/components/layouts/Notification.vue";
import UserProfile from "@/components/layouts/UserProfile.vue";
import LanguageSwitcher from '@/components/LanguageSwitcher.vue';
import { useGlobal } from "@/stores/global";
import { useI18n } from "vue-i18n";
import { useAuthStore } from '@/stores/auth';

const { themeHeaderHeight, themeSidebarWidth, smallDisplay, themeName } = themeConfig();
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
      <div class="d-flex d-md-none align-item-center mr-3">
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
      <LanguageSwitcher />
      <Notification v-if="authStore.isAuthenticated" />
      <UserProfile v-if="authStore.isAuthenticated" />
    </template>
  </v-app-bar>
</template>
