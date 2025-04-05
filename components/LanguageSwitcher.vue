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
  
  <!-- Snackbar for sync message -->
  <v-snackbar
    v-model="showSyncMessage"
    :timeout="3000"
    color="success"
    location="top"
  >
    {{ successMessage }}
    <template v-slot:actions>
      <v-btn
        color="white"
        variant="text"
        @click="showSyncMessage = false"
      >
        {{ t('common.close') }}
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { useUserPreferencesHelper } from '@/composables/useUserPreferencesHelper';
import { onMounted, watch, ref } from 'vue';
import { useNuxtApp } from '#app';
import { forceLoadMessages, applyRTLDirection, ensureMessageStructure } from '@/utils/i18n-helpers';
import { useRouter, useRoute } from 'vue-router';

const nuxtApp = useNuxtApp();
const { locale, locales, setLocale, t } = useI18n();

// Use the preferences helper
const preferencesHelper = useUserPreferencesHelper();
const showSyncMessage = ref(false);
const successMessage = ref('');

// Get router for navigation
const router = useRouter();
const route = useRoute();

// Watch for global locale changes
watch(locale, (newLocale) => {
  applyRTLDirection(newLocale);
});

// Initialize on mount to ensure correct application
onMounted(() => {
  // Ensure direction is correctly set
  applyRTLDirection(locale.value);
  
  // Try to use the i18n instance to force load messages
  try {
    // Access a translation to force i18n to load messages
    t('settings');
  } catch (e) {
    console.warn('[LanguageSwitcher] Translation test error:', e);
  }
});

// Function to show sync message temporarily with the message in the new language
const displaySyncMessage = (newLocale) => {
  // Set the success message using the new locale's translation
  try {
    // First load the messages for the new locale
    successMessage.value = t('common.languageChanged');
    
    // Show the snackbar
    showSyncMessage.value = true;
    
    // Hide after timeout
    setTimeout(() => {
      showSyncMessage.value = false;
    }, 3000);
  } catch (e) {
    console.warn('[LanguageSwitcher] Error displaying message:', e);
  }
};

// Function to change language
const changeLanguage = async (lang) => {
  try {
    // Clear any server-initiated flags to ensure this is treated as user-initiated
    if (process.client && window.__isServerPreferenceChange) {
      window.__isServerPreferenceChange = false;
    }
    
    // Try to force load messages for the new locale
    await forceLoadMessages(nuxtApp.$i18n, lang);
    
    // Save the language preference (now returns promise)
    await preferencesHelper.saveLanguagePreference(lang);
    
    // Apply language change
    await preferencesHelper.applyLanguage(lang);
    
    // Apply RTL direction
    const isRTL = applyRTLDirection(lang);
    
    // Wait for the language change to be applied
    await nextTick();
    
    // Show message in the new language
    displaySyncMessage(lang);
    
    // Force page refresh if we're switching to Arabic and RTL is not applied properly
    if (isRTL && document.documentElement.dir !== 'rtl') {
      console.warn('[LanguageSwitcher] RTL not properly applied, forcing refresh');
      
      // Allow a small delay for any async operations
      setTimeout(() => window.location.reload(), 200);
    }
  } catch (error) {
    console.error('[LanguageSwitcher] Error changing language:', error);
  }
};

// Watch for changes in preferences
preferencesHelper.initializePreferences();
</script>
  