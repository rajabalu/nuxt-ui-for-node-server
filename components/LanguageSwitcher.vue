<template>
    <v-menu>
      <template v-slot:activator="{ props }">
        <v-btn v-bind="props">
          {{ getFlag(currentLanguage.value) }} {{ (currentLanguage.value || '').toUpperCase() }}
        </v-btn>
      </template>
      <v-list>
        <v-list-item v-for="localeItem in locales" :key="localeItem.code" @click="changeLanguage(localeItem.code)">
          <v-list-item-title>
            {{ getFlag(localeItem.code) }} {{ localeItem.name }}
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </template>
  
  <script setup>
  import { useI18n } from 'vue-i18n';
  
  const { locale, locales, setLocale } = useI18n();
  
  const currentLanguage = locale;
  
  const getFlag = (code) => {
    const flags = { en: '🇺🇸', fr: '🇫🇷' };
    return flags[code] || '🌍';
  };
  
  const changeLanguage = (lang) => {
    setLocale(lang);
  };
  </script>
  