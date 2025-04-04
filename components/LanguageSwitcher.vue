<template>
  <v-menu>
    <template v-slot:activator="{ props }">
      <icon-btn v-bind="props">
        <v-icon icon="tabler-language" />
      </icon-btn>
    </template>
    <v-list>
      <v-list-item v-for="localeItem in locales" :key="localeItem.code" @click="changeLanguage(localeItem.code)">
        <v-list-item-title>{{ localeItem.name }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { useUserPreferencesHelper } from '@/composables/useUserPreferencesHelper';
import { onMounted, watch } from 'vue';
import { useNuxtApp } from '#app';
import { forceLoadMessages, applyRTLDirection, ensureMessageStructure } from '@/utils/i18n-helpers';
import { useRouter, useRoute } from 'vue-router';

console.log('[LanguageSwitcher] Component setup started');

const nuxtApp = useNuxtApp();
const { locale, locales, setLocale, t } = useI18n();

console.log('[LanguageSwitcher] Current locale:', locale.value);
console.log('[LanguageSwitcher] Available locales:', locales.value);

// Use the preferences helper
const preferencesHelper = useUserPreferencesHelper();

// Get router for navigation
const router = useRouter();
const route = useRoute();

// Watch for global locale changes
watch(locale, (newLocale) => {
  console.log('[LanguageSwitcher] Global locale changed to:', newLocale);
  applyRTLDirection(newLocale);
});

// Initialize on mount to ensure correct application
onMounted(() => {
  console.log('[LanguageSwitcher] Component mounted, current locale:', locale.value);
  // Ensure direction is correctly set
  applyRTLDirection(locale.value);
  
  // Try to use the i18n instance to force load messages
  try {
    // Access a translation to force i18n to load messages
    console.log('[LanguageSwitcher] Testing translation for', locale.value, ':', t('settings'));
  } catch (e) {
    console.warn('[LanguageSwitcher] Translation test error:', e);
  }
});

// Watch for changes in preferences
preferencesHelper.initializePreferences();

const changeLanguage = async (lang) => {
  console.log('[LanguageSwitcher] Changing language from', locale.value, 'to', lang);
  
  try {
    // First save the preference (this ensures it's in localStorage)
    preferencesHelper.saveLanguagePreference(lang);
    
    // Use the provided helper to ensure all messages are loaded and properly structured
    if (nuxtApp.$ensureI18nMessages) {
      await nuxtApp.$ensureI18nMessages(lang);
    } else {
      // Fallback to direct method calls if helper not available
      await forceLoadMessages(nuxtApp.$i18n, lang);
      ensureMessageStructure(nuxtApp.$i18n, lang);
    }
    
    // IMPORTANT: Instead of directly changing the locale and continuing,
    // we should let the router handle this by navigating to the localized path
    
    // Get the current path without any locale prefix
    let path = route.fullPath;
    const currentLocale = locale.value;
    
    // If current locale isn't default and is prefixed in the URL, remove it
    if (currentLocale !== 'en' && path.startsWith(`/${currentLocale}/`)) {
      path = path.substring(currentLocale.length + 1);
    }
    
    // If target language is the default language (en), we don't prefix
    if (lang === 'en') {
      console.log(`[LanguageSwitcher] Navigating to default locale path: ${path}`);
      
      // Apply RTL direction immediately for better UX during navigation
      applyRTLDirection(lang);
      
      // Navigate to the path without locale prefix
      await router.push(path);
    } else {
      // For non-default languages, add the language prefix
      const localizedPath = `/${lang}${path.startsWith('/') ? path : '/' + path}`;
      console.log(`[LanguageSwitcher] Navigating to localized path: ${localizedPath}`);
      
      // Apply RTL direction immediately for better UX during navigation
      applyRTLDirection(lang);
      
      // Navigate to the path with locale prefix
      await router.push(localizedPath);
    }
    
    console.log('[LanguageSwitcher] Navigation completed');
    
    // The i18n module should handle setting the locale automatically based on the URL
    // But we'll double check after a short delay to ensure everything is synchronized
    setTimeout(() => {
      if (locale.value !== lang) {
        console.log('[LanguageSwitcher] Locale not updated by router, manually setting to:', lang);
        locale.value = lang;
      }
      
      // Double check RTL is applied
      applyRTLDirection(lang);
    }, 100);
  } catch (error) {
    console.error('[LanguageSwitcher] Error changing language:', error);
    
    // Fallback: If navigation fails, just set the locale directly
    locale.value = lang;
    applyRTLDirection(lang);
  }
};
</script>
  