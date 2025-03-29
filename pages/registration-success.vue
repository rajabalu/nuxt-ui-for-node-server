<script setup>
import RegistrationSuccess from "@/components/layouts-pages/authentications/RegistrationSuccess.vue";

definePageMeta({
  layout: "blank",
});

useSeoMeta({
  title: "Registration Success",
  ogTitle: "Registration Success",
  description: "Your account has been created successfully. Please verify your email address.",
  ogDescription: "Your account has been created successfully. Please verify your email address.",
  ogImage: "",
  twitterCard: "summary_large_image",
});
</script>

<template>
  <v-container fluid class="h-100">
    <v-row justify="center" align="center" class="h-100">
      <v-col cols="12" sm="8" md="6" lg="4" xl="3">
        <RegistrationSuccess />
      </v-col>
    </v-row>
  </v-container>
</template> 