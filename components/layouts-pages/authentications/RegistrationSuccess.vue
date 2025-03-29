<script setup>
// Registration Success component
</script>

<template>
  <v-card elevation="4">
    <v-card-item class="pa-6">
      <div class="mb-6 text-center">
        <NuxtLink to="/" class="d-flex justify-center mb-4">
          <img src="/images/brand/logo/logo-light.svg" height="60px" />
        </NuxtLink>
        <v-icon class="mb-4" color="success" icon="tabler-circle-check-filled" size="80"></v-icon>
        <h1 class="text-h4 mb-2">Registration Successful!</h1>
        <p class="text-body-1 mb-4">
          Your account has been created successfully. Please verify your email address to complete the registration process.
        </p>
      </div>

      <v-card class="mb-6 pa-4 bg-surface rounded" flat>
        <h2 class="text-h6 mb-2">Next Steps:</h2>
        <ol class="text-body-1 ml-4 mb-4">
          <li class="mb-2">Check your email for a verification link</li>
          <li class="mb-2">Click on the "Verify Email" button in the email</li>
          <li class="mb-2">If you don't see the email, please check your spam/junk folder</li>
          <li>If you still can't find the email, you can use the "Forgot Password" option to reset your account</li>
        </ol>
      </v-card>

      <div class="d-flex flex-column align-center">
        <v-btn to="/sign-in" color="primary" class="mb-4" block>
          Click to Login
        </v-btn>
        <NuxtLink to="/forget-password" class="text-body-1">
          Forgot Password?
        </NuxtLink>
      </div>
    </v-card-item>
  </v-card>
</template> 