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
              Welcome to our platform! We are dedicated to providing an exceptional user experience with cutting-edge technology solutions.
            </p>
            
            <p class="mb-4">
              Our mission is to empower businesses and individuals with innovative tools that enhance productivity and streamline workflows.
            </p>
            
            <h2 class="text-h5 mb-3 mt-6">Our Vision</h2>
            <p class="mb-4">
              To become the leading provider of intuitive, secure, and scalable solutions that transform how people interact with technology.
            </p>
            
            <h2 class="text-h5 mb-3 mt-6">Our Team</h2>
            <p class="mb-4">
              We are a diverse team of passionate professionals dedicated to creating exceptional experiences. Our experts come from various backgrounds including software development, design, security, and business strategy.
            </p>
            
            <h2 class="text-h5 mb-3 mt-6">Our Values</h2>
            <v-list>
              <v-list-item>
                <v-list-item-title>Innovation</v-list-item-title>
                <v-list-item-subtitle>We constantly push the boundaries of what's possible</v-list-item-subtitle>
              </v-list-item>
              
              <v-list-item>
                <v-list-item-title>Security</v-list-item-title>
                <v-list-item-subtitle>We prioritize the safety and privacy of our users' data</v-list-item-subtitle>
              </v-list-item>
              
              <v-list-item>
                <v-list-item-title>Inclusivity</v-list-item-title>
                <v-list-item-subtitle>We design solutions that work for everyone</v-list-item-subtitle>
              </v-list-item>
              
              <v-list-item>
                <v-list-item-title>Excellence</v-list-item-title>
                <v-list-item-subtitle>We strive for the highest quality in everything we do</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template> 