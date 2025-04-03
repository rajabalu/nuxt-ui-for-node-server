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

console.log('[LanguageSwitcher] Component setup started');

const nuxtApp = useNuxtApp();
const { locale, locales, setLocale, t } = useI18n();

console.log('[LanguageSwitcher] Current locale:', locale.value);
console.log('[LanguageSwitcher] Available locales:', locales.value);

// Use the preferences helper
const preferencesHelper = useUserPreferencesHelper();

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
    
    // Update locale
    setLocale(lang);
    console.log('[LanguageSwitcher] Locale set to:', locale.value);
    
    // Directly apply the document direction
    applyRTLDirection(lang);
    
    console.log('[LanguageSwitcher] Language changed to:', locale.value);
    
    // Try to test a translation to verify it worked
    try {
      const testTranslation = t('settings');
      console.log('[LanguageSwitcher] Test translation after change:', testTranslation);
      
      // Force a full refresh only if absolutely necessary
      if (lang === 'ar' && !document.documentElement.dir.includes('rtl')) {
        console.log('[LanguageSwitcher] RTL not applied correctly, forcing refresh');
        window.location.reload();
      }
    } catch (error) {
      console.warn('[LanguageSwitcher] Translation test failed after language change:', error);
      // If we can't translate basic strings, we might need to force reload
      window.location.reload();
    }
  } catch (error) {
    console.error('[LanguageSwitcher] Error changing language:', error);
  }
};
</script>
  