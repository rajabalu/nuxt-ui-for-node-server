<script setup>
import error404 from "/images/pages/404-error-img.png";
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
import { getLocalizedPath } from '@/utils/i18n-helpers';
import { useRouter } from 'vue-router';

const { locale } = useI18n();
const router = useRouter();

// Simple home path - will be localized during navigation
const homePath = '/';

const goHome = () => {
  const localizedPath = getLocalizedPath(homePath, locale.value);
  router.push(localizedPath);
};
</script>

<template>
  <div class="d-flex align-center justify-center flex-column mb-12">
    <div class="mb-12">
      <img :src="error404" class="img-wrapper" />
    </div>
    <div class="text-center">
      <h1 class="text-h1">Oops! the page not found.</h1>
      <p class="mb-5">Or simply leverage the expertise of our consultation team.</p>
      <v-btn @click="goHome"> Go Home </v-btn>
    </div>
  </div>
</template>
