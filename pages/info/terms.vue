<script setup>
import { useI18n } from "vue-i18n";
import { computed } from "vue";

const { t } = useI18n();
const config = useRuntimeConfig();

definePageMeta({
  middleware: 'public'
});

const contactPhone = computed(() => config.public.CONTACT_PHONE || '');
const contactEmail = computed(() => config.public.CONTACT_EMAIL || '');
</script>

<template>
  <v-container class="py-10">
    <v-row>
      <v-col cols="12" md="10" lg="8" class="mx-auto">
        <v-card class="pa-6">
          <h1 class="text-h4 mb-6">{{ t('footer.terms') }}</h1>
          
          <v-divider class="mb-6"></v-divider>
          
          <div class="text-body-1">
            <p class="mb-4">
              {{ t('info.terms.introduction') }}
            </p>
            
            <h2 class="text-h5 mb-3 mt-6">{{ t('info.terms.sections.acceptance.title') }}</h2>
            <p class="mb-4">
              {{ t('info.terms.sections.acceptance.content') }}
            </p>
            
            <h2 class="text-h5 mb-3 mt-6">{{ t('info.terms.sections.useOfService.title') }}</h2>
            <p class="mb-4">
              {{ t('info.terms.sections.useOfService.content') }}
            </p>
            
            <h2 class="text-h5 mb-3 mt-6">{{ t('info.terms.sections.userAccounts.title') }}</h2>
            <p class="mb-4">
              {{ t('info.terms.sections.userAccounts.content') }}
            </p>
            
            <h2 class="text-h5 mb-3 mt-6">{{ t('info.terms.sections.intellectualProperty.title') }}</h2>
            <p class="mb-4">
              {{ t('info.terms.sections.intellectualProperty.content') }}
            </p>
            
            <h2 class="text-h5 mb-3 mt-6">{{ t('info.terms.sections.userContent.title') }}</h2>
            <p class="mb-4">
              {{ t('info.terms.sections.userContent.content') }}
            </p>
            
            <h2 class="text-h5 mb-3 mt-6">{{ t('info.terms.sections.prohibitedUses.title') }}</h2>
            <p class="mb-4">
              {{ t('info.terms.sections.prohibitedUses.content') }}
            </p>
            
            <ul class="ml-6 mb-6">
              <li class="mb-2">{{ t('info.terms.sections.prohibitedUses.items.violateLaws') }}</li>
              <li class="mb-2">{{ t('info.terms.sections.prohibitedUses.items.sendSpam') }}</li>
              <li class="mb-2">{{ t('info.terms.sections.prohibitedUses.items.impersonate') }}</li>
              <li class="mb-2">{{ t('info.terms.sections.prohibitedUses.items.harmService') }}</li>
            </ul>
            
            <h2 class="text-h5 mb-3 mt-6">{{ t('info.terms.sections.termination.title') }}</h2>
            <p class="mb-4">
              {{ t('info.terms.sections.termination.content') }}
            </p>
            
            <h2 class="text-h5 mb-3 mt-6">{{ t('info.terms.sections.limitation.title') }}</h2>
            <p class="mb-4">
              {{ t('info.terms.sections.limitation.content') }}
            </p>
            
            <h2 class="text-h5 mb-3 mt-6">{{ t('info.terms.sections.changes.title') }}</h2>
            <p class="mb-4">
              {{ t('info.terms.sections.changes.content') }}
            </p>
            
            <h2 class="text-h5 mb-3 mt-6">{{ t('info.terms.sections.contact.title') }}</h2>
            <p class="mb-4">
              {{ t('info.terms.sections.contact.content') }}
            </p>
            
            <ul class="ml-6 mb-6" v-if="contactEmail || contactPhone">
              <li class="mb-2" v-if="contactEmail">{{ t('info.terms.sections.contact.methods.email', { email: contactEmail }) }}</li>
              <li class="mb-2" v-if="contactPhone">{{ t('info.terms.sections.contact.methods.phone', { phone: contactPhone }) }}</li>
            </ul>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template> 