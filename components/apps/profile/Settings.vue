<script setup>
import { nextTick } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useI18n } from 'vue-i18n';
import { useUserPreferencesHelper } from '~/composables/useUserPreferencesHelper';
import { useGlobal } from '~/stores/global';
import { useTheme } from 'vuetify';

const { t } = useI18n();
const { alphaValidator, emailValidator, requiredValidator, passwordValidator, confirmedValidator } =
  useValidators();

const refBassicForm = ref();
const refEmailVForm = ref();
const refPasswordVForm = ref();

// Get user data from auth store
const authStore = useAuthStore();
const globalStore = useGlobal();
const theme = useTheme();

// Use computed property for profile image to ensure it updates when auth store changes
const profileImage = computed(() => {
  return authStore.user?.photo?.path || '/images/avatar/avatar-fallback.jpg';
});

const isUploading = ref(false);
const isEmailSubmitting = ref(false);
const isPasswordSubmitting = ref(false);
const showSuccessAlert = ref(false);
const successMessage = ref('');
const showErrorAlert = ref(false);
const errorMessage = ref('');
const currentTab = ref('tab-1');

// Avatar selection
const selectedAvatarId = ref(globalStore.selectedAvatarId);
const availableAvatars = computed(() => globalStore.AVAILABLE_AVATARS);

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

// Add dialog state
const showPasswordConfirmDialog = ref(false);

// Add preferences helper
const preferencesHelper = useUserPreferencesHelper();
const showSyncMessage = ref(false);
const isPreferencesSubmitting = ref(false);

// Initialize locale with current language
const { locale } = useI18n();
const currentLocale = ref(locale.value);

// Function to show sync message temporarily
const displaySyncMessage = () => {
  if (preferencesHelper.syncMessage.value) {
    showSyncMessage.value = true;
    setTimeout(() => {
      showSyncMessage.value = false;
    }, 3000); // Hide after 3 seconds
  }
};

// Theme toggle function
const toggleLightDarkMode = async (newTheme) => {
  try {
    // Update the theme in global store
    globalStore.datkMode = newTheme === 'dark';
    
    // Apply theme change through theme config
    theme.global.name.value = newTheme;
    
    // Save theme preference to store using our helper
    await preferencesHelper.saveThemePreference(newTheme);
    
    // Show sync message
    displaySyncMessage();
  } catch (error) {
    console.error('Error toggling theme:', error);
    showErrorAlert.value = true;
    errorMessage.value = `Failed to update theme: ${error.message}`;
  }
};

// Language options
const languages = [
  { code: "en", name: "English" },
  { code: "fr", name: "Français" },
  { code: "ar", name: "العربية" }
];

// Language change handler
const handleLanguageChange = async (lang) => {
  try {
    const currentTabValue = currentTab.value;
    currentLocale.value = lang;
    
    await preferencesHelper.saveLanguagePreference(lang);
    
    displaySyncMessage();
    
    await nextTick();
    
    currentTab.value = currentTabValue;
  } catch (error) {
    console.error('Error changing language:', error);
    showErrorAlert.value = true;
    errorMessage.value = `Failed to update language: ${error.message}`;
  }
};

// Avatar selection handler
const handleAvatarChange = async (avatarId) => {
  try {
    selectedAvatarId.value = avatarId;
    globalStore.setAvatar(avatarId);
    
    // Use the preferences helper to save the avatar preference
    await preferencesHelper.saveAvatarPreference(avatarId);
    
    // Show success message
    showSuccessAlert.value = true;
    successMessage.value = t('settings.avatarUpdated');
  } catch (error) {
    console.error('Error changing avatar:', error);
    showErrorAlert.value = true;
    errorMessage.value = `Failed to update avatar: ${error.message}`;
  }
};

// Save preferences
const savePreferences = async () => {
  try {
    isPreferencesSubmitting.value = true;
    
    // Get API and base URL from composables
    const nuxtApp = useNuxtApp();
    const api = nuxtApp.$api;
    
    if (!api) {
      throw new Error('API not available');
    }
    
    // Prepare preferences data with AdditionalSettings
    const additionalSettings = {
      avatarId: selectedAvatarId.value
      // Add any additional settings here in the future
    };
    
    const preferencesData = {
      theme: theme.global.name.value,
      language: currentLocale.value,
      AdditionalSettings: JSON.stringify(additionalSettings)
    };
    
    // Save preferences to server
    const response = await api.patch('user-preferences', preferencesData);
    
    if (response.success) {
      showSuccessAlert.value = true;
      successMessage.value = t('settings.preferencesUpdated');
    } else {
      throw new Error(response.error || 'Failed to update preferences');
    }
  } catch (error) {
    console.error('Error updating preferences:', error);
    showErrorAlert.value = true;
    errorMessage.value = `Failed to update preferences: ${error.message}`;
  } finally {
    isPreferencesSubmitting.value = false;
  }
};

// Save all preferences
const onPreferences = async () => {
  await savePreferences();
};

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
    showSuccessAlert.value = true;
    successMessage.value = "Profile photo updated successfully!";
    
  } catch (error) {
    console.error('Error uploading photo:', error);
    showErrorAlert.value = true;
    errorMessage.value = `Failed to upload photo: ${error.message}`;
  } finally {
    isUploading.value = false;
  }
};

const onBasic = () => {
  refBassicForm.value?.validate().then(({ valid: isValid }) => {
    if (isValid) {
      showSuccessAlert.value = true;
      successMessage.value = "Your information updated successfully";
    }
  });
};

const onPassword = async () => {
  refPasswordVForm.value?.validate().then(async ({ valid: isValid }) => {
    if (isValid) {
      // Show confirmation dialog instead of proceeding directly
      showPasswordConfirmDialog.value = true;
    }
  });
};

// New method to handle the actual password change after confirmation
const confirmPasswordChange = async () => {
  try {
    // Close the dialog and show loading
    showPasswordConfirmDialog.value = false;
    isPasswordSubmitting.value = true;
    
    // Get API and base URL from composables
    const nuxtApp = useNuxtApp();
    const api = nuxtApp.$api;
    
    if (!api) {
      throw new Error('API not available');
    }
    
    // Get the configured base URL
    const baseUrl = api.getBaseUrl ? api.getBaseUrl() : 'http://localhost:8000/api/v1/';
    
    // Update password
    const updateUrl = `${baseUrl}auth/me`;
    const response = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        password: passwordForm.newPassword,
        oldPassword: passwordForm.currentPassword
      })
    });
    
    // Parse response
    const data = await response.json();
    
    if (!response.ok) {
      // Handle various error types
      if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (response.status === 422) {
        throw new Error(data.message || 'Current password is incorrect or new password does not meet requirements.');
      } else {
        throw new Error(`Password update failed with status: ${response.status}`);
      }
    }
    
    // Show success message
    showSuccessAlert.value = true;
    successMessage.value = "Your password has been changed successfully. For security reasons, you will be logged out.";
    
    // Clear the password fields and reset validation
    passwordForm.currentPassword = "";
    passwordForm.newPassword = "";
    passwordForm.confirmPassword = "";
    refPasswordVForm.value?.reset();
    
    // Log the user out after a short delay to allow them to see the success message
    setTimeout(() => {
      authStore.logout();
    }, 3000);
    
  } catch (error) {
    console.error('Error updating password:', error);
    showErrorAlert.value = true;
    errorMessage.value = `Failed to update password: ${error.message}`;
  } finally {
    // Reset loading state
    isPasswordSubmitting.value = false;
  }
};

const onEmail = async () => {
  refEmailVForm.value?.validate().then(async ({ valid: isValid }) => {
    if (isValid) {
      try {
        isEmailSubmitting.value = true;
        
        // Get API and base URL from composables
        const nuxtApp = useNuxtApp();
        const api = nuxtApp.$api;
        
        if (!api) {
          throw new Error('API not available');
        }
        
        // Get the configured base URL
        const baseUrl = api.getBaseUrl ? api.getBaseUrl() : 'http://localhost:8000/api/v1/';
        
        // Update email
        const updateUrl = `${baseUrl}auth/me`;
        const response = await fetch(updateUrl, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${authStore.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: email.value
          })
        });
        
        if (!response.ok) {
          throw new Error(`Email update failed with status: ${response.status}`);
        }
        
        // Show success message instead of redirecting
        showSuccessAlert.value = true;
        successMessage.value = "A verification email has been sent to your new address. Please continue using your current email until you complete the verification process.";
        
        // Clear the email field and reset validation
        email.value = "";
        refEmailVForm.value?.reset();
      } catch (error) {
        console.error('Error updating email:', error);
        showErrorAlert.value = true;
        errorMessage.value = `Failed to update email: ${error.message}`;
      } finally {
        isEmailSubmitting.value = false;
      }
    }
  });
};
</script>
<template>
  <!-- Success Alert -->
  <v-alert
    v-model="showSuccessAlert"
    color="success"
    variant="tonal"
    closable
    class="mb-4"
    border="start"
    :title="t('common.success')"
  >
    <template v-slot:prepend>
      <v-icon icon="tabler-check" />
    </template>
    {{ successMessage }}
  </v-alert>

  <!-- Error Alert -->
  <v-alert
    v-model="showErrorAlert"
    color="error"
    variant="tonal"
    closable
    class="mb-4"
    border="start"
    :title="t('common.error')"
  >
    <template v-slot:prepend>
      <v-icon icon="tabler-alert-circle" />
    </template>
    {{ errorMessage }}
  </v-alert>

  <!-- Password Change Confirmation Dialog -->
  <v-dialog v-model="showPasswordConfirmDialog" max-width="500">
    <v-card>
      <v-card-title class="text-h5 bg-primary text-white pa-4">
        {{ t('settings.confirmPasswordChange') }}
      </v-card-title>
      <v-card-text class="pa-4 pt-6">
        <p>{{ t('settings.logoutAfterPasswordChange') }}</p>
        <p class="mt-2">{{ t('settings.confirmContinue') }}</p>
      </v-card-text>
      <v-card-actions class="pa-4 pt-0">
        <v-spacer></v-spacer>
        <v-btn color="grey-darken-1" variant="text" @click="showPasswordConfirmDialog = false">
          {{ t('common.cancel') }}
        </v-btn>
        <v-btn color="primary" @click="confirmPasswordChange" :loading="isPasswordSubmitting">
          {{ t('settings.yesChangePassword') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Profile Settings with Vertical Tabs -->
  <v-card>
    <div class="d-flex">
      <!-- In RTL mode, the tabs should be on the right and content on the left -->
      <div :class="{ 'order-2': $i18n.locale === 'ar' }">
        <v-tabs v-model="currentTab" direction="vertical">
          <v-tab value="tab-1">
            <v-icon start icon="tabler-user" />
            {{ t('settings.basicInformation') }}
          </v-tab>
          <v-tab value="tab-2">
            <v-icon start icon="tabler-mail" />
            {{ t('settings.changeEmail') }}
          </v-tab>
          <v-tab value="tab-3">
            <v-icon start icon="tabler-lock" />
            {{ t('settings.changePassword') }}
          </v-tab>
          <v-tab value="tab-4">
            <v-icon start icon="tabler-settings" />
            {{ t('settings.preferences') }}
          </v-tab>
        </v-tabs>
      </div>

      <v-window v-model="currentTab" :class="[$i18n.locale === 'ar' ? 'ms-0 me-3 order-1' : 'ms-3']" class="flex-grow-1">
        <!-- Basic Information Tab -->
        <v-window-item value="tab-1">
          <v-card-item>
            <v-form ref="refBassicForm" @submit.prevent="onBasic">
              <v-row no-gutters class="pb-3">
                <v-col cols="12" sm="4">
                  <v-label class="form-label">{{ t('settings.fullName') }}</v-label>
                </v-col>
                <v-col cols="12" sm="8">
                  <v-row>
                    <v-col cols="12" sm="6" class="pb-0">
                      <GlobalsTextField
                        v-model="basicForm.firstName"
                        :rules="[requiredValidator, alphaValidator]"
                        :error-messages="errors.firstName"
                        :placeholder="t('common.firstName')"
                        readonly
                      />
                    </v-col>
                    <v-col cols="12" sm="6">
                      <GlobalsTextField
                        v-model="basicForm.lastName"
                        :rules="[requiredValidator, alphaValidator]"
                        :error-messages="errors.lastName"
                        :placeholder="t('common.lastName')"
                        readonly
                      />
                    </v-col>
                  </v-row>
                </v-col>
              </v-row>

              <v-row no-gutters class="pb-3">
                <v-col cols="12" sm="4">
                  <v-label class="form-label"> {{ t('common.email') }} </v-label>
                </v-col>
                <v-col cols="12" sm="8">
                  <GlobalsTextField
                    v-model="basicForm.email"
                    type="email"
                    :rules="[requiredValidator, emailValidator]"
                    :error-messages="errors.email"
                    :placeholder="t('auth.emailPlaceholder')"
                    readonly
                  />
                </v-col>
              </v-row>

              <v-row align="center">
                <v-col cols="12" sm="4">
                  <v-label class="form-label"> {{ t('settings.avatar') }} </v-label>
                </v-col>
                <v-col cols="12" sm="8" class="d-flex align-center gap-4">
                  <v-avatar size="56">
                    <VImg :src="profileImage" :key="authStore.user?.photo?.path || 'default'" />
                  </v-avatar>
                  <input type="file" ref="file" style="display: none" @change="onProfileChange" accept="image/*" />
                </v-col>
              </v-row>

              <v-row align="center">
                <v-col cols="12" sm="4"></v-col>
                <v-col cols="12" sm="8" class="d-flex align-center gap-4">
                  <v-btn variant="outlined" color="secondary" @click="$refs.file.click()" :loading="isUploading">
                    {{ t('settings.uploadPhoto') }}
                  </v-btn>
                </v-col>
              </v-row>
            </v-form>
          </v-card-item>
        </v-window-item>

        <!-- Change Email Tab -->
        <v-window-item value="tab-2">
          <v-card-item>
            <v-form ref="refEmailVForm" @submit.prevent="onEmail">
              <v-row no-gutters class="pb-3">
                <v-col cols="12" sm="4">
                  <v-label class="form-label"> {{ t('settings.newEmail') }} </v-label>
                </v-col>
                <v-col cols="12" sm="8">
                  <GlobalsTextField
                    v-model="email"
                    type="email"
                    :rules="[requiredValidator, emailValidator]"
                    :error-messages="errors.email"
                    :placeholder="t('auth.emailPlaceholder')"
                  />
                  
                  <div class="mt-4">
                    <p class="text-body-2 font-weight-8">{{ t('settings.emailVerificationProcess') }}:</p>
                    <p class="text-body-1 mb-4">{{ t('settings.pleaseNote') }}:</p>
                    <ul>
                      <li class="text-body-2 py-0">{{ t('settings.verificationEmailWillBeSent') }}</li>
                      <li class="text-body-2 py-0">{{ t('settings.mustVerifyEmail') }}</li>
                      <li class="text-body-2 py-0">{{ t('settings.afterVerificationCanLogin') }}</li>
                      <li class="text-body-2 py-0">{{ t('settings.oldEmailRemains') }}</li>
                    </ul>
                  </div>
                </v-col>
              </v-row>
            </v-form>
          </v-card-item>
        </v-window-item>

        <!-- Change Password Tab -->
        <v-window-item value="tab-3">
          <v-card-item>
            <v-form ref="refPasswordVForm" @submit.prevent="onPassword">
              <v-row no-gutters class="pb-3">
                <v-col cols="12" sm="4">
                  <v-label class="form-label"> {{ t('settings.currentPassword') }} </v-label>
                </v-col>
                <v-col cols="12" sm="8">
                  <GlobalsTextField
                    v-model="passwordForm.currentPassword"
                    :rules="[requiredValidator, passwordValidator]"
                    :error-messages="errors.currentPassword"
                    :placeholder="t('settings.enterCurrentPassword')"
                    type="password"
                  />
                </v-col>
              </v-row>
              <v-row no-gutters class="pb-3">
                <v-col cols="12" sm="4">
                  <v-label class="form-label"> {{ t('settings.newPassword') }} </v-label>
                </v-col>
                <v-col cols="12" sm="8">
                  <GlobalsTextField
                    v-model="passwordForm.newPassword"
                    :rules="[requiredValidator, passwordValidator]"
                    :error-messages="errors.newPassword"
                    :placeholder="t('settings.enterNewPassword')"
                    type="password"
                  />
                </v-col>
              </v-row>
              <v-row no-gutters class="pb-3">
                <v-col cols="12" sm="4">
                  <v-label class="form-label"> {{ t('settings.confirmNewPassword') }} </v-label>
                </v-col>
                <v-col cols="12" sm="8">
                  <GlobalsTextField
                    v-model="passwordForm.confirmPassword"
                    :rules="[
                      requiredValidator,
                      confirmedValidator(passwordForm.confirmPassword, passwordForm.newPassword),
                    ]"
                    :error-messages="errors.confirmPassword"
                    :placeholder="t('settings.enterNewPassword')"
                    type="password"
                  />

                  <div class="mt-4">
                    <p class="text-body-2 font-weight-8">{{ t('passwordRequirements') }}:</p>
                    <p class="text-body-1 mb-4">{{ t('requirementsMustBeMet') }}:</p>
                    <ul>
                      <li class="text-body-2 py-0">{{ t('minimumLength') }}</li>
                      <li class="text-body-2 py-0">{{ t('lowercase') }}</li>
                      <li class="text-body-2 py-0">{{ t('uppercase') }}</li>
                      <li class="text-body-2 py-0">{{ t('special') }}</li>
                    </ul>
                  </div>
                </v-col>
              </v-row>
            </v-form>
          </v-card-item>
        </v-window-item>

        <!-- Preferences Tab -->
        <v-window-item value="tab-4">
          <v-card-item>
            <v-form>
              <!-- Theme Preferences -->
              <v-row no-gutters class="pb-3">
                <v-col cols="12" sm="4">
                  <v-label class="form-label">{{ t('settings.theme') }}</v-label>
                </v-col>
                <v-col cols="12" sm="8">
                  <v-radio-group
                    v-model="theme.global.name.value"
                    @update:model-value="toggleLightDarkMode"
                    class="d-flex flex-row"
                  >
                    <v-radio
                      value="light"
                      :label="t('settings.lightMode')"
                      color="primary"
                      class="mr-4"
                    />
                    <v-radio
                      value="dark"
                      :label="t('settings.darkMode')"
                      color="primary"
                    />
                  </v-radio-group>
                </v-col>
              </v-row>

              <!-- Language Preferences -->
              <v-row no-gutters class="pb-3">
                <v-col cols="12" sm="4">
                  <v-label class="form-label">{{ t('settings.language') }}</v-label>
                </v-col>
                <v-col cols="12" sm="8">
                  <v-select
                    v-model="currentLocale"
                    :items="languages"
                    item-title="name"
                    item-value="code"
                    :label="t('settings.selectLanguage')"
                    @update:model-value="handleLanguageChange"
                  />
                </v-col>
              </v-row>

              <!-- Avatar Preferences -->
              <v-row no-gutters class="pb-3">
                <v-col cols="12" sm="4">
                  <v-label class="form-label">{{ t('settings.avatar') }}</v-label>
                </v-col>
                <v-col cols="12" sm="8">
                  <!-- Avatar Gallery -->
                  <div class="avatar-gallery mb-4">
                    <v-card variant="outlined" class="pa-3">
                      <p class="text-body-2 mb-3">{{ t('settings.selectAvatarInfo') }}</p>
                      <div class="d-flex flex-wrap gap-3">
                        <div 
                          v-for="avatar in availableAvatars" 
                          :key="avatar.id" 
                          class="avatar-option"
                          :class="{'selected': selectedAvatarId === avatar.id}"
                          @click="handleAvatarChange(avatar.id)"
                        >
                          <v-avatar size="80" :class="{'border-primary': selectedAvatarId === avatar.id}">
                            <v-img :src="avatar.thumbnail" :alt="avatar.name" />
                          </v-avatar>
                          <span class="text-caption text-center d-block mt-1">{{ avatar.name }}</span>
                        </div>
                      </div>
                      <p class="text-caption text-grey mt-3">
                        {{ t('settings.avatarUsedInChat') }}
                      </p>
                    </v-card>
                  </div>
                </v-col>
              </v-row>
            </v-form>
          </v-card-item>
        </v-window-item>

      </v-window>
    </div>
  </v-card>

  <!-- Sync Message Snackbar -->
  <v-snackbar
    v-model="showSyncMessage"
    :timeout="3000"
    color="success"
    location="top"
  >
    {{ preferencesHelper.syncMessage.value }}
    <template v-slot:actions>
      <v-btn
        color="white"
        variant="text"
        @click="showSyncMessage = false"
      >
        {{ t('common.close') }}
      </v-btn>
    </template>
  </v-snackbar>
</template>

<style lang="scss" scoped>
.form-label {
  font-size: 0.9rem;
  margin-top: 8px;
}

.rtl-container {
  direction: rtl;
}

.avatar-option {
  cursor: pointer;
  padding: 10px;
  border-radius: 8px;
  text-align: center;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(var(--v-theme-primary), 0.1);
  }

  &.selected {
    background-color: rgba(var(--v-theme-primary), 0.15);
  }
}

.border-primary {
  border: 3px solid rgb(var(--v-theme-primary));
}

.avatar-gallery {
  max-width: 100%;
  overflow: hidden;
}

.gap-3 {
  gap: 12px;
}
</style>
