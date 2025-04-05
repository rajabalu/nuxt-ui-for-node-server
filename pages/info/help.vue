<script setup>
import { useI18n } from "vue-i18n";
import { ref } from "vue";

const { t } = useI18n();

definePageMeta({
  middleware: 'public'
});

const expandedItem = ref(null);

const faqItems = [
  {
    question: "How do I create an account?",
    answer: "To create an account, click on the 'Sign Up' button in the top-right corner of the page. Fill in your details including name, email, and password, then click 'Create Free Account'. You'll receive a verification email to activate your account."
  },
  {
    question: "I forgot my password. How can I reset it?",
    answer: "Click on the 'Sign In' button, then select 'Forgot your password?'. Enter the email address associated with your account and follow the instructions sent to your email to reset your password."
  },
  {
    question: "How do I change my account settings?",
    answer: "After signing in, click on your profile picture or name in the top-right corner, then select 'Settings'. From there, you can update your profile information, change your password, and manage notification preferences."
  },
  {
    question: "Can I change the language of the interface?",
    answer: "Yes, you can change the language by clicking on the language selector in the top navigation bar or footer. Currently, we support English, French, and Arabic."
  },
  {
    question: "How do I contact customer support?",
    answer: "You can reach our customer support team by visiting the 'Contact' page in the footer, sending an email to support@example.com, or calling us at +1 (555) 123-4567 during business hours."
  },
  {
    question: "Is my personal information secure?",
    answer: "Yes, we take data security very seriously. We use industry-standard encryption and security measures to protect your personal information. You can learn more about our data practices in our Privacy Policy."
  },
  {
    question: "How do I delete my account?",
    answer: "To delete your account, go to 'Settings' from your profile dropdown, scroll to the bottom of the page, and click on 'Delete Account'. Please note that this action is irreversible and all your data will be permanently removed."
  }
];
</script>

<template>
  <v-container class="py-10">
    <v-row>
      <v-col cols="12" md="10" lg="8" class="mx-auto">
        <v-card class="pa-6">
          <h1 class="text-h4 mb-6">{{ t('footer.help') }}</h1>
          
          <v-divider class="mb-6"></v-divider>
          
          <div class="text-body-1">
            <h2 class="text-h5 mb-6">Frequently Asked Questions</h2>
            
            <v-expansion-panels v-model="expandedItem">
              <v-expansion-panel
                v-for="(item, i) in faqItems"
                :key="i"
              >
                <v-expansion-panel-title>
                  {{ item.question }}
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  {{ item.answer }}
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
            
            <h2 class="text-h5 mb-3 mt-8">Need More Help?</h2>
            <p class="mb-4">
              If you couldn't find the answer to your question in our FAQ, please don't hesitate to contact us:
            </p>
            
            <v-row class="mt-6">
              <v-col cols="12" md="4">
                <v-card variant="outlined" class="pa-4 h-100">
                  <div class="d-flex flex-column align-center text-center">
                    <v-icon icon="tabler-mail" size="36" class="mb-4 text-primary"></v-icon>
                    <h3 class="text-h6 mb-2">Email Support</h3>
                    <p class="mb-2">Send us an email anytime</p>
                    <a href="mailto:support@example.com" class="text-decoration-none">support@example.com</a>
                  </div>
                </v-card>
              </v-col>
              
              <v-col cols="12" md="4">
                <v-card variant="outlined" class="pa-4 h-100">
                  <div class="d-flex flex-column align-center text-center">
                    <v-icon icon="tabler-phone" size="36" class="mb-4 text-primary"></v-icon>
                    <h3 class="text-h6 mb-2">Phone Support</h3>
                    <p class="mb-2">Mon-Fri, 9am-5pm EST</p>
                    <a href="tel:+15551234567" class="text-decoration-none">+1 (555) 123-4567</a>
                  </div>
                </v-card>
              </v-col>
              
              <v-col cols="12" md="4">
                <v-card variant="outlined" class="pa-4 h-100">
                  <div class="d-flex flex-column align-center text-center">
                    <v-icon icon="tabler-messages" size="36" class="mb-4 text-primary"></v-icon>
                    <h3 class="text-h6 mb-2">Live Chat</h3>
                    <p class="mb-2">Available 24/7</p>
                    <v-btn color="primary" variant="tonal" to="/info/contact">Start Chat</v-btn>
                  </div>
                </v-card>
              </v-col>
            </v-row>
            
            <h2 class="text-h5 mb-3 mt-8">Documentation</h2>
            <p class="mb-4">
              Browse our comprehensive documentation for detailed guides and tutorials:
            </p>
            
            <v-list>
              <v-list-item to="/info/help/getting-started">
                <template v-slot:prepend>
                  <v-icon icon="tabler-book" class="mr-2"></v-icon>
                </template>
                <v-list-item-title>Getting Started Guide</v-list-item-title>
              </v-list-item>
              
              <v-list-item to="/info/help/user-guide">
                <template v-slot:prepend>
                  <v-icon icon="tabler-file-text" class="mr-2"></v-icon>
                </template>
                <v-list-item-title>User Guide</v-list-item-title>
              </v-list-item>
              
              <v-list-item to="/info/help/tutorials">
                <template v-slot:prepend>
                  <v-icon icon="tabler-video" class="mr-2"></v-icon>
                </template>
                <v-list-item-title>Video Tutorials</v-list-item-title>
              </v-list-item>
              
              <v-list-item to="/info/help/api">
                <template v-slot:prepend>
                  <v-icon icon="tabler-code" class="mr-2"></v-icon>
                </template>
                <v-list-item-title>API Documentation</v-list-item-title>
              </v-list-item>
            </v-list>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template> 