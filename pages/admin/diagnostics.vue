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
        <I18nTester />
      </v-col>
    </v-row>
  </v-container>
</template> 