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
import { forceLoadMessages, applyRTLDirection } from '@/utils/i18n-helpers';
import { useNuxtApp } from '#app';

console.log('[AppInitializer] Component setup started');

// Initialize user preferences store
const userPreferencesStore = useUserPreferences();
const preferencesHelper = useUserPreferencesHelper();
const { locale, t } = useI18n();
const nuxtApp = useNuxtApp();

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
    
    // Apply preferences - THIS IS IMPORTANT
    // Apply language first, then theme
    if (userPreferencesStore.language) {
      // Force load messages for the language
      await forceLoadMessages(nuxtApp.$i18n, userPreferencesStore.language);
      
      // Apply language
      await preferencesHelper.applyLanguage(userPreferencesStore.language);
    }
    
    // Apply theme
    preferencesHelper.applyTheme(userPreferencesStore.theme);
  }
});

onMounted(async () => {
  console.log('[AppInitializer] Component mounted');
  
  // Double-check that the language from preferences is active
  if (userPreferencesStore.language && locale.value !== userPreferencesStore.language) {
    console.log('[AppInitializer] Forcing language from preferences:', userPreferencesStore.language);
    
    // Force load messages
    await forceLoadMessages(nuxtApp.$i18n, userPreferencesStore.language);
    
    // Set locale
    locale.value = userPreferencesStore.language;
    
    // Apply RTL direction
    applyRTLDirection(userPreferencesStore.language);
  }
});

// Watch for changes in preferences to keep them consistent
preferencesHelper.initializePreferences();
</script> 