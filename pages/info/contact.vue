<script setup>
import { useI18n } from "vue-i18n";
import { ref, computed } from "vue";

const { t } = useI18n();
const config = useRuntimeConfig();

definePageMeta({
  middleware: 'public'
});

const contactPhone = computed(() => config.public.CONTACT_PHONE || '');
const contactEmail = computed(() => config.public.CONTACT_EMAIL || '');
const contactAddress = computed(() => config.public.CONTACT_ADDRESS || '');

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
                <h2 class="text-h5 mb-4">{{ t('info.getInTouch') }}</h2>
                <p class="mb-6">
                  {{ t('info.contactDescription') }}
                </p>
                
                <v-list>
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
            </v-col>
            
            <v-col cols="12" md="7">
              <v-form @submit.prevent="handleSubmit">
                <v-text-field
                  v-model="form.name"
                  :label="t('info.yourName')"
                  required
                  variant="outlined"
                  class="mb-3"
                ></v-text-field>
                
                <v-text-field
                  v-model="form.email"
                  :label="t('info.emailAddress')"
                  type="email"
                  required
                  variant="outlined"
                  class="mb-3"
                ></v-text-field>
                
                <v-text-field
                  v-model="form.subject"
                  :label="t('info.subject')"
                  required
                  variant="outlined"
                  class="mb-3"
                ></v-text-field>
                
                <v-textarea
                  v-model="form.message"
                  :label="t('info.message')"
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
                  {{ t('info.sendMessage') }}
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
          {{ t('common.close') }}
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template> 