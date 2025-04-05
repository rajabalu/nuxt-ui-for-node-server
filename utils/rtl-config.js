/**
 * RTL Configuration
 * Centralized configuration for RTL language support throughout the application
 */

// List of languages that require RTL (Right-to-Left) display
export const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

/**
 * Check if a given locale requires RTL
 * @param {string} locale - The locale code to check
 * @returns {boolean} - True if the locale requires RTL, false otherwise
 */
export const isRTLLanguage = (locale) => {
  if (!locale) return false;
  return RTL_LANGUAGES.includes(locale);
};

/**
 * Apply RTL-specific CSS classes and attributes to the document
 * @param {string} locale - The current locale code
 * @returns {boolean} - Whether RTL was applied
 */
export const applyRTLToDocument = (locale) => {
  const isRTL = isRTLLanguage(locale);
  
  if (typeof document !== 'undefined') {
    // Apply to both document and html element for broader compatibility
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
    
    // Use a consistent class name 'rtl' for all RTL styling
    if (isRTL) {
      document.documentElement.classList.add('rtl');
      document.body.classList.add('rtl');
    } else {
      document.documentElement.classList.remove('rtl');
      document.body.classList.remove('rtl');
    }
  }
  
  return isRTL;
}; 