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
          <h1 class="text-h4 mb-6">{{ t('common.about') }}</h1>
          
          <v-divider class="mb-6"></v-divider>
          
          <div class="text-body-1">
            <p class="mb-4">
              {{ t('info.about.welcome') }}
            </p>
            
            <p class="mb-4">
              {{ t('info.about.mission') }}
            </p>
            
            <h2 class="text-h5 mb-3 mt-6">{{ t('info.about.vision.title') }}</h2>
            <p class="mb-4">
              {{ t('info.about.vision.description') }}
            </p>
            
            <h2 class="text-h5 mb-3 mt-6">{{ t('info.about.team.title') }}</h2>
            <p class="mb-4">
              {{ t('info.about.team.description') }}
            </p>
            
            <h2 class="text-h5 mb-3 mt-6">{{ t('info.about.values.title') }}</h2>
            <v-list>
              <v-list-item>
                <v-list-item-title>{{ t('info.about.values.items.innovation.title') }}</v-list-item-title>
                <v-list-item-subtitle>{{ t('info.about.values.items.innovation.description') }}</v-list-item-subtitle>
              </v-list-item>
              
              <v-list-item>
                <v-list-item-title>{{ t('info.about.values.items.security.title') }}</v-list-item-title>
                <v-list-item-subtitle>{{ t('info.about.values.items.security.description') }}</v-list-item-subtitle>
              </v-list-item>
              
              <v-list-item>
                <v-list-item-title>{{ t('info.about.values.items.inclusivity.title') }}</v-list-item-title>
                <v-list-item-subtitle>{{ t('info.about.values.items.inclusivity.description') }}</v-list-item-subtitle>
              </v-list-item>
              
              <v-list-item>
                <v-list-item-title>{{ t('info.about.values.items.excellence.title') }}</v-list-item-title>
                <v-list-item-subtitle>{{ t('info.about.values.items.excellence.description') }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
            
            <h2 class="text-h5 mb-3 mt-6">{{ t('info.about.contact.title') }}</h2>
            <p class="mb-4">
              {{ t('info.about.contact.description') }}
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