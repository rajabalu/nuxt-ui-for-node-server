<template>
  <v-card class="pa-4">
    <v-card-title>I18n Diagnostic Tool</v-card-title>
    <v-card-text>
      <v-alert v-if="error" type="error" class="mb-4">
        {{ error }}
      </v-alert>
      
      <div class="text-subtitle-1 mb-2">Current Locale: <strong>{{ locale }}</strong></div>
      <div class="text-subtitle-1 mb-2">Available Locales: <strong>{{ availableLocales.join(', ') }}</strong></div>
      <div class="text-subtitle-1 mb-2">Document Language: <strong>{{ documentLang }}</strong></div>
      <div class="text-subtitle-1 mb-4">Document Direction: <strong>{{ documentDir }}</strong></div>
      
      <v-divider class="mb-4"></v-divider>
      
      <div class="text-h6 mb-2">Translation Tests</div>
      <v-table>
        <thead>
          <tr>
            <th>Path</th>
            <th>Translation</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(test, index) in translationTests" :key="index">
            <td>{{ test.path }}</td>
            <td>{{ test.translation || 'Not found' }}</td>
            <td>
              <v-icon v-if="test.translation" color="success">tabler-check</v-icon>
              <v-icon v-else color="error">tabler-alert-circle</v-icon>
            </td>
          </tr>
        </tbody>
      </v-table>
      
      <v-divider class="my-4"></v-divider>
      
      <div class="d-flex gap-2">
        <v-btn color="primary" @click="reloadMessages">
          Reload Messages
        </v-btn>
        <v-btn color="warning" @click="refreshPage">
          Refresh Page
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { useNuxtApp } from '#app';
import { ref, computed, onMounted } from 'vue';
import { forceLoadMessages } from '@/utils/i18n-helpers';

// Get required composables
const nuxtApp = useNuxtApp();
const { locale, t, locales, messages } = useI18n();

// State
const error = ref(null);
const translationTests = ref([]);
const documentLang = ref(document.documentElement.lang);
const documentDir = ref(document.documentElement.dir);

// Test paths to validate
const testPaths = [
  'settings',
  'common.email',
  'auth.signInTitle',
  'notifications.title',
];

// Get available locales
const availableLocales = computed(() => {
  return locales.value.map(loc => loc.code);
});

// Run translation tests
const runTranslationTests = () => {
  translationTests.value = testPaths.map(path => {
    let translation = null;
    try {
      translation = t(path);
    } catch (e) {
      console.warn(`Error translating ${path}:`, e);
    }
    return {
      path,
      translation: translation !== path ? translation : null
    };
  });
};

// Reload messages function
const reloadMessages = async () => {
  try {
    error.value = null;
    await forceLoadMessages(nuxtApp.$i18n, locale.value);
    runTranslationTests();
  } catch (e) {
    error.value = `Error reloading messages: ${e.message}`;
    console.error('Error reloading messages:', e);
  }
};

// Refresh page function
const refreshPage = () => {
  window.location.reload();
};

// Initialize on mount
onMounted(() => {
  try {
    runTranslationTests();
  } catch (e) {
    error.value = `Initialization error: ${e.message}`;
    console.error('Initialization error:', e);
  }
});
</script> 