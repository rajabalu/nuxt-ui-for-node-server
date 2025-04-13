<script setup>
import Settings from "@/components/apps/profile/Settings.vue";
import { useI18n } from 'vue-i18n';
import { useGlobal } from '~/stores/global';

const { t } = useI18n();
const globalStore = useGlobal();

useSeoMeta({
  title: t('settingsMenu'),
  ogTitle: t('settingsMenu'),
  description: "",
  ogDescription: "",
  ogImage: "",
  twitterCard: "summary_large_image",
});

// Use the avatars directly from the global store
const avatars = globalStore.AVAILABLE_AVATARS;
</script>
<template>
  <v-container fluid :class="{ 'rtl-container': $i18n.locale === 'ar' }">
    <settings :avatars="avatars" />
  </v-container>
</template>

<style scoped>
.rtl-container {
  direction: rtl;
}
</style>
