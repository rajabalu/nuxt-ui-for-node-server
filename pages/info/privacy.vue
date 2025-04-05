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
          <h1 class="text-h4 mb-6">{{ t('footer.privacy') }}</h1>
          
          <v-divider class="mb-6"></v-divider>
          
          <div class="text-body-1">
            <p class="mb-4">
              {{ t('info.privacy.introduction') }}
            </p>
            
            <h2 class="text-h5 mb-3 mt-6">{{ t('info.privacy.informationCollect.title') }}</h2>
            <p class="mb-4">
              {{ t('info.privacy.informationCollect.description') }}
            </p>
            
            <v-list>
              <v-list-item>
                <v-list-item-title class="font-weight-medium">{{ t('info.privacy.informationCollect.personalData.title') }}</v-list-item-title>
                <v-list-item-subtitle>{{ t('info.privacy.informationCollect.personalData.description') }}</v-list-item-subtitle>
              </v-list-item>
              
              <v-list-item>
                <v-list-item-title class="font-weight-medium">{{ t('info.privacy.informationCollect.usageData.title') }}</v-list-item-title>
                <v-list-item-subtitle>{{ t('info.privacy.informationCollect.usageData.description') }}</v-list-item-subtitle>
              </v-list-item>
              
              <v-list-item>
                <v-list-item-title class="font-weight-medium">{{ t('info.privacy.informationCollect.cookies.title') }}</v-list-item-title>
                <v-list-item-subtitle>{{ t('info.privacy.informationCollect.cookies.description') }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
            
            <h2 class="text-h5 mb-3 mt-6">{{ t('info.privacy.informationUse.title') }}</h2>
            <p class="mb-4">
              {{ t('info.privacy.informationUse.description') }}
            </p>
            
            <ul class="ml-6 mb-6">
              <li class="mb-2">{{ t('info.privacy.informationUse.purposes.provideService') }}</li>
              <li class="mb-2">{{ t('info.privacy.informationUse.purposes.notifyChanges') }}</li>
              <li class="mb-2">{{ t('info.privacy.informationUse.purposes.customerSupport') }}</li>
              <li class="mb-2">{{ t('info.privacy.informationUse.purposes.analysis') }}</li>
              <li class="mb-2">{{ t('info.privacy.informationUse.purposes.monitorUsage') }}</li>
              <li class="mb-2">{{ t('info.privacy.informationUse.purposes.technicalIssues') }}</li>
            </ul>
            
            <h2 class="text-h5 mb-3 mt-6">{{ t('info.privacy.dataSecurity.title') }}</h2>
            <p class="mb-4">
              {{ t('info.privacy.dataSecurity.description') }}
            </p>
            
            <h2 class="text-h5 mb-3 mt-6">{{ t('info.privacy.dataRights.title') }}</h2>
            <p class="mb-4">
              {{ t('info.privacy.dataRights.description') }}
            </p>
            
            <ul class="ml-6 mb-6">
              <li class="mb-2">{{ t('info.privacy.dataRights.rights.access') }}</li>
              <li class="mb-2">{{ t('info.privacy.dataRights.rights.rectification') }}</li>
              <li class="mb-2">{{ t('info.privacy.dataRights.rights.object') }}</li>
              <li class="mb-2">{{ t('info.privacy.dataRights.rights.restriction') }}</li>
              <li class="mb-2">{{ t('info.privacy.dataRights.rights.portability') }}</li>
              <li class="mb-2">{{ t('info.privacy.dataRights.rights.withdraw') }}</li>
            </ul>
            
            <h2 class="text-h5 mb-3 mt-6">{{ t('info.privacy.changes.title') }}</h2>
            <p class="mb-4">
              {{ t('info.privacy.changes.description') }}
            </p>
            
            <h2 class="text-h5 mb-3 mt-6">{{ t('info.privacy.contact.title') }}</h2>
            <p class="mb-4">
              {{ t('info.privacy.contact.description') }}
            </p>
            
            <ul class="ml-6 mb-6" v-if="contactEmail || contactPhone">
              <li class="mb-2" v-if="contactEmail">{{ t('info.privacy.contact.methods.email', { email: contactEmail }) }}</li>
              <li class="mb-2" v-if="contactPhone">{{ t('info.privacy.contact.methods.phone', { phone: contactPhone }) }}</li>
            </ul>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template> 