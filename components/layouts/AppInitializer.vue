<template>
  <div>
    <!-- This component just handles initialization - it doesn't render anything -->
    <slot></slot>
  </div>
</template>

<script setup>
import { watch, onBeforeUnmount, onMounted } from 'vue';
import { useUserPreferencesHelper } from '@/composables/useUserPreferencesHelper';
import { useUserPreferences } from '@/stores/userPreferences';
import { useI18n } from 'vue-i18n';
import { forceLoadMessages, applyRTLDirection, getLocalizedPath } from '@/utils/i18n-helpers';
import { useNuxtApp } from '#app';
import { useRouter } from 'vue-router';
import { useTheme } from 'vuetify';
import { useRTL } from '@/composables/useRTL';
import { useGlobal } from '~/stores/global';

// Initialize user preferences store
const userPreferencesStore = useUserPreferences();
const preferencesHelper = useUserPreferencesHelper();
const { locale } = useI18n();
const nuxtApp = useNuxtApp();
const router = useRouter();
const theme = useTheme();
const rtlUtils = useRTL();
const globalStore = useGlobal();

// Flag to check if component is mounted
let isMounted = true;

// Initialize everything on mount
onMounted(() => {
  // Initialize preferences
  userPreferencesStore.initPreferences();
  
  // Apply avatar preference if available
  const avatarId = userPreferencesStore.getAdditionalSetting('avatarId');
  if (avatarId !== null && avatarId !== undefined) {
    globalStore.setAvatar(Number(avatarId));
  }
});

// Clean up when component is unmounted
onBeforeUnmount(() => {
  isMounted = false;
});

// Watch for changes in the locale and update everything accordingly
watch(locale, async (newLocale) => {
  if (!newLocale || !isMounted) return;
  
  try {
    // Apply RTL settings using the centralized function
    applyRTLDirection(newLocale);
    
    // Force i18n to reload the messages
    await forceLoadMessages(nuxtApp.$i18n, newLocale);
    
    // Check if component is still mounted before continuing with UI updates
    if (!isMounted) return;
    
    // Update user preferences store
    userPreferencesStore.setLanguage(newLocale);
    
    // Handle URL localization
    if (process.client && isMounted) {
      await syncLanguageWithRouter(newLocale);
    }
  } catch (e) {
    console.warn('[AppInitializer] Error handling locale change:', e);
  }
});

// Watch for theme changes from store and apply to Vuetify
watch(() => userPreferencesStore.theme, (newTheme) => {
  if (!isMounted) return;
  
  if (newTheme && theme && theme.global) {
    try {
      theme.global.name.value = newTheme;
    } catch (e) {
      console.warn('[AppInitializer] Error applying theme:', e);
    }
  }
});

// Watch for language changes from the store
watch(() => userPreferencesStore.language, (newLanguage) => {
  if (!isMounted) return;
  
  if (newLanguage && newLanguage !== locale.value) {
    locale.value = newLanguage;
  }
});

// Watch for additional settings changes that might affect the avatar
watch(() => userPreferencesStore.additionalSettings, (newSettings) => {
  if (!isMounted) return;
  
  if (newSettings && 'avatarId' in newSettings) {
    const avatarId = newSettings.avatarId;
    globalStore.setAvatar(Number(avatarId));
  }
}, { deep: true });

// Sync language with router to ensure URL reflects current locale
async function syncLanguageWithRouter(language) {
  if (!language || !process.client || !isMounted) return;
  
  try {
    const currentPath = router.currentRoute.value.fullPath;
    const localePattern = /^\/([a-z]{2})(?:\/|$)/;
    const localeMatch = currentPath.match(localePattern);
    const existingLocale = localeMatch ? localeMatch[1] : null;
    
    const needsLocalization = language !== 'en';
    const hasCorrectLocale = existingLocale === language;
    const missingLocale = needsLocalization && !existingLocale;
    const wrongLocale = needsLocalization && existingLocale && existingLocale !== language;
    const unnecessaryLocale = !needsLocalization && existingLocale;
    
    // Only redirect if we need to change the URL
    if (missingLocale || wrongLocale || unnecessaryLocale) {
      let targetPath;
      
      if (missingLocale) {
        // Add the language prefix
        targetPath = getLocalizedPath(currentPath, language);
      } else if (wrongLocale) {
        // Replace the wrong prefix
        const pathWithoutPrefix = currentPath.replace(localePattern, '/');
        targetPath = getLocalizedPath(pathWithoutPrefix, language);
      } else if (unnecessaryLocale) {
        // Remove the prefix for English
        targetPath = currentPath.replace(localePattern, '/');
      }
      
      if (targetPath && isMounted) {
        router.push(targetPath);
      }
    }
  } catch (e) {
    console.warn('[AppInitializer] Error syncing language with router:', e);
  }
}
</script>