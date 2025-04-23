<script setup>
import { useI18n } from "vue-i18n";
import { computed, watch, ref } from "vue";
import { getLocalizedPath } from "@/utils/i18n-helpers";
import { useRouter } from "vue-router";

const { locale } = useI18n();
const { t } = useI18n();
const router = useRouter();

// Create reactive links with proper localization
const footerLinks = computed(() => [
  {
    title: t("footer.help"),
    icon: "tabler-help-circle",
    to: "/info/help"
  },
  {
    title: t("footer.terms"),
    icon: "tabler-file-text",
    to: "/info/terms"
  },
  {
    title: t("footer.privacy"),
    icon: "tabler-shield-lock",
    to: "/info/privacy"
  },
  {
    title: t("footer.contact"),
    icon: "tabler-mail",
    to: "/info/contact"
  },
  {
    title: t("footer.about"),
    icon: "tabler-info-circle",
    to: "/info/about"
  }
]);

const currentYear = new Date().getFullYear();

// Handle link navigation with proper language preservation
const handleNavigation = (path) => {
  // Ensure the path has the correct language prefix
  const localizedPath = getLocalizedPath(path, locale.value);
  router.push(localizedPath);
};
</script>

<template>
  <v-footer app class="footer-content d-flex flex-column">
    <div class="d-flex justify-space-between align-center w-100 py-2 px-4">
      <div class="text-caption footer-text">
        &copy; {{ currentYear }} {{ t('footer.copyright') }}
      </div>
      <div class="d-flex align-center">
        <v-btn
          v-for="(link, index) in footerLinks"
          :key="index"
          variant="text"
          size="small"
          class="footer-link px-2"
          @click.prevent="handleNavigation(link.to)"
        >
          <v-icon size="18" :icon="link.icon" class="mr-1" />
          <span class="d-none d-sm-block">{{ link.title }}</span>
        </v-btn>
      </div>
    </div>
  </v-footer>
</template>

<style scoped>
.footer-content {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  padding: 0 16px;
}

.footer-link {
  min-width: auto;
  
  @media (max-width: 600px) {
    margin: 0 !important;
    padding: 4px !important;
  }
}

.footer-text {
  @media (max-width: 600px) {
    font-size: 0.8rem;
  }
}

/* Adjust spacing on mobile */
@media (max-width: 600px) {
  .footer-content {
    padding: 0 8px;
  }
  
  .v-btn.v-btn--density-default {
    --v-btn-height: 32px;
  }
  
  .v-icon {
    font-size: 1.2rem !important;
  }
}
</style>