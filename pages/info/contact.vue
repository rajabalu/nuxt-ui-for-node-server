<script setup>
import { useI18n } from "vue-i18n";
import { ref } from "vue";

const { t } = useI18n();

definePageMeta({
  middleware: 'public'
});

const form = ref({
  name: "",
  email: "",
  subject: "",
  message: ""
});

const loading = ref(false);
const snackbar = ref(false);
const snackbarMessage = ref("");

const handleSubmit = () => {
  loading.value = true;
  // Simulate API call
  setTimeout(() => {
    loading.value = false;
    snackbarMessage.value = "Your message has been sent. We'll get back to you soon!";
    snackbar.value = true;
    form.value = {
      name: "",
      email: "",
      subject: "",
      message: ""
    };
  }, 1000);
};
</script>

<template>
  <v-container class="py-10">
    <v-row>
      <v-col cols="12" md="10" lg="8" class="mx-auto">
        <v-card class="pa-6">
          <h1 class="text-h4 mb-6">{{ t('footer.contact') }}</h1>
          
          <v-divider class="mb-6"></v-divider>
          
          <v-row>
            <v-col cols="12" md="5">
              <div class="text-body-1">
                <h2 class="text-h5 mb-4">Get in Touch</h2>
                <p class="mb-6">
                  We'd love to hear from you! Fill out the form and our team will get back to you as soon as possible.
                </p>
                
                <v-list>
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon icon="tabler-mail" class="mr-2"></v-icon>
                    </template>
                    <v-list-item-title>support@example.com</v-list-item-title>
                  </v-list-item>
                  
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon icon="tabler-phone" class="mr-2"></v-icon>
                    </template>
                    <v-list-item-title>+1 (555) 123-4567</v-list-item-title>
                  </v-list-item>
                  
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon icon="tabler-map-pin" class="mr-2"></v-icon>
                    </template>
                    <v-list-item-title>123 Business Ave, Suite 100, City, Country</v-list-item-title>
                  </v-list-item>
                </v-list>
              </div>
            </v-col>
            
            <v-col cols="12" md="7">
              <v-form @submit.prevent="handleSubmit">
                <v-text-field
                  v-model="form.name"
                  label="Your Name"
                  required
                  variant="outlined"
                  class="mb-3"
                ></v-text-field>
                
                <v-text-field
                  v-model="form.email"
                  label="Email Address"
                  type="email"
                  required
                  variant="outlined"
                  class="mb-3"
                ></v-text-field>
                
                <v-text-field
                  v-model="form.subject"
                  label="Subject"
                  required
                  variant="outlined"
                  class="mb-3"
                ></v-text-field>
                
                <v-textarea
                  v-model="form.message"
                  label="Message"
                  required
                  variant="outlined"
                  rows="4"
                  class="mb-4"
                ></v-textarea>
                
                <v-btn
                  type="submit"
                  color="primary"
                  block
                  :loading="loading"
                >
                  Send Message
                </v-btn>
              </v-form>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
    
    <v-snackbar
      v-model="snackbar"
      :timeout="3000"
    >
      {{ snackbarMessage }}
      
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="snackbar = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template> 