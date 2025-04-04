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

console.log('[AppInitializer] Component setup started');

// Initialize user preferences store
const userPreferencesStore = useUserPreferences();
const preferencesHelper = useUserPreferencesHelper();
const { locale, t } = useI18n();
const nuxtApp = useNuxtApp();
const route = useRoute();
const router = useRouter();

console.log('[AppInitializer] Initial preferences state:', {
  theme: userPreferencesStore.theme,
  language: userPreferencesStore.language
});

// Watch for changes in the locale
watch(locale, async (newLocale, oldLocale) => {
  console.log('[AppInitializer] Locale changed from', oldLocale, 'to', newLocale);
  
  // Apply RTL settings
  applyRTLDirection(newLocale);
  
  // Force i18n to reload the messages (helps with message caching issues)
  try {
    // Force load messages for the new locale
    await forceLoadMessages(nuxtApp.$i18n, newLocale);
    
    // Attempt to access a key to force refresh the messages
    console.log('[AppInitializer] Testing translation:', t('settings'));
  } catch (e) {
    console.warn('[AppInitializer] Translation test error:', e);
  }
});

// Initialize on component mount to ensure we're in setup context
onBeforeMount(async () => {
  console.log('[AppInitializer] Before mount hook');
  if (process.client) {
    console.log('[AppInitializer] Running in client');
    // Initialize preferences from localStorage
    userPreferencesStore.initPreferences();
    
    console.log('[AppInitializer] Preferences after initialization:', {
      theme: userPreferencesStore.theme,
      language: userPreferencesStore.language
    });
    
    // Apply theme
    preferencesHelper.applyTheme(userPreferencesStore.theme);
    
    // Apply language with proper URL handling
    if (userPreferencesStore.language) {
      await syncLanguageWithRouter(userPreferencesStore.language);
    }
  }
});

onMounted(async () => {
  console.log('[AppInitializer] Component mounted');
  
  // Double-check that the language from preferences is active
  if (userPreferencesStore.language && locale.value !== userPreferencesStore.language) {
    console.log('[AppInitializer] Forcing language from preferences:', userPreferencesStore.language);
    
    // Sync language with proper URL handling
    await syncLanguageWithRouter(userPreferencesStore.language);
  } else if (locale.value) {
    // If the locale is already set correctly, still ensure messages are loaded
    console.log('[AppInitializer] Ensuring messages are loaded for current locale:', locale.value);
    await forceLoadMessages(nuxtApp.$i18n, locale.value);
    
    // Test a translation
    try {
      console.log('[AppInitializer] Testing translation for', locale.value, ':', t('settings'));
    } catch (error) {
      console.warn('[AppInitializer] Translation test error:', error);
    }
  }
});

// Watch for changes in preferences to keep them consistent
preferencesHelper.initializePreferences();

// Instead of directly changing locale, check if we need URL updates
// when restoring saved preferences
const syncLanguageWithRouter = async (savedLanguage) => {
  // Skip if we're already using this language
  if (!savedLanguage || locale.value === savedLanguage) {
    return;
  }
  
  console.log('[AppInitializer] Syncing language with router:', savedLanguage);
  
  // Get current route
  const route = useRoute();
  const router = useRouter();
  
  // Get current path
  const currentPath = route.fullPath;
  const isDefaultLocale = savedLanguage === 'en';
  const currentLocale = locale.value;
  
  // Check if we need to redirect (only if we're not on the correct locale path)
  let needsRedirect = false;
  
  if (isDefaultLocale) {
    // For default locale, URL shouldn't have locale prefix
    if (currentPath.startsWith(`/${currentLocale}/`) && currentLocale !== 'en') {
      needsRedirect = true;
    }
  } else {
    // For non-default locale, URL should have locale prefix
    if (!currentPath.startsWith(`/${savedLanguage}/`)) {
      needsRedirect = true;
    }
  }
  
  // If we need to redirect, do it properly
  if (needsRedirect) {
    console.log('[AppInitializer] Redirecting to proper locale path');
    
    // Extract path without current locale prefix
    let pathWithoutLocale = currentPath;
    if (currentLocale !== 'en' && pathWithoutLocale.startsWith(`/${currentLocale}/`)) {
      pathWithoutLocale = pathWithoutLocale.substring(currentLocale.length + 1);
    }
    
    // Build new path
    const newPath = isDefaultLocale 
      ? pathWithoutLocale 
      : `/${savedLanguage}${pathWithoutLocale.startsWith('/') ? pathWithoutLocale : '/' + pathWithoutLocale}`;
    
    console.log(`[AppInitializer] Redirecting from ${currentPath} to ${newPath}`);
    
    // Load messages and apply RTL before navigation for better UX
    await forceLoadMessages(nuxtApp.$i18n, savedLanguage);
    applyRTLDirection(savedLanguage);
    
    // Navigate to correct path
    router.push(newPath);
  } else {
    // Just set the locale if URL is already correct
    console.log('[AppInitializer] URL already correct for locale:', savedLanguage);
    locale.value = savedLanguage;
    applyRTLDirection(savedLanguage);
  }
};
</script> 