<script setup>
import { useI18n } from "vue-i18n";

const { t } = useI18n();

definePageMeta({
  middleware: 'public'
});

const infoLinks = [
  {
    title: t("footer.about"),
    icon: "tabler-info-circle",
    to: "/info/about",
    description: "Learn about our company, mission, and values"
  },
  {
    title: t("footer.contact"),
    icon: "tabler-mail",
    to: "/info/contact",
    description: "Get in touch with our team for questions or support"
  },
  {
    title: t("footer.privacy"),
    icon: "tabler-shield-lock",
    to: "/info/privacy",
    description: "Read our privacy policy and how we protect your data"
  },
  {
    title: t("footer.terms"),
    icon: "tabler-file-text",
    to: "/info/terms",
    description: "View our terms of service and usage requirements"
  },
  {
    title: t("footer.help"),
    icon: "tabler-help-circle",
    to: "/info/help",
    description: "Find answers to frequently asked questions and support resources"
  }
];
</script>

<template>
  <v-container class="py-10">
    <v-row>
      <v-col cols="12" md="10" lg="8" class="mx-auto">
        <v-card class="pa-6">
          <h1 class="text-h4 mb-6">{{ t('common.information') || 'Information' }}</h1>
          
          <v-divider class="mb-6"></v-divider>
          
          <div class="text-body-1 mb-6">
            <p>
              Welcome to our information center. Here you can find details about our company, 
              contact information, privacy policy, terms of service, and help resources.
            </p>
          </div>
          
          <v-row>
            <v-col 
              v-for="(link, index) in infoLinks" 
              :key="index"
              cols="12"
              sm="6"
              md="4"
              class="mb-4"
            >
              <v-card
                :to="link.to"
                class="h-100"
                variant="outlined"
                hover
              >
                <v-card-item>
                  <template v-slot:prepend>
                    <v-icon 
                      :icon="link.icon" 
                      size="32" 
                      class="text-primary mr-3"
                    ></v-icon>
                  </template>
                  <v-card-title>{{ link.title }}</v-card-title>
                </v-card-item>
                <v-card-text>
                  {{ link.description }}
                </v-card-text>
                <v-card-actions>
                  <v-btn
                    variant="text"
                    color="primary"
                    :to="link.to"
                    class="ml-auto"
                  >
                    View
                    <v-icon class="ml-1" icon="tabler-arrow-right"></v-icon>
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template> 