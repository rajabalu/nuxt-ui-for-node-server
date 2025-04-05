import { computed, ref, readonly, watch, onMounted, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';

type FlexDirection = 'row' | 'row-reverse' | 'column' | 'column-reverse';

// Create a singleton instance for the RTL utilities
let _rtlInstance: ReturnType<typeof createRTLUtils> | null = null;

/**
 * Private function to create the RTL utilities
 */
function createRTLUtils() {
  console.log('[useRTL] Creating new RTL utility instance');
  
  // Create a ref with a default value
  const isRTLRef = ref(false);
  const isInitializedRef = ref(false);
  
  // List of RTL languages - can be expanded as needed
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  
  // Function to initialize with i18n - can be called later when i18n is available
  const initWithI18n = () => {
    try {
      console.log('[useRTL] Attempting to use i18n');
      const { locale } = useI18n();
      console.log(`[useRTL] Successfully got i18n locale: ${locale.value}`);
      
      // Update the isRTL value reactively based on locale
      isRTLRef.value = rtlLanguages.includes(locale.value);
      isInitializedRef.value = true;
      
      // Watch for locale changes
      if (locale && 'value' in locale) {
        watch(locale, (newLocale) => {
          console.log(`[useRTL] Locale changed to: ${newLocale}`);
          isRTLRef.value = rtlLanguages.includes(newLocale);
        });
      }
      
      return true;
    } catch (error) {
      // If i18n is not available (e.g., during plugin initialization)
      // Just use the default value (false = LTR)
      console.warn('[useRTL] i18n not available, defaulting to LTR', error);
      return false;
    }
  };
  
  // Try to initialize immediately, but don't worry if it fails
  initWithI18n();
  
  // Try again after a delay if not initialized (for plugins)
  if (!isInitializedRef.value && typeof window !== 'undefined') {
    nextTick(() => {
      setTimeout(() => {
        if (!isInitializedRef.value) {
          console.log('[useRTL] Retrying i18n initialization after delay');
          initWithI18n();
        }
      }, 100);
    });
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
  
  // Return all utilities and the init function
  return {
    isRTL,
    textStyles,
    spacingStyles,
    rtlClasses,
    flipProperty,
    getTransform,
    applyRTLClass,
    layoutDirection,
    getOrder,
    initWithI18n, // Expose this so it can be called explicitly
    isInitialized: isInitializedRef
  };
}

/**
 * Composable for managing RTL-related functionality throughout the application
 * Provides reactive properties and helper functions for RTL support
 */
export function useRTL() {
  // Use the singleton instance or create a new one
  if (!_rtlInstance) {
    _rtlInstance = createRTLUtils();
  } else {
    console.log('[useRTL] Reusing existing RTL utility instance');
  }
  
  // Try to initialize if not already initialized
  if (!_rtlInstance.isInitialized.value) {
    console.log('[useRTL] Trying to initialize with i18n during useRTL call');
    _rtlInstance.initWithI18n();
  }
  
  return _rtlInstance;
} 