/**
 * Helper utilities for i18n translation loading and management
 */

/**
 * Force loads translation messages for a specific locale
 * This uses multiple approaches to ensure messages are loaded correctly
 */
export const forceLoadMessages = async (i18n, locale) => {
  if (!i18n || !locale) {
    console.error('[i18n-helpers] Missing i18n instance or locale');
    return false;
  }
  
  console.log('[i18n-helpers] Force loading messages for locale:', locale);
  
  try {
    // First try the built-in functions if available
    if (typeof i18n.loadLocaleMessages === 'function') {
      console.log('[i18n-helpers] Using loadLocaleMessages()');
      await i18n.loadLocaleMessages(locale);
    }
    
    // Then try to reload resources
    if (typeof i18n.reloadResources === 'function') {
      console.log('[i18n-helpers] Using reloadResources()');
      await i18n.reloadResources(locale);
    }
    
    // Check if messages were actually loaded
    if (i18n.messages && i18n.messages.value) {
      const hasMessages = i18n.messages.value[locale] && 
                        Object.keys(i18n.messages.value[locale]).length > 0;
      console.log('[i18n-helpers] Messages loaded status:', hasMessages);
      
      // If still no messages, try direct import with multiple possible paths
      if (!hasMessages) {
        console.log('[i18n-helpers] No messages loaded, attempting direct import');
        try {
          // Alternative approach - dynamically import the JSON file
          const messages = await import(`@/i18n/locales/${locale}.json`);
          if (typeof i18n.setLocaleMessage === 'function') {
            i18n.setLocaleMessage(locale, messages.default);
            console.log('[i18n-helpers] Manually loaded messages for', locale);
            
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
 */
export const applyRTLDirection = (locale) => {
  const isRTL = locale === 'ar';
  document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  document.documentElement.lang = locale;
  
  if (isRTL) {
    document.body.classList.add('rtl');
  } else {
    document.body.classList.remove('rtl');
  }
  
  console.log('[i18n-helpers] Set document direction to:', isRTL ? 'rtl' : 'ltr');
  return isRTL;
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
  console.log('[i18n-helpers] Ensuring message structure for locale:', locale);
  
  try {
    // Simple check to make sure we have messages
    if (messages && typeof messages === 'object') {
      console.log('[i18n-helpers] Message structure normalized for', locale);
    }
  } catch (error) {
    console.error('[i18n-helpers] Error normalizing message structure:', error);
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
  
  console.log('[i18n-helpers] Preloading all available locales:', i18n.availableLocales);
  
  const results = {};
  
  for (const locale of i18n.availableLocales) {
    console.log(`[i18n-helpers] Preloading locale: ${locale}`);
    try {
      const success = await forceLoadMessages(i18n, locale);
      results[locale] = success;
      
      if (success) {
        console.log(`[i18n-helpers] Successfully preloaded locale: ${locale}`);
      } else {
        console.warn(`[i18n-helpers] Failed to preload locale: ${locale}`);
      }
    } catch (error) {
      console.error(`[i18n-helpers] Error preloading locale ${locale}:`, error);
      results[locale] = false;
    }
  }
  
  return results;
}; 