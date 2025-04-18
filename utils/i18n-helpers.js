/**
 * Helper utilities for i18n translation loading and management
 */
import { isRTLLanguage, applyRTLToDocument } from './rtl-config';

// Global supported languages list
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'العربية' },
  { code: 'hi', name: 'हिन्दी' }
];

/**
 * Force loads translation messages for a specific locale
 * This uses multiple approaches to ensure messages are loaded correctly
 */
export const forceLoadMessages = async (i18n, locale) => {
  if (!i18n || !locale) {
    console.error('[i18n-helpers] Missing i18n instance or locale');
    return false;
  }
  
  try {
    // First try the built-in functions if available
    if (typeof i18n.loadLocaleMessages === 'function') {
      await i18n.loadLocaleMessages(locale);
    }
    
    // Then try to reload resources
    if (typeof i18n.reloadResources === 'function') {
      await i18n.reloadResources(locale);
    }
    
    // Check if messages were actually loaded
    if (i18n.messages && i18n.messages.value) {
      const hasMessages = i18n.messages.value[locale] && 
                        Object.keys(i18n.messages.value[locale]).length > 0;
      
      // If still no messages, try direct import with multiple possible paths
      if (!hasMessages) {
        try {
          // Try multiple possible paths for the locale file
          let messages = null;
          let importError = null;
          
          // The paths to try in sequence
          const pathsToTry = [
            // Path from config (this should be the correct one)
            `@/locales/${locale}.json`,
            // Legacy path
            `@/i18n/locales/${locale}.json`,
            // Absolute paths
            `/locales/${locale}.json`,
            `/i18n/locales/${locale}.json`
          ];
          
          // Try each path until one succeeds
          for (const path of pathsToTry) {
            try {
              const imported = await import(/* @vite-ignore */ path);
              if (imported && imported.default) {
                messages = imported;
                break;
              }
            } catch (error) {
              // Save error but continue to next path
              importError = error;
            }
          }
          
          // If no import succeeded and we have an error, log it
          if (!messages || !messages.default) {
            console.warn('[i18n-helpers] Could not import locale file through any path');
            // Don't throw here, just return false to indicate failure
            return false;
          }
          
          if (typeof i18n.setLocaleMessage === 'function' && messages && messages.default) {
            i18n.setLocaleMessage(locale, messages.default);
            
            // Ensure nested paths are properly flattened or normalized
            ensureMessageStructure(i18n, locale);
            
            return true;
          }
        } catch (importError) {
          console.error('[i18n-helpers] Error importing locale file:', importError);
          return false;
        }
      } else {
        // Even if messages loaded normally, ensure message structure
        ensureMessageStructure(i18n, locale);
        return true;
      }
    }
    
    return true;
  } catch (error) {
    console.error('[i18n-helpers] Error loading messages:', error);
    return false;
  }
};

/**
 * Apply RTL direction settings for languages that require it
 * Now using the centralized RTL configuration
 */
export const applyRTLDirection = (locale) => {
  // Use the centralized function from rtl-config.js
  return applyRTLToDocument(locale);
};

/**
 * Ensures that nested message structure is properly handled
 * This addresses issues where dot notation keys might not be accessing nested objects correctly
 */
export const ensureMessageStructure = (i18n, locale) => {
  if (!i18n || !i18n.messages || !i18n.messages.value || !i18n.messages.value[locale]) {
    console.warn('[i18n-helpers] Cannot ensure message structure - missing messages');
    return;
  }
  
  const messages = i18n.messages.value[locale];
  
  // Simple check to make sure we have messages
  if (!(messages && typeof messages === 'object')) {
    console.error('[i18n-helpers] Invalid message structure for', locale);
  }
};

/**
 * Preload all available locales to ensure they're ready for use
 * This can be called during app initialization to avoid loading delays
 */
export const preloadAllLocales = async (i18n) => {
  if (!i18n || !i18n.availableLocales) {
    console.error('[i18n-helpers] Missing i18n instance or availableLocales');
    return false;
  }
  
  const results = {};
  
  for (const locale of i18n.availableLocales) {
    try {
      const success = await forceLoadMessages(i18n, locale);
      results[locale] = success;
      
      if (!success) {
        console.warn(`[i18n-helpers] Failed to preload locale: ${locale}`);
      }
    } catch (error) {
      console.error(`[i18n-helpers] Error preloading locale ${locale}:`, error);
      results[locale] = false;
    }
  }
  
  return results;
};

/**
 * Generate a path with the appropriate locale prefix
 * For default language (en), returns path without prefix
 * For other languages, adds the locale as a prefix
 * 
 * @param {string} path - The path to localize
 * @param {string} locale - The current locale
 * @returns {string} - The localized path
 */
export const getLocalizedPath = (path, locale) => {
  // Handle empty or undefined values
  if (!path) return '/';
  if (!locale) return path;
  
  // Default locale (en) has no prefix
  if (locale === 'en') {
    return path.startsWith('/') ? path : `/${path}`;
  }
  
  // For non-default locales, add the prefix
  const localePath = path.startsWith('/') ? path : `/${path}`;
  return `/${locale}${localePath}`; 
};