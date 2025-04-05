<script setup>
import Navigation from "@/components/layouts/navigation/Index.vue";
import { computed, watch, onMounted } from 'vue';
import { useGlobal } from "@/stores/global";
import { themeConfig } from '@/composables/theme';
import { getLocalizedPath } from '@/utils/i18n-helpers';
import { useI18n } from 'vue-i18n';

const theme = themeConfig();
const { themeSidebarWidth, smallDisplay } = theme;
const globalStore = useGlobal();
const { locale } = useI18n();

// Create computed property for the localized home path
const homePath = computed(() => getLocalizedPath('/', locale.value));

const themeName = computed(() => {
  const currentTheme = globalStore.datkMode ? 'dark' : 'light';
  return currentTheme;
});


watch(() => globalStore.datkMode, (newVal) => {
}, { immediate: true });
</script>

<template>
  <v-navigation-drawer
    v-model="globalStore.sideNavBar"
    :width="themeSidebarWidth"
    :permanent="smallDisplay ? false : true"
    :class="{ 'sidebar-visibile': !smallDisplay && globalStore.sideNavBar }"
    :position="locale === 'ar' ? 'end' : 'start'"
  >
    <div class="d-none d-md-flex app-nav-logo-wrapper aligin-center">
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
    </div>

    <Navigation />
  </v-navigation-drawer>
</template>

<style lang="scss">
@use "@configured-variables" as variable;

.app-nav-logo-wrapper {
  height: variable.$dash-ui-header-height;
  padding: map_get(variable.$list-item, padding);
  align-items: center;
}
</style>
