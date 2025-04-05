<script setup>
import { useI18n } from "vue-i18n";

const { t } = useI18n();

definePageMeta({
  middleware: 'public'
});
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
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template> 