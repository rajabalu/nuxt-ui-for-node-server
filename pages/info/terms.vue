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
          <h1 class="text-h4 mb-6">{{ t('footer.terms') }}</h1>
          
          <v-divider class="mb-6"></v-divider>
          
          <div class="text-body-1">
            <p class="mb-4">
              <em>Last updated: {{ new Date().toLocaleDateString() }}</em>
            </p>
            
            <p class="mb-4">
              Please read these Terms of Service ("Terms", "Terms of Service") carefully before using our website and services.
            </p>
            
            <h2 class="text-h5 mb-3 mt-6">1. Acceptance of Terms</h2>
            <p class="mb-4">
              By accessing or using our service, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the service.
            </p>
            
            <h2 class="text-h5 mb-3 mt-6">2. Use of Service</h2>
            <p class="mb-4">
              Our service is designed to provide users with a platform for [description of service]. You agree to use the service only for lawful purposes and in accordance with these Terms.
            </p>
            
            <h2 class="text-h5 mb-3 mt-6">3. User Accounts</h2>
            <p class="mb-4">
              When you create an account with us, you must provide accurate, complete, and up-to-date information. You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password.
            </p>
            
            <h2 class="text-h5 mb-3 mt-6">4. Intellectual Property</h2>
            <p class="mb-4">
              The service and its original content, features, and functionality are and will remain the exclusive property of our company and its licensors. The service is protected by copyright, trademark, and other laws of both the United States and foreign countries.
            </p>
            
            <h2 class="text-h5 mb-3 mt-6">5. User-Generated Content</h2>
            <p class="mb-4">
              You may provide content through the use of the service ("User Content"). By providing User Content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, translate, distribute, and display such content.
            </p>
            
            <h2 class="text-h5 mb-3 mt-6">6. Prohibited Uses</h2>
            <p class="mb-4">
              You agree not to use the service:
            </p>
            
            <ul class="ml-6 mb-6">
              <li class="mb-2">In any way that violates any applicable national or international law or regulation</li>
              <li class="mb-2">To transmit, or procure the sending of, any advertising or promotional material, including spam</li>
              <li class="mb-2">To impersonate or attempt to impersonate the company, a company employee, another user, or any other person</li>
              <li class="mb-2">In any way that could harm, disable, overburden, or impair the service</li>
            </ul>
            
            <h2 class="text-h5 mb-3 mt-6">7. Termination</h2>
            <p class="mb-4">
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
            
            <h2 class="text-h5 mb-3 mt-6">8. Limitation of Liability</h2>
            <p class="mb-4">
              In no event shall the company, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
            </p>
            
            <h2 class="text-h5 mb-3 mt-6">9. Changes</h2>
            <p class="mb-4">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days notice prior to any new terms taking effect.
            </p>
            
            <h2 class="text-h5 mb-3 mt-6">10. Contact Us</h2>
            <p class="mb-4">
              If you have any questions about these Terms, please contact us:
            </p>
            
            <ul class="ml-6 mb-6">
              <li class="mb-2">By email: terms@example.com</li>
              <li class="mb-2">By phone: +1 (555) 123-4567</li>
            </ul>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template> 