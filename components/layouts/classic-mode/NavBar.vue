<script setup>
import Navigation from "@/components/layouts/navigation/Index.vue";
import { computed, watch, onMounted, ref } from 'vue';
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

// Handle swipe gestures for mobile to show/hide navbar
const touchStartX = ref(0);
const touchEndX = ref(0);

const handleTouchStart = (e) => {
  touchStartX.value = e.changedTouches[0].screenX;
};

const handleTouchEnd = (e) => {
  touchEndX.value = e.changedTouches[0].screenX;
  handleSwipe();
};

const handleSwipe = () => {
  if (smallDisplay.value) {
    const swipeDistance = touchEndX.value - touchStartX.value;
    // Right swipe when drawer is closed
    if (swipeDistance > 100 && !globalStore.sideNavBar) {
      globalStore.sideBarToggle(true);
    }
    // Left swipe when drawer is open
    else if (swipeDistance < -100 && globalStore.sideNavBar) {
      globalStore.sideBarToggle(false);
    }
  }
};

watch(() => globalStore.datkMode, (newVal) => {
}, { immediate: true });
</script>

<template>
  <v-navigation-drawer
    app
    v-model="globalStore.sideNavBar"
    :width="themeSidebarWidth"
    :permanent="smallDisplay ? false : true"
    :class="{ 'sidebar-visibile': !smallDisplay && globalStore.sideNavBar }"
    :position="locale === 'ar' ? 'end' : 'start'"
    temporary
    :mobile-breakpoint="960"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
  >
    <div class="d-none d-md-flex app-nav-logo-wrapper align-center">
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

/* Mobile enhancement for sidebar */
@media (max-width: 600px) {
  .v-navigation-drawer {
    width: 100% !important; /* Full width on very small screens */
    max-width: 280px !important;
  }
}
</style>
