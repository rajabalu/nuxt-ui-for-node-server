<script setup>
import Navigation from "@/components/layouts/navigation/Index.vue";
import { computed, watch } from 'vue';
import { useGlobal } from "@/stores/global";
import { themeConfig } from '@/composables/theme';

const theme = themeConfig();
const { themeSidebarWidth, smallDisplay } = theme;
const globalStore = useGlobal();

const themeName = computed(() => {
  const currentTheme = globalStore.datkMode ? 'dark' : 'light';
  console.log('NavBar - Current theme:', currentTheme);
  return currentTheme;
});

watch(() => globalStore.datkMode, (newVal) => {
  console.log('NavBar - Dark mode changed:', newVal);
  console.log('NavBar - Current theme:', themeName.value);
}, { immediate: true });
</script>

<template>
  <v-navigation-drawer
    v-model="globalStore.sideNavBar"
    :width="themeSidebarWidth"
    :permanent="smallDisplay ? false : true"
    :class="{ 'sidebar-visibile': !smallDisplay && globalStore.sideNavBar }"
  >
    <div class="d-none d-md-flex app-nav-logo-wrapper aligin-center">
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
