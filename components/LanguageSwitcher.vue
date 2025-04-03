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
import { watch, onMounted } from 'vue';

const { locale, locales, setLocale } = useI18n();

// Set RTL direction for Arabic language
const setDocumentDirection = (lang) => {
  const isRTL = lang === 'ar';
  document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
  
  // You may also want to set a specific class on the body for RTL styling
  if (isRTL) {
    document.body.classList.add('rtl');
  } else {
    document.body.classList.remove('rtl');
  }
};

// Set direction on initial load
onMounted(() => {
  setDocumentDirection(locale.value);
});

// Watch for language changes and update direction
watch(locale, (newLocale) => {
  setDocumentDirection(newLocale);
});

const changeLanguage = (lang) => {
  setLocale(lang);
};
</script>
  