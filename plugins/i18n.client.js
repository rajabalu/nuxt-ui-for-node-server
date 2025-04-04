import { forceLoadMessages, applyRTLDirection, ensureMessageStructure, preloadAllLocales } from '@/utils/i18n-helpers';

/**
 * i18n client-side initialization plugin
 * Loads the user's language preference from localStorage and applies it
 * before the application fully renders
 */
export default defineNuxtPlugin(async (nuxtApp) => {
  if (process.client && nuxtApp.$i18n) {
    console.log('[i18n] Client plugin executing');
    
    // Load language preference from localStorage
    try {
      // Check both localStorage keys for backward compatibility
      let savedLanguage = localStorage.getItem('user_language');
      if (!savedLanguage) {
        savedLanguage = localStorage.getItem('app_language');
      }
      
      if (savedLanguage) {
        console.log('[i18n] Found saved language in localStorage:', savedLanguage);
        
        // Force load messages for the saved language
        await forceLoadMessages(nuxtApp.$i18n, savedLanguage);
        
        // Set the locale after messages are loaded
        nuxtApp.$i18n.locale.value = savedLanguage;
        console.log('[i18n] Set locale to:', savedLanguage);
        
        // Apply RTL direction if needed
        applyRTLDirection(savedLanguage);
        
        // Debug logging
        console.log('[i18n] Available locales:', nuxtApp.$i18n.availableLocales);
        console.log('[i18n] Current locale:', nuxtApp.$i18n.locale.value);
      } else {
        console.log('[i18n] No saved language found, using default');
        
        // Still ensure proper message structure for the default locale
        const defaultLocale = nuxtApp.$i18n.locale.value;
        if (defaultLocale) {
          console.log('[i18n] Ensuring message structure for default locale:', defaultLocale);
          // Force load messages for default locale too
          await forceLoadMessages(nuxtApp.$i18n, defaultLocale);
        }
      }
      
      // Register a helper function on the nuxtApp for other components to use
      nuxtApp.provide('ensureI18nMessages', async (locale) => {
        console.log('[i18n] Helper function called to ensure messages for:', locale);
        await forceLoadMessages(nuxtApp.$i18n, locale);
      });
      
    } catch (error) {
      console.error('[i18n] Error in i18n plugin:', error);
    }
  }
}); 