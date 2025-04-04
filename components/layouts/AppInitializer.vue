<template>
  <div>
    <!-- This component just handles initialization - it doesn't render anything -->
    <slot></slot>
  </div>
</template>

<script setup>
import { onMounted, onBeforeMount, watch } from 'vue';
import { useUserPreferencesHelper } from '@/composables/useUserPreferencesHelper';
import { useUserPreferences } from '@/stores/userPreferences';
import { useI18n } from 'vue-i18n';
import { forceLoadMessages, applyRTLDirection, preloadAllLocales } from '@/utils/i18n-helpers';
import { useNuxtApp } from '#app';
import { useRoute, useRouter } from 'vue-router';

// Initialize user preferences store
const userPreferencesStore = useUserPreferences();
const preferencesHelper = useUserPreferencesHelper();
const { locale, t } = useI18n();
const nuxtApp = useNuxtApp();
const route = useRoute();
const router = useRouter();

// Watch for changes in the locale
watch(locale, async (newLocale, oldLocale) => {
  // Apply RTL settings
  applyRTLDirection(newLocale);
  
  // Force i18n to reload the messages (helps with message caching issues)
  try {
    // Force load messages for the new locale
    await forceLoadMessages(nuxtApp.$i18n, newLocale);
  } catch (e) {
    console.warn('[AppInitializer] Translation test error:', e);
  }
});

// Initialize on component mount to ensure we're in setup context
onBeforeMount(async () => {
  if (process.client) {
    // Initialize preferences from localStorage
    userPreferencesStore.initPreferences();
    
    // Apply theme
    preferencesHelper.applyTheme(userPreferencesStore.theme);
    
    // Apply language with proper URL handling
    if (userPreferencesStore.language) {
      await syncLanguageWithRouter(userPreferencesStore.language);
    }
  }
});

onMounted(async () => {
  // Double-check that the language from preferences is active
  if (userPreferencesStore.language && locale.value !== userPreferencesStore.language) {
    // Sync language with proper URL handling
    await syncLanguageWithRouter(userPreferencesStore.language);
  } else if (locale.value) {
    // If the locale is already set correctly, still ensure messages are loaded
    await forceLoadMessages(nuxtApp.$i18n, locale.value);
  }
});

// Watch for changes in preferences to keep them consistent
preferencesHelper.initializePreferences();

// Sync language with router to ensure URL reflects current locale
async function syncLanguageWithRouter(language) {
  if (!language) return;
  
  try {
    // Make sure we have the messages loaded
    await forceLoadMessages(nuxtApp.$i18n, language);
    
    // Set the locale
    locale.value = language;
    
    // Apply RTL direction
    applyRTLDirection(language);
    
    // Check if we need to update the route to include locale
    const currentRoute = router.currentRoute.value;
    const currentPath = currentRoute.fullPath;
    
    // Check if we're on the root path
    const isRootPath = currentPath === '/';
    
    // For clarity, determine if we need a localized path
    const shouldBeLocalePath = language !== 'en';
    const hasLocalePrefix = currentPath.startsWith(`/${language}/`);
    const otherLocalePrefix = !hasLocalePrefix && /^\/[a-z]{2}\//.test(currentPath);
    const isDefaultLang = language === 'en';
    
    // Conditions that require URL change:
    // 1. We need a localized path but don't have one
    // 2. We're on a different locale path than our preference
    // 3. We're using default language but have a locale prefix
    if (shouldBeLocalePath && (isRootPath || (!hasLocalePrefix && !otherLocalePrefix))) {
      // Directly at root or missing locale prefix entirely - add locale prefix
      const targetPath = `/${language}${currentPath === '/' ? '' : currentPath}`;
      router.push(targetPath);
    } else if (shouldBeLocalePath && otherLocalePrefix) {
      // We have the wrong locale prefix - replace it
      const pathWithoutLocale = currentPath.replace(/^\/[a-z]{2}/, '');
      const targetPath = `/${language}${pathWithoutLocale}`;
      router.push(targetPath);
    } else if (isDefaultLang && currentPath.match(/^\/[a-z]{2}\//)) {
      // We're on a localized path but should be on the default path
      const newPath = currentPath.replace(/^\/[a-z]{2}\//, '/');
      router.push(newPath);
    }
  } catch (error) {
    console.error('[AppInitializer] Error syncing language with router:', error);
  }
}
</script> 