<script setup>
import { useAuthStore } from '~/stores/auth';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

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
    name: t("editProfile"),
    icon: "tabler-user",
    value: "edit-profile",
  },
  {
    name: t("activityLog"),
    icon: "tabler-activity",
    value: "activity-log",
  },
  {
    name: t("settings"),
    icon: "tabler-settings",
    value: "settings",
    action: () => navigateTo('/settings')
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
        <NuxtLink class="text-body-2" to="/profile">{{ t('viewProfile') }}</NuxtLink>
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
