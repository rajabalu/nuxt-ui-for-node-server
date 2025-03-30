<script setup>
import EmailConfirmation from "@/components/layouts-pages/authentications/EmailConfirmation.vue";

definePageMeta({
  layout: "blank",
  middleware: "public"
});

useSeoMeta({
  title: "Email Confirmation",
  ogTitle: "Email Confirmation",
  description: "Verify your email address to complete your registration.",
  ogDescription: "Verify your email address to complete your registration.",
  ogImage: "",
  twitterCard: "summary_large_image",
});
</script>

<template>
  <v-container fluid class="h-100">
    <v-row justify="center" align="center" class="h-100">
      <v-col cols="12" sm="8" md="6" lg="4" xl="3">
        <EmailConfirmation />
      </v-col>
    </v-row>
  </v-container>
</template> 