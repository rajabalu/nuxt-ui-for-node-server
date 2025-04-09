import DOMPurify from 'dompurify';

/**
 * Composable for handling message sanitization
 * @returns {Object} - Sanitization methods
 */
export const useSanitization = () => {
  /**
   * Sanitize a message for display
   * @param {String} message - The message to sanitize
   * @returns {String} - The sanitized message
   */
  const sanitizeForDisplay = (message) => {
    return DOMPurify.sanitize(message, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'code', 'pre', 'br', 'p', 'ul', 'ol', 'li', 'a'],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
      ADD_ATTR: {'target': ['_blank', 'noopener', 'noreferrer']}
    });
  };

  /**
   * Sanitize a message for storage/sending
   * @param {String} message - The message to sanitize
   * @returns {String} - The sanitized message
   */
  const sanitizeForStorage = (message) => {
    return DOMPurify.sanitize(message, {
      ALLOWED_TAGS: [], // Strip all HTML tags
      ALLOWED_ATTR: [] // Strip all attributes
    });
  };

  return {
    sanitizeForDisplay,
    sanitizeForStorage
  };
}; 