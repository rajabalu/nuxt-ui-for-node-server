<script setup>
import Settings from "@/components/apps/profile/Settings.vue";
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

useSeoMeta({
  title: t('settingsMenu'),
  ogTitle: t('settingsMenu'),
  description: "",
  ogDescription: "",
  ogImage: "",
  twitterCard: "summary_large_image",
});
</script>
<template>
  <v-container fluid :class="{ 'rtl-container': $i18n.locale === 'ar' }">
    <GlobalsHeader :title="t('settingsMenu')" />
    <settings />
  </v-container>
</template>

<style scoped>
.rtl-container {
  direction: rtl;
}
</style>
