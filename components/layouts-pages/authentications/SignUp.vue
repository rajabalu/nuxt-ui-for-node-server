<script setup>
const { alphaValidator, emailValidator, requiredValidator, passwordValidator, confirmedValidator } =
  useValidators();

const refVForm = ref();
const isPasswordVisible = ref(false);
const firstName = ref("");
const lastName = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const policyCheck = ref(false);
const isLoading = ref(false);
const showAlert = ref(false);
const alertType = ref("success");
const alertMessage = ref("");

const errors = ref({
  firstName: undefined,
  lastName: undefined,
  email: undefined,
  password: undefined,
  confirmPassword: undefined,
  policyCheck: undefined,
});

const showNotification = (type, message) => {
  alertType.value = type;
  alertMessage.value = message;
  showAlert.value = true;
};

const onSubmit = async () => {
  const { valid: isValid } = await refVForm.value?.validate();
  
  if (isValid) {
    try {
      isLoading.value = true;
      const config = useRuntimeConfig();
      const serverUrl = config.public.SERVER_URL;
      
      const response = await fetch(`${serverUrl}auth/email/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: firstName.value,
          lastName: lastName.value,
          email: email.value,
          password: password.value
        })
      });
      
      if (response.status === 204) {
        showNotification('success', 'Your account has been created successfully');
        // Clear form
        firstName.value = "";
        lastName.value = "";
        email.value = "";
        password.value = "";
        confirmPassword.value = "";
        policyCheck.value = false;
      } else {
        const errorData = await response.json();
        showNotification('error', errorData.message || 'Registration failed');
      }
    } catch (error) {
      showNotification('error', 'Registration failed. Please try again later.');
      console.error(error);
    } finally {
      isLoading.value = false;
    }
  }
};
</script>
<template>
  <v-card elevation="4">
    <v-card-item class="pa-6">
      <div class="mb-6">
        <NuxtLink to="/" class="d-flex mb-2">
          <img src="/images/brand/logo/logo-light.svg" height="60px" />
        </NuxtLink>
        <p class="text-body-1">Please enter your user information.</p>
      </div>

      <v-alert v-if="showAlert" :type="alertType" closable @click:close="showAlert = false" class="mb-4">
        {{ alertMessage }}
      </v-alert>

      <v-form ref="refVForm" @submit.prevent="onSubmit">
        <div class="d-flex gap-3 mb-3">
          <GlobalsTextField
            v-model="firstName"
            label="First Name"
            placeholder="Enter your first name"
            :rules="[requiredValidator, alphaValidator]"
            :error-messages="errors.firstName"
          />

          <GlobalsTextField
            v-model="lastName"
            label="Last Name"
            placeholder="Enter your last name"
            :rules="[requiredValidator, alphaValidator]"
            :error-messages="errors.lastName"
          />
        </div>

        <GlobalsTextField
          v-model="email"
          label="Email"
          type="email"
          placeholder="Email address here"
          :rules="[requiredValidator, emailValidator]"
          :error-messages="errors.email"
          class="mb-3"
        />

        <GlobalsTextField
          v-model="password"
          label=" Password"
          placeholder="************"
          :rules="[requiredValidator, passwordValidator]"
          type="password"
          :error-messages="errors.password"
          class="mb-3"
        />

        <GlobalsTextField
          v-model="confirmPassword"
          label=" Confirm Password"
          placeholder="************"
          :rules="[requiredValidator, confirmedValidator(confirmPassword, password)]"
          :type="isPasswordVisible ? 'text' : 'password'"
          :error-messages="errors.confirmPassword"
          :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
          @click:append-inner="isPasswordVisible = !isPasswordVisible"
          class="mb-3"
        />

        <v-checkbox
          v-model="policyCheck"
          label="Remember me"
          class="mb-4"
          :rules="[requiredValidator]"
          :error-messages="errors.policyCheck"
        >
          <template #label>
            <p class="text-body-1">
              I agree to the
              <NuxtLink to="/" class="mx-1 font-weight-5 text-primary">Terms of Service </NuxtLink>
              and
              <NuxtLink to="/" class="ml-1 font-weight-5 text-primary">Privacy Policy</NuxtLink>.
            </p>
          </template>
        </v-checkbox>

        <v-btn type="submit" block :loading="isLoading"> Create Free Account </v-btn>
        <div class="mt-4 d-flex align-center justify-space-between ga-2 flex-wrap">
          <NuxtLink to="sign-in" class="font-weight-5 text-primary">
            Already member? Login
          </NuxtLink>
          <NuxtLink to="forget-password" class="font-weight-5"> Forgot your password? </NuxtLink>
        </div>
      </v-form>
    </v-card-item>
  </v-card>
</template>
