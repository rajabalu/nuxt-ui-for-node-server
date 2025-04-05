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
          <h1 class="text-h4 mb-6">{{ t('footer.privacy') }}</h1>
          
          <v-divider class="mb-6"></v-divider>
          
          <div class="text-body-1">
            <p class="mb-4">
              <em>Last updated: {{ new Date().toLocaleDateString() }}</em>
            </p>
            
            <p class="mb-4">
              At our company, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your personal information when you use our service.
            </p>
            
            <h2 class="text-h5 mb-3 mt-6">Information We Collect</h2>
            <p class="mb-4">
              We collect several types of information for various purposes to provide and improve our service to you:
            </p>
            
            <v-list>
              <v-list-item>
                <v-list-item-title class="font-weight-medium">Personal Data</v-list-item-title>
                <v-list-item-subtitle>Including email address, name, phone number, address, and other data you provide when using our services.</v-list-item-subtitle>
              </v-list-item>
              
              <v-list-item>
                <v-list-item-title class="font-weight-medium">Usage Data</v-list-item-title>
                <v-list-item-subtitle>Information on how you access and use our service, including your IP address, browser type, pages visited, and time spent.</v-list-item-subtitle>
              </v-list-item>
              
              <v-list-item>
                <v-list-item-title class="font-weight-medium">Cookies and Tracking Data</v-list-item-title>
                <v-list-item-subtitle>We use cookies and similar tracking technologies to track activity on our service and hold certain information.</v-list-item-subtitle>
              </v-list-item>
            </v-list>
            
            <h2 class="text-h5 mb-3 mt-6">How We Use Your Information</h2>
            <p class="mb-4">
              We use the collected data for various purposes:
            </p>
            
            <ul class="ml-6 mb-6">
              <li class="mb-2">To provide and maintain our service</li>
              <li class="mb-2">To notify you about changes to our service</li>
              <li class="mb-2">To provide customer support</li>
              <li class="mb-2">To gather analysis or valuable information to improve our service</li>
              <li class="mb-2">To monitor the usage of our service</li>
              <li class="mb-2">To detect, prevent and address technical issues</li>
            </ul>
            
            <h2 class="text-h5 mb-3 mt-6">Data Security</h2>
            <p class="mb-4">
              The security of your data is important to us, but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal data, we cannot guarantee its absolute security.
            </p>
            
            <h2 class="text-h5 mb-3 mt-6">Your Data Protection Rights</h2>
            <p class="mb-4">
              You have the following data protection rights:
            </p>
            
            <ul class="ml-6 mb-6">
              <li class="mb-2">The right to access, update or delete the information we have on you</li>
              <li class="mb-2">The right of rectification - the right to have your information corrected if it is inaccurate or incomplete</li>
              <li class="mb-2">The right to object to our processing of your personal data</li>
              <li class="mb-2">The right of restriction - the right to request that we restrict the processing of your personal information</li>
              <li class="mb-2">The right to data portability - the right to receive a copy of your personal data in a structured, machine-readable format</li>
              <li class="mb-2">The right to withdraw consent at any time where we relied on your consent to process your personal information</li>
            </ul>
            
            <h2 class="text-h5 mb-3 mt-6">Changes to This Privacy Policy</h2>
            <p class="mb-4">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "last updated" date.
            </p>
            
            <h2 class="text-h5 mb-3 mt-6">Contact Us</h2>
            <p class="mb-4">
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            
            <ul class="ml-6 mb-6">
              <li class="mb-2">By email: privacy@example.com</li>
              <li class="mb-2">By phone: +1 (555) 123-4567</li>
            </ul>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template> 