<script setup>
import avatar11 from "/images/avatar/avatar-11.jpg";
import { useAuthStore } from '~/stores/auth';

const { alphaValidator, emailValidator, requiredValidator, passwordValidator, confirmedValidator } =
  useValidators();

const refBassicForm = ref();
const refEmailVForm = ref();
const refPasswordVForm = ref();

// Get user data from auth store
const authStore = useAuthStore();

// Use computed property for profile image to ensure it updates when auth store changes
const profileImage = computed(() => {
  return authStore.user?.photo?.path || '/images/avatar/avatar-fallback.jpg';
});

const isUploading = ref(false);

const basicForm = reactive({
  firstName: authStore.user?.firstName || "",
  lastName: authStore.user?.lastName || "",
  email: authStore.user?.email || "",
  phone: authStore.user?.phone || "",
  location: authStore.user?.location || "India",
  address1: authStore.user?.address1 || "",
  address2: authStore.user?.address2 || "",
  zipCode: authStore.user?.zipCode || "",
});

const email = ref("");

const passwordForm = reactive({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const preferencesForm = reactive({
  langauge: "English",
  timeZone: "GMT +5.30",
  dateFormat: "No Preference",
});

const errors = ref({
  firstName: undefined,
  lastName: undefined,
  phone: undefined,
  location: undefined,
  address1: undefined,
  address2: undefined,
  zipCode: undefined,
  email: undefined,
  currentPassword: undefined,
  newPassword: undefined,
  confirmPassword: undefined,
});

const onProfileChange = async (event) => {
  try {
    const file = event.target.files[0];
    if (!file) return;
    
    isUploading.value = true;
    
    // Get API and base URL from composables
    const nuxtApp = useNuxtApp();
    const api = nuxtApp.$api;
    
    if (!api) {
      throw new Error('API not available');
    }
    
    // Get the configured base URL
    const baseUrl = api.getBaseUrl ? api.getBaseUrl() : 'http://localhost:8000/api/v1/';
    
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    
    // Upload file using the working endpoint
    const uploadUrl = `${baseUrl}files/upload`;
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed with status: ${response.status}`);
    }
    
    // Parse response JSON
    const data = await response.json();
    
    // Extract the file ID
    const fileId = data.file?.id;
    
    if (!fileId) {
      throw new Error('No file ID returned from server');
    }
    
    // Update user profile with the new photo
    const updateUrl = `${baseUrl}auth/me`;
    const updateResponse = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        photo: {
          id: fileId
        }
      })
    });
    
    if (!updateResponse.ok) {
      throw new Error(`Profile update failed with status: ${updateResponse.status}`);
    }
    
    // Update the auth store with new user data to refresh all avatars
    await authStore.fetchCurrentUser();
    
    // Show success message
    alert("Profile photo updated successfully!");
    
  } catch (error) {
    console.error('Error uploading photo:', error);
    alert(`Failed to upload photo: ${error.message}`);
  } finally {
    isUploading.value = false;
  }
};

const onBasic = () => {
  refBassicForm.value?.validate().then(({ valid: isValid }) => {
    if (isValid) alert("Your information updated successfully");
  });
};

const onPassword = () => {
  refEmailVForm.value?.validate().then(({ valid: isValid }) => {
    if (isValid) alert("Your password change successfully");
  });
};

const onEmail = () => {
  refPasswordVForm.value?.validate().then(({ valid: isValid }) => {
    if (isValid) alert("Your update successfully");
  });
};
</script>
<template>
  <!-- General Setting -->
  <v-row>
    <v-col cols="12" md="4" lg="3">
      <div>
        <h4 class="text-h4">General Setting</h4>
        <p class="text-body-1">Profile configuration settings</p>
      </div>
    </v-col>
    <v-col cols="12" md="8" lg="9">
      <v-card>
        <v-card-item>
          <h4 class="text-h4 mb-4">General Settings</h4>
          <v-row align="center">
            <v-col cols="12" sm="4">
              <v-label class="form-label"> Avatar </v-label>
            </v-col>
            <v-col cols="12" sm="8" class="d-flex align-center gap-4">
              <v-avatar size="56">
                <VImg :src="profileImage" :key="authStore.user?.photo?.path || 'default'" />
              </v-avatar>
              <input type="file" ref="file" style="display: none" @change="onProfileChange" accept="image/*" />
              <v-btn variant="outlined" color="secondary" @click="$refs.file.click()" :loading="isUploading">
                Upload Photo
              </v-btn>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12" sm="4">
              <v-label class="form-label"> Cover photo </v-label>
            </v-col>
            <v-col cols="12" sm="8">
              <GlobalsFileUpload />
              <v-btn class="mt-3" variant="outlined" color="secondary"> Change </v-btn>
            </v-col>
          </v-row>

          <h4 class="text-h4 my-4">Basic information</h4>

          <v-form ref="refBassicForm" @submit.prevent="onBasic">
            <v-row no-gutters class="pb-3">
              <v-col cols="12" sm="4">
                <v-label class="form-label">Full name</v-label>
              </v-col>
              <v-col cols="12" sm="8">
                <v-row>
                  <v-col cols="12" sm="6" class="pb-0">
                    <GlobalsTextField
                      v-model="basicForm.firstName"
                      :rules="[requiredValidator, alphaValidator]"
                      :error-messages="errors.firstName"
                      placeholder="First Name"
                      readonly
                    />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <GlobalsTextField
                      v-model="basicForm.lastName"
                      :rules="[requiredValidator, alphaValidator]"
                      :error-messages="errors.lastName"
                      placeholder="Last Name"
                      readonly
                    />
                  </v-col>
                </v-row>
              </v-col>
            </v-row>

            <v-row no-gutters class="pb-3">
              <v-col cols="12" sm="4">
                <v-label class="form-label"> Email </v-label>
              </v-col>
              <v-col cols="12" sm="8">
                <GlobalsTextField
                  v-model="basicForm.email"
                  type="email"
                  :rules="[requiredValidator, emailValidator]"
                  :error-messages="errors.email"
                  placeholder="Enter your email address"
                  readonly
                />
              </v-col>
            </v-row>

            <v-row no-gutters class="pb-3">
              <v-col cols="12" sm="4">
                <v-label class="form-label"> Phone (Optional) </v-label>
              </v-col>
              <v-col cols="12" sm="8">
                <GlobalsTextField
                  v-model="basicForm.phone"
                  :error-messages="errors.phone"
                  placeholder="Enter your phone number"
                />
              </v-col>
            </v-row>

            <v-row no-gutters class="pb-3">
              <v-col cols="12" sm="4">
                <v-label class="form-label"> Location </v-label>
              </v-col>
              <v-col cols="12" sm="8">
                <GlobalsSelect
                  v-model="basicForm.location"
                  :items="['India', 'UK', 'USA']"
                  :rules="[requiredValidator]"
                  :error-messages="errors.location"
                />
              </v-col>
            </v-row>

            <v-row no-gutters class="pb-3">
              <v-col cols="12" sm="4">
                <v-label class="form-label"> Address line 1 </v-label>
              </v-col>
              <v-col cols="12" sm="8">
                <GlobalsTextField
                  v-model="basicForm.address1"
                  :rules="[requiredValidator]"
                  :error-messages="errors.address1"
                  placeholder="Address line 1"
                />
              </v-col>
            </v-row>

            <v-row no-gutters class="pb-3">
              <v-col cols="12" sm="4">
                <v-label class="form-label"> Address line 2 </v-label>
              </v-col>
              <v-col cols="12" sm="8">
                <GlobalsTextField
                  v-model="basicForm.address2"
                  :rules="[requiredValidator]"
                  :error-messages="errors.address2"
                  placeholder="Address line 2"
                />
              </v-col>
            </v-row>

            <v-row no-gutters class="pb-3">
              <v-col cols="12" sm="4">
                <v-label class="form-label"> Zip Code </v-label>
                <v-icon icon="tabler-alert-circle" size="16" class="ml-2" />
              </v-col>
              <v-col cols="12" sm="8">
                <GlobalsTextField
                  v-model="basicForm.zipCode"
                  :rules="[requiredValidator]"
                  :error-messages="errors.zipCode"
                  placeholder="Zip Code"
                />
              </v-col>
            </v-row>

            <v-row no-gutters>
              <v-col offset-sm="4">
                <v-btn type="submit"> Save Changes </v-btn>
              </v-col>
            </v-row>
          </v-form>
        </v-card-item>
      </v-card>
    </v-col>
  </v-row>

  <!-- Email Setting -->
  <v-row>
    <v-col cols="12" md="4" lg="3">
      <div>
        <h4 class="text-h4">Email Setting</h4>
        <p class="text-body-1">Add an email settings to profile</p>
      </div>
    </v-col>
    <v-col cols="12" md="8" lg="9">
      <v-card>
        <v-card-item>
          <!-- Email -->
          <h4 class="text-h4 mb-4">Email</h4>
          <v-form ref="refEmailVForm" @submit.prevent="onEmail">
            <v-row no-gutters class="pb-3">
              <v-col cols="12" sm="4">
                <v-label class="form-label"> New email </v-label>
              </v-col>
              <v-col cols="12" sm="8">
                <GlobalsTextField
                  v-model="email"
                  type="email"
                  :rules="[requiredValidator, emailValidator]"
                  :error-messages="errors.email"
                  placeholder="Enter your email address"
                />
              </v-col>
            </v-row>
            <v-row no-gutters class="pb-3">
              <v-col offset-sm="4">
                <v-btn type="submit"> Save Changes </v-btn>
              </v-col>
            </v-row>
          </v-form>

          <!-- Change your password -->
          <h4 class="text-h4 my-4">Change your password</h4>
          <v-form ref="refPasswordVForm" @submit.prevent="onPassword">
            <v-row no-gutters class="pb-3">
              <v-col cols="12" sm="4">
                <v-label class="form-label"> Current password </v-label>
              </v-col>
              <v-col cols="12" sm="8">
                <GlobalsTextField
                  v-model="passwordForm.currentPassword"
                  :rules="[requiredValidator, passwordValidator]"
                  :error-messages="errors.currentPassword"
                  placeholder="Enter Current password"
                />
              </v-col>
            </v-row>
            <v-row no-gutters class="pb-3">
              <v-col cols="12" sm="4">
                <v-label class="form-label"> New password </v-label>
              </v-col>
              <v-col cols="12" sm="8">
                <GlobalsTextField
                  v-model="passwordForm.newPassword"
                  :rules="[requiredValidator, passwordValidator]"
                  :error-messages="errors.newPassword"
                  placeholder="Enter New password"
                />
              </v-col>
            </v-row>
            <v-row no-gutters class="pb-3">
              <v-col cols="12" sm="4">
                <v-label class="form-label"> Confirm new password </v-label>
              </v-col>
              <v-col cols="12" sm="8">
                <GlobalsTextField
                  v-model="passwordForm.confirmPassword"
                  :rules="[
                    requiredValidator,
                    confirmedValidator(passwordForm.confirmPassword, passwordForm.newPassword),
                  ]"
                  :error-messages="errors.confirmPassword"
                  placeholder="Enter New password"
                />

                <div class="mt-4">
                  <p class="text-body-2 font-weight-8">Password requirements:</p>
                  <p class="text-body-1 mb-4">Ensure that these requirements are met:</p>
                  <ul>
                    <li class="text-body-2 py-0">Minimum 8 characters long the more, the better</li>
                    <li class="text-body-2 py-0">At least one lowercase character</li>
                    <li class="text-body-2 py-0">At least one uppercase character</li>
                    <li class="text-body-2 py-0">
                      At least one number, symbol, or whitespace character
                    </li>
                  </ul>
                </div>
              </v-col>
            </v-row>
            <v-row no-gutters class="pb-3">
              <v-col offset-sm="4">
                <v-btn type="submit"> Save Changes </v-btn>
              </v-col>
            </v-row>
          </v-form>
        </v-card-item>
      </v-card>
    </v-col>
  </v-row>

  <!-- Preferences -->
  <v-row>
    <v-col cols="12" md="4" lg="3">
      <div>
        <h4 class="text-h4">Preferences</h4>
        <p class="text-body-1">Configure your preferences</p>
      </div>
    </v-col>
    <v-col cols="12" md="8" lg="9">
      <v-card>
        <v-card-item>
          <h4 class="text-h4 mb-4">Preferences</h4>
          <v-row no-gutters class="pb-3">
            <v-col cols="12" sm="4">
              <v-label class="form-label"> Langauge </v-label>
            </v-col>
            <v-col cols="12" sm="8">
              <GlobalsSelect
                v-model="preferencesForm.langauge"
                :items="['English', 'Hindi', 'Spanish', 'Arabic']"
              />
            </v-col>
          </v-row>
          <v-row no-gutters class="pb-3">
            <v-col cols="12" sm="4">
              <v-label class="form-label"> Time Zone </v-label>
            </v-col>
            <v-col cols="12" sm="8">
              <GlobalsSelect
                v-model="preferencesForm.timeZone"
                :items="['GTM +5.30', 'GTM +5.31', 'GTM +5.32', 'GTM +5.33']"
              />
            </v-col>
          </v-row>
          <v-row no-gutters class="pb-3">
            <v-col cols="12" sm="4">
              <v-label class="form-label"> Date Format </v-label>
            </v-col>
            <v-col cols="12" sm="8">
              <GlobalsSelect
                v-model="preferencesForm.dateFormat"
                :items="['No Preference', 'Preference']"
              />
            </v-col>
          </v-row>
          <v-row no-gutters class="pb-3">
            <v-col cols="12" sm="4">
              <v-label class="form-label"> Default </v-label>
            </v-col>
            <v-col cols="12" sm="8">
              <v-radio-group inline>
                <v-radio label="On" value="on" />
                <v-radio label="Off" value="off" class="ml-3" />
              </v-radio-group>
            </v-col>
          </v-row>
          <v-row no-gutters class="pb-3">
            <v-col cols="12" sm="4">
              <v-label class="form-label"> Choose option default </v-label>
            </v-col>
            <v-col cols="12" sm="8">
              <v-checkbox label="Tell me" />
              <v-checkbox label="Open e-mail" />
              <v-checkbox label="Show default" />
            </v-col>
          </v-row>
          <v-row no-gutters class="pb-3">
            <v-col offset-sm="4">
              <v-btn type="submit"> Save Changes </v-btn>
            </v-col>
          </v-row>
        </v-card-item>
      </v-card>
    </v-col>
  </v-row>
</template>
