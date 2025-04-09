import { ref } from 'vue';
import { useSanitization } from './chat/useSanitization';

/**
 * Composable for handling form field sanitization
 * @returns {Object} - Form sanitization methods
 */
export const useFormSanitization = () => {
  const { sanitizeForStorage } = useSanitization();

  /**
   * Sanitize a form field value
   * @param {String} value - The value to sanitize
   * @returns {String} - The sanitized value
   */
  const sanitizeField = (value) => {
    if (typeof value !== 'string') return value;
    return sanitizeForStorage(value);
  };

  /**
   * Create a sanitized reactive reference for a form field
   * @param {String} initialValue - Initial value for the field
   * @returns {Object} - Object with value and update method
   */
  const createSanitizedField = (initialValue = '') => {
    const value = ref(initialValue);

    const updateValue = (newValue) => {
      value.value = sanitizeField(newValue);
    };

    return {
      value,
      updateValue
    };
  };

  return {
    sanitizeField,
    createSanitizedField
  };
}; 