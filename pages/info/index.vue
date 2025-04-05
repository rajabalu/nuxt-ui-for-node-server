<script setup>
import { useI18n } from "vue-i18n";
import { computed } from "vue";
import { getLocalizedPath } from "@/utils/i18n-helpers";
import { useRouter } from "vue-router";

const { t, locale } = useI18n();
const router = useRouter();

definePageMeta({
  middleware: 'public'
});

const infoLinks = computed(() => [
  {
    title: t('info.about.title'),
    icon: 'mdi-information-outline',
    description: t('info.about.shortDescription'),
    to: '/info/about'
  },
  {
    title: t('info.help.title'),
    icon: 'mdi-help-circle-outline',
    description: t('info.help.shortDescription'),
    to: '/info/help'
  },
  {
    title: t('info.privacy.title'),
    icon: 'mdi-shield-lock-outline',
    description: t('info.privacy.shortDescription'),
    to: '/info/privacy'
  },
  {
    title: t('info.terms.title'),
    icon: 'mdi-file-document-outline',
    description: t('info.terms.shortDescription'),
    to: '/info/terms'
  }
]);

// Handle navigation while preserving language
const handleNavigation = (path) => {
  const localizedPath = getLocalizedPath(path, locale.value);
  router.push(localizedPath);
};
</script>

<template>
  <v-container class="py-10">
    <v-row>
      <v-col cols="12" md="10" lg="8" class="mx-auto">
        <v-card class="pa-6">
          <h1 class="text-h4 mb-6">{{ t('common.information') || 'Information' }}</h1>
          
          <v-divider class="mb-6"></v-divider>
          
          <div class="text-body-1 mb-6">
            <p>
              Welcome to our information center. Here you can find details about our company, 
              contact information, privacy policy, terms of service, and help resources.
            </p>
          </div>
          
          <v-row>
            <v-col 
              v-for="(link, index) in infoLinks" 
              :key="index"
              cols="12"
              sm="6"
              md="4"
              class="mb-4"
            >
              <v-card
                class="h-100"
                variant="outlined"
                hover
                @click="handleNavigation(link.to)"
              >
                <v-card-item>
                  <template v-slot:prepend>
                    <v-icon 
                      :icon="link.icon" 
                      size="32" 
                      class="text-primary mr-3"
                    ></v-icon>
                  </template>
                  <v-card-title>{{ link.title }}</v-card-title>
                </v-card-item>
                <v-card-text>
                  {{ link.description }}
                </v-card-text>
                <v-card-actions>
                  <v-btn
                    variant="text"
                    color="primary"
                    class="ml-auto"
                    @click.stop="handleNavigation(link.to)"
                  >
                    View
                    <v-icon class="ml-1" icon="tabler-arrow-right"></v-icon>
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template> 