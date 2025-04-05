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
const contactAddress = computed(() => config.public.CONTACT_ADDRESS || '');
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
            
            <v-list v-if="contactEmail || contactPhone || contactAddress">
              <v-list-item v-if="contactEmail">
                <template v-slot:prepend>
                  <v-icon icon="tabler-mail" class="mr-2"></v-icon>
                </template>
                <v-list-item-title>{{ contactEmail }}</v-list-item-title>
              </v-list-item>
              
              <v-list-item v-if="contactPhone">
                <template v-slot:prepend>
                  <v-icon icon="tabler-phone" class="mr-2"></v-icon>
                </template>
                <v-list-item-title>{{ contactPhone }}</v-list-item-title>
              </v-list-item>
              
              <v-list-item v-if="contactAddress">
                <template v-slot:prepend>
                  <v-icon icon="tabler-map-pin" class="mr-2 mt-0"></v-icon>
                </template>
                <div>
                  <div class="font-weight-bold">{{ t('info.about.contact.addressTitle') }}</div>
                  <div class="text-wrap">{{ contactAddress }}</div>
                </div>
              </v-list-item>
            </v-list>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template> 