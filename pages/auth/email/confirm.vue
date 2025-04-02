<script setup>
import EmailConfirmation from "@/components/layouts-pages/authentications/EmailConfirmation.vue";
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

definePageMeta({
  layout: "blank",
  middleware: "public"
});

useSeoMeta({
  title: t('auth.emailConfirmTitle'),
  ogTitle: t('auth.emailConfirmTitle'),
  description: t('auth.emailConfirmMetaDescription'),
  ogDescription: t('auth.emailConfirmMetaDescription'),
  ogImage: "",
  twitterCard: "summary_large_image",
});
</script>

<template>
  <v-container fluid class="h-100">
    <v-row justify="center" align="center" class="h-100">
      <v-col cols="12" sm="8" md="6" lg="4" xl="3">
        <EmailConfirmation />
      </v-col>
    </v-row>
  </v-container>
</template> 