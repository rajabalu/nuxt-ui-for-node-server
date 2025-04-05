import { computed, ref, readonly, watch } from 'vue';
import { useI18n } from 'vue-i18n';

type FlexDirection = 'row' | 'row-reverse' | 'column' | 'column-reverse';

/**
 * Composable for managing RTL-related functionality throughout the application
 * Provides reactive properties and helper functions for RTL support
 */
export function useRTL() {
  // Create a ref with a default value
  const isRTLRef = ref(false);
  
  // List of RTL languages - can be expanded as needed
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  
  // Try to get the locale if i18n is available
  try {
    const { locale } = useI18n();
    
    // Update the isRTL value reactively based on locale
    isRTLRef.value = rtlLanguages.includes(locale.value);
    
    // Watch for locale changes
    if (locale && 'value' in locale) {
      watch(locale, (newLocale) => {
        isRTLRef.value = rtlLanguages.includes(newLocale);
      });
    }
  } catch (error) {
    // If i18n is not available (e.g., during plugin initialization)
    // Just use the default value (false = LTR)
    console.warn('RTL: i18n not available, defaulting to LTR', error);
  }
  
  // Create a readonly computed property for isRTL
  const isRTL = computed(() => isRTLRef.value);
  
  // Computed object with common text alignment styles based on RTL context
  const textStyles = computed(() => ({
    textAlign: isRTL.value ? 'right' : 'left',
    direction: isRTL.value ? 'rtl' : 'ltr'
  }));
  
  // Computed object with margin/padding styles that should flip based on RTL
  const spacingStyles = computed(() => {
    if (isRTL.value) {
      return {
        marginLeft: 'marginRight',
        marginRight: 'marginLeft',
        paddingLeft: 'paddingRight',
        paddingRight: 'paddingLeft'
      };
    }
    return {};
  });
  
  // Computed dynamic classes that can be used with v-bind
  const rtlClasses = computed(() => ({
    'rtl-enabled': isRTL.value,
    'ltr-enabled': !isRTL.value
  }));
  
  // Function to conditionally flip a CSS property based on RTL
  const flipProperty = <T>(ltrValue: T, rtlValue: T): T => {
    return isRTL.value ? rtlValue : ltrValue;
  };
  
  // Function to get appropriate CSS transform for RTL (useful for icons, etc)
  const getTransform = (shouldFlip = true): string => {
    return shouldFlip && isRTL.value ? 'scaleX(-1)' : '';
  };
  
  // Helper function to conditionally apply RTL-specific classes to an element
  const applyRTLClass = (baseClass: string): string => {
    return isRTL.value ? `${baseClass}-rtl` : baseClass;
  };
  
  // Create a special utility for layout direction
  const layoutDirection = computed(() => ({
    flexDirection: isRTL.value ? 'row-reverse' : 'row' as FlexDirection
  }));
  
  // Create a special utility for order manipulation
  const getOrder = (ltrOrder: number, rtlOrder: number): number => {
    return isRTL.value ? rtlOrder : ltrOrder;
  };
  
  // Return all utilities
  return {
    isRTL,
    textStyles,
    spacingStyles,
    rtlClasses,
    flipProperty,
    getTransform,
    applyRTLClass,
    layoutDirection,
    getOrder
  };
} 