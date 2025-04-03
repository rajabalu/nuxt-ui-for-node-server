<script setup>
import Settings from "@/components/apps/profile/Settings.vue";
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

useSeoMeta({
  title: t('settings'),
  ogTitle: t('settings'),
  description: "",
  ogDescription: "",
  ogImage: "",
  twitterCard: "summary_large_image",
});
</script>
<template>
  <v-container fluid>
    <GlobalsHeader :title="t('settings')" />
    <settings />
  </v-container>
</template>
