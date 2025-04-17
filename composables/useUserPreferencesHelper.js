import { useUserPreferences } from '@/stores/userPreferences';
import { useGlobal } from '@/stores/global';
import { useI18n } from 'vue-i18n';
import { watch, onMounted, nextTick, ref } from 'vue';
import { themeConfig } from '@/composables/theme';
import { useNuxtApp } from '#app';
import { forceLoadMessages, applyRTLDirection } from '@/utils/i18n-helpers';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '~/stores/auth';

/**
 * Composable to handle user preferences (theme, language, and avatar)
 * Safe to use within component setup functions
 */
export const useUserPreferencesHelper = () => {
  // These composables are now safely used inside a composable
  const userPreferencesStore = useUserPreferences();
  const globalStore = useGlobal();
  const { locale, t } = useI18n();
  const theme = themeConfig();
  const nuxtApp = useNuxtApp();
  const router = useRouter();
  const route = useRoute();
  const authStore = useAuthStore();
  const syncMessage = ref('');
  
  // Add a flag to track if a change is coming from the server
  const isServerInitiatedChange = ref(false);
  
  // Save user preferences to server
  const savePreferencesToServer = async (preferences) => {
    if (!authStore.isAuthenticated) {
      return { success: false, message: 'Not authenticated' };
    }
    
    try {
      const api = nuxtApp.$api;
      if (!api) {
        console.error('[useUserPreferencesHelper] API not available');
        return { success: false, message: 'API not available' };
      }
      
      // Make API call to update preferences
      const response = await api.patch('user-preferences', preferences);
      
      if (response.success) {
        syncMessage.value = 'Preferences updated successfully';
        return { success: true, message: 'Preferences updated successfully' };
      } else {
        console.error('[useUserPreferencesHelper] Error saving preferences to server:', response.error);
        syncMessage.value = 'Failed to update preferences';
        return { success: false, message: response.error || 'Failed to update preferences' };
      }
    } catch (error) {
      console.error('[useUserPreferencesHelper] Error saving preferences to server:', error);
      syncMessage.value = 'Failed to update preferences';
      return { success: false, message: 'An unexpected error occurred' };
    }
  };
  
  // Apply theme from preferences
  const applyTheme = (themeName) => {
    if (!themeName) {
      return;
    }
    
    // Only change if different from current
    const isDarkMode = themeName === 'dark';
    const currentIsDark = globalStore.datkMode;
    
    if (globalStore.datkMode !== isDarkMode) {
      globalStore.datkMode = isDarkMode;
    }
    
    theme.currentTheme.value = themeName;
    theme.themeChangeMode(false); // Apply without toggling
  };
  
  // Apply language from preferences WITH router support
  const applyLanguage = async (lang) => {
    if (!lang) {
      return;
    }
    
    try {
      // Force load messages first using our helper
      await forceLoadMessages(nuxtApp.$i18n, lang);
      
      if (locale.value !== lang) {
        // Prepare for routing - Get current path
        const currentPath = route.fullPath;
        const currentLocale = locale.value;
        const isDefaultLocale = lang === 'en';
        
        // Extract path without current locale prefix
        let pathWithoutLocale = currentPath;
        if (currentLocale !== 'en' && pathWithoutLocale.startsWith(`/${currentLocale}/`)) {
          pathWithoutLocale = pathWithoutLocale.substring(currentLocale.length + 1);
        }
        
        // Build new path
        const newPath = isDefaultLocale 
          ? pathWithoutLocale 
          : `/${lang}${pathWithoutLocale.startsWith('/') ? pathWithoutLocale : '/' + pathWithoutLocale}`;
        
        // Apply RTL direction before navigation for better UX
        applyRTLDirection(lang);
        
        // Use router to navigate to new locale path
        await router.push(newPath);
        
        // Router navigation will trigger locale change, but let's test
        await nextTick();
      } else {
        // Still apply RTL direction to ensure it's correct
        applyRTLDirection(lang);
      }
    } catch (error) {
      console.error('[useUserPreferencesHelper] Error applying language:', error);
    }
  };
  
  // Apply avatar from preferences
  const applyAvatar = (avatarId) => {
    if (avatarId !== undefined && avatarId !== null) {
      // Set avatar in global store
      globalStore.setAvatar(Number(avatarId));
    }
  };
  
  // Initialize preferences when component is mounted
  const initializePreferences = () => {
    onMounted(async () => {
      // Apply language first (this can affect UI layout for RTL)
      if (userPreferencesStore.language) {
        await applyLanguage(userPreferencesStore.language);
      }
      
      // Then apply theme
      if (userPreferencesStore.theme) {
        applyTheme(userPreferencesStore.theme);
      }
      
      // Apply avatar if it exists in additionalSettings
      const avatarId = userPreferencesStore.getAdditionalSetting('avatarId');
      if (avatarId !== null && avatarId !== undefined) {
        applyAvatar(avatarId);
      }
    });
    
    // Watch for theme changes
    watch(() => userPreferencesStore.theme, (newTheme) => {
      applyTheme(newTheme);
    });
    
    // Watch for language changes
    watch(() => userPreferencesStore.language, (newLanguage) => {
      // Mark this as a server-initiated change to prevent feedback loop
      isServerInitiatedChange.value = true;
      applyLanguage(newLanguage);
      // Reset the flag after a short delay
      setTimeout(() => {
        isServerInitiatedChange.value = false;
      }, 500);
    });
    
    // Watch for avatar changes in the global store
    watch(() => globalStore.selectedAvatarId, (newAvatarId) => {
      // Only save if not being updated from the server/preferences load
      if (!isServerInitiatedChange.value) {
        saveAvatarPreference(newAvatarId);
      }
    }, { deep: true });
    
    // Also watch the locale directly in case it's changed elsewhere
    watch(locale, (newLocale) => {
      // Check both our local flag and the global window flag
      const isServerChange = isServerInitiatedChange.value || 
                            (process.client && window.__isServerPreferenceChange);
      
      // Only save if different from what's in the store and not a server-initiated change
      if (newLocale !== userPreferencesStore.language && !isServerChange) {
        saveLanguagePreference(newLocale);
      }
    });
  };
  
  // Save theme preference
  const saveThemePreference = async (themeName) => {
    userPreferencesStore.setTheme(themeName);
    
    // Sync with server if user is authenticated
    if (authStore.isAuthenticated) {
      await savePreferencesToServer({ theme: themeName });
    }
  };
  
  // Save language preference
  const saveLanguagePreference = async (lang) => {
    userPreferencesStore.setLanguage(lang);
    
    // Sync with server if user is authenticated
    if (authStore.isAuthenticated) {
      await savePreferencesToServer({ language: lang });
    }
  };
  
  // Save avatar preference
  const saveAvatarPreference = async (avatarId) => {
    // Store in additionalSettings
    userPreferencesStore.setAdditionalSetting('avatarId', avatarId);
    
    // Sync with server if user is authenticated
    if (authStore.isAuthenticated) {
      // Format as expected by the API
      const additionalSettings = {
        ...userPreferencesStore.additionalSettings
      };
      
      await savePreferencesToServer({
        AdditionalSettings: JSON.stringify(additionalSettings)
      });
    }
  };
  
  // Ensure locale is consistent with preferences
  const syncLocaleWithPreferences = async () => {
    const savedLanguage = userPreferencesStore.language;
    if (savedLanguage && locale.value !== savedLanguage) {
      // Force load messages first
      await forceLoadMessages(nuxtApp.$i18n, savedLanguage);
      
      // Apply language
      await applyLanguage(savedLanguage);
    }
  };
  
  // For components to use
  return {
    applyTheme,
    applyLanguage,
    applyAvatar,
    initializePreferences,
    saveThemePreference,
    saveLanguagePreference,
    saveAvatarPreference,
    syncLocaleWithPreferences,
    currentTheme: () => userPreferencesStore.theme,
    currentLanguage: () => userPreferencesStore.language,
    currentAvatar: () => userPreferencesStore.getAdditionalSetting('avatarId'),
    syncMessage,
    isServerInitiatedChange
  };
};

// Add Hindi to the language list
const languageList = {
  'en': 'English',
  'hi': 'Hindi',
  'es': 'Spanish',
  'de': 'German'
};