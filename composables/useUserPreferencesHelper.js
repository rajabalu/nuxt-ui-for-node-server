import { useUserPreferences } from '@/stores/userPreferences';
import { useGlobal } from '@/stores/global';
import { useI18n } from 'vue-i18n';
import { watch, onMounted, nextTick } from 'vue';
import { themeConfig } from '@/composables/theme';
import { useNuxtApp } from '#app';
import { forceLoadMessages, applyRTLDirection } from '@/utils/i18n-helpers';
import { useRouter, useRoute } from 'vue-router';

/**
 * Composable to handle user preferences (theme and language)
 * Safe to use within component setup functions
 */
export const useUserPreferencesHelper = () => {
  console.log('[useUserPreferencesHelper] Composable called');
  
  // These composables are now safely used inside a composable
  const userPreferencesStore = useUserPreferences();
  const globalStore = useGlobal();
  const { locale, t } = useI18n();
  const theme = themeConfig();
  const nuxtApp = useNuxtApp();
  const router = useRouter();
  const route = useRoute();
  
  // Apply theme from preferences
  const applyTheme = (themeName) => {
    console.log('[useUserPreferencesHelper] Applying theme:', themeName);
    if (!themeName) {
      console.log('[useUserPreferencesHelper] No theme to apply, skipping');
      return;
    }
    
    // Only change if different from current
    const isDarkMode = themeName === 'dark';
    const currentIsDark = globalStore.datkMode;
    console.log('[useUserPreferencesHelper] Current dark mode:', currentIsDark, 'Setting to:', isDarkMode);
    
    if (globalStore.datkMode !== isDarkMode) {
      globalStore.datkMode = isDarkMode;
    }
    
    theme.currentTheme.value = themeName;
    theme.themeChangeMode(false); // Apply without toggling
    
    console.log('[useUserPreferencesHelper] Theme applied:', themeName);
  };
  
  // Apply language from preferences WITH router support
  const applyLanguage = async (lang) => {
    console.log('[useUserPreferencesHelper] Applying language:', lang);
    if (!lang) {
      console.log('[useUserPreferencesHelper] No language to apply, skipping');
      return;
    }
    
    // Only change if different from current
    console.log('[useUserPreferencesHelper] Current locale:', locale.value, 'Setting to:', lang);
    
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
        
        console.log(`[useUserPreferencesHelper] Redirecting from ${currentPath} to ${newPath}`);
        
        // Apply RTL direction before navigation for better UX
        applyRTLDirection(lang);
        
        // Use router to navigate to new locale path
        await router.push(newPath);
        
        // Router navigation will trigger locale change, but let's test
        await nextTick();
        try {
          console.log('[useUserPreferencesHelper] Testing translation:', t('settings'));
        } catch (error) {
          console.warn('[useUserPreferencesHelper] Error accessing translation:', error);
        }
        
        console.log('[useUserPreferencesHelper] Language applied, RTL:', lang === 'ar');
      } else {
        console.log('[useUserPreferencesHelper] Language already set, no change needed');
        
        // Still apply RTL direction to ensure it's correct
        applyRTLDirection(lang);
      }
    } catch (error) {
      console.error('[useUserPreferencesHelper] Error applying language:', error);
    }
  };
  
  // Initialize preferences when component is mounted
  const initializePreferences = () => {
    console.log('[useUserPreferencesHelper] Initializing preferences');
    
    onMounted(async () => {
      console.log('[useUserPreferencesHelper] Component mounted');
      console.log('[useUserPreferencesHelper] Current preferences:', {
        theme: userPreferencesStore.theme,
        language: userPreferencesStore.language
      });
      
      // Apply language first (this can affect UI layout for RTL)
      if (userPreferencesStore.language) {
        await applyLanguage(userPreferencesStore.language);
      }
      
      // Then apply theme
      if (userPreferencesStore.theme) {
        applyTheme(userPreferencesStore.theme);
      }
    });
    
    // Watch for theme changes
    watch(() => userPreferencesStore.theme, (newTheme) => {
      console.log('[useUserPreferencesHelper] Theme changed in store:', newTheme);
      applyTheme(newTheme);
    });
    
    // Watch for language changes
    watch(() => userPreferencesStore.language, (newLanguage) => {
      console.log('[useUserPreferencesHelper] Language changed in store:', newLanguage);
      applyLanguage(newLanguage);
    });
    
    // Also watch the locale directly in case it's changed elsewhere
    watch(locale, (newLocale) => {
      console.log('[useUserPreferencesHelper] Locale changed externally to:', newLocale);
      // Only save if different from what's in the store
      if (newLocale !== userPreferencesStore.language) {
        saveLanguagePreference(newLocale);
      }
    });
  };
  
  // Save theme preference
  const saveThemePreference = (themeName) => {
    console.log('[useUserPreferencesHelper] Saving theme preference:', themeName);
    userPreferencesStore.setTheme(themeName);
  };
  
  // Save language preference
  const saveLanguagePreference = (lang) => {
    console.log('[useUserPreferencesHelper] Saving language preference:', lang);
    userPreferencesStore.setLanguage(lang);
  };
  
  // Ensure locale is consistent with preferences
  const syncLocaleWithPreferences = async () => {
    const savedLanguage = userPreferencesStore.language;
    if (savedLanguage && locale.value !== savedLanguage) {
      console.log('[useUserPreferencesHelper] Syncing locale with preferences:', savedLanguage);
      
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
    initializePreferences,
    saveThemePreference,
    saveLanguagePreference,
    syncLocaleWithPreferences,
    currentTheme: () => userPreferencesStore.theme,
    currentLanguage: () => userPreferencesStore.language
  };
}; 