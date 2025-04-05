<script setup>
import { useI18n } from "vue-i18n";
import { ref, computed } from "vue";
import { getLocalizedPath } from "@/utils/i18n-helpers";
import { useRouter } from "vue-router";

const { t, locale } = useI18n();
const config = useRuntimeConfig();
const router = useRouter();

definePageMeta({
  middleware: 'public'
});

const contactPhone = computed(() => config.public.CONTACT_PHONE || '');
const contactEmail = computed(() => config.public.CONTACT_EMAIL || '');

// Simple contact path - will be localized during navigation
const contactPagePath = '/info/contact';

const expandedItem = ref(null);

// Handle navigation while preserving language
const handleNavigation = (path) => {
  const localizedPath = getLocalizedPath(path, locale.value);
  router.push(localizedPath);
};

const faqItems = computed(() => [
  {
    question: t('info.faq.createAccount.question'),
    answer: t('info.faq.createAccount.answer')
  },
  {
    question: t('info.faq.forgotPassword.question'),
    answer: t('info.faq.forgotPassword.answer')
  },
  {
    question: t('info.faq.changeSettings.question'),
    answer: t('info.faq.changeSettings.answer')
  },
  {
    question: t('info.faq.changeLanguage.question'),
    answer: t('info.faq.changeLanguage.answer')
  },
  {
    question: t('info.faq.contactSupport.question'),
    answer: t('info.faq.contactSupport.answer')
  },
  {
    question: t('info.faq.dataSecure.question'),
    answer: t('info.faq.dataSecure.answer')
  },
  {
    question: t('info.faq.deleteAccount.question'),
    answer: t('info.faq.deleteAccount.answer')
  }
]);
</script>

<template>
  <v-container class="py-10">
    <v-row>
      <v-col cols="12" md="10" lg="8" class="mx-auto">
        <v-card class="pa-6">
          <h1 class="text-h4 mb-6">{{ t('footer.help') }}</h1>
          
          <v-divider class="mb-6"></v-divider>
          
          <div class="text-body-1">
            <h2 class="text-h5 mb-6">{{ t('info.frequentlyAskedQuestions') }}</h2>
            
            <v-expansion-panels v-model="expandedItem">
              <v-expansion-panel
                v-for="(item, i) in faqItems"
                :key="i"
              >
                <v-expansion-panel-title>
                  {{ item.question }}
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  {{ item.answer }}
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
            
            <h2 class="text-h5 mb-3 mt-8">{{ t('info.needMoreHelp') }}</h2>
            <p class="mb-4">
              {{ t('info.couldntFindAnswer') }}
            </p>
            
            <v-row class="mt-6">
              <v-col cols="12" md="4">
                <v-card variant="outlined" class="pa-4 h-100">
                  <div class="d-flex flex-column align-center text-center">
                    <v-icon icon="tabler-mail" size="36" class="mb-4 text-primary"></v-icon>
                    <h3 class="text-h6 mb-2">{{ t('info.emailSupport') }}</h3>
                    <p class="mb-2">{{ t('info.sendEmailAnytime') }}</p>
                    <a v-if="contactEmail" :href="`mailto:${contactEmail}`" class="text-decoration-none">{{ contactEmail }}</a>
                  </div>
                </v-card>
              </v-col>
              
              <v-col cols="12" md="4">
                <v-card variant="outlined" class="pa-4 h-100">
                  <div class="d-flex flex-column align-center text-center">
                    <v-icon icon="tabler-phone" size="36" class="mb-4 text-primary"></v-icon>
                    <h3 class="text-h6 mb-2">{{ t('info.phoneSupport') }}</h3>
                    <p class="mb-2">{{ t('info.phoneHours') }}</p>
                    <a v-if="contactPhone" :href="`tel:${contactPhone.replace ? contactPhone.replace(/\s/g, '') : contactPhone}`" class="text-decoration-none">{{ contactPhone }}</a>
                  </div>
                </v-card>
              </v-col>
              
              <v-col cols="12" md="4">
                <v-card variant="outlined" class="pa-4 h-100">
                  <div class="d-flex flex-column align-center text-center">
                    <v-icon icon="tabler-messages" size="36" class="mb-4 text-primary"></v-icon>
                    <h3 class="text-h6 mb-2">{{ t('info.liveChat') }}</h3>
                    <p class="mb-2">{{ t('info.available24_7') }}</p>
                    <v-btn 
                      color="primary" 
                      variant="tonal" 
                      @click="handleNavigation(contactPagePath)"
                    >
                      {{ t('info.startChat') }}
                    </v-btn>
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template> 