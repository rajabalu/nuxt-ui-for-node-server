<script setup>
import { definePageMeta } from '#imports';
definePageMeta({
  title: 'System Diagnostics',
  layouts: 'dashboard',
  middleware: ['auth'],
});

// Set page metadata
useHead({
  title: 'System Diagnostics',
  meta: [
    { name: 'description', content: 'Diagnostic tools for system maintenance' }
  ]
});
</script>

<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-row class="align-center mb-4">
          <v-col cols="12" md="8" lg="9">
            <h1 class="text-h4 mb-2">System Diagnostics</h1>
            <p class="text-body-1">Tools for diagnosing and troubleshooting system issues</p>
          </v-col>
        </v-row>
      </v-col>
      
      <v-col cols="12">
        <v-card class="mb-6">
          <v-tabs v-model="activeTab">
            <v-tab value="i18n">Internationalization (i18n)</v-tab>
            <v-tab value="storage">Local Storage</v-tab>
            <v-tab value="system">System Info</v-tab>
          </v-tabs>
          
          <v-card-text>
            <v-window v-model="activeTab">
              <v-window-item value="i18n">
                <I18nTester />
              </v-window-item>
              
              <v-window-item value="storage">
                <LocalStorageTester />
              </v-window-item>
              
              <v-window-item value="system">
                <SystemInfoTester />
              </v-window-item>
            </v-window>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      activeTab: 'i18n'
    };
  }
};
</script> 