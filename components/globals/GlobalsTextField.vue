<template>
  <div :class="$attrs.class">
    <v-label v-if="label" :for="elementId" class="mb-1 form-label" :text="label" />
    <VTextField
      v-model="sanitizedValue"
      v-bind="{
        ...$attrs,
        class: null,
        label: undefined,
        id: elementId,
      }"
      :style="textStyles"
      @update:model-value="handleInput"
    >
      <template v-for="(_, name) in $slots" #[name]="slotProps">
        <slot :name="name" v-bind="slotProps || {}" />
      </template>
    </VTextField>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useRTL } from '~/composables/useRTL';
import { useFormSanitization } from '~/composables/useFormSanitization';

defineOptions({
  inheritAttrs: false,
});

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  }
});

const emit = defineEmits(['update:modelValue']);

// RTL support
const { isRTL, textStyles } = useRTL();

// Sanitization
const { sanitizeField } = useFormSanitization();
const sanitizedValue = ref(props.modelValue);

// Watch for external modelValue changes
watch(() => props.modelValue, (newValue) => {
  sanitizedValue.value = newValue;
});

// Custom ID generation
const elementId = computed(() => {
  const attrs = useAttrs();
  const _elementIdToken = attrs.id || attrs.label;

  return _elementIdToken
    ? `global-text-field-${_elementIdToken}-${Math.random().toString(36).slice(2, 7)}`
    : undefined;
});

const label = computed(() => useAttrs().label);

// Handle input changes with sanitization
const handleInput = (value) => {
  const sanitized = sanitizeField(value);
  sanitizedValue.value = sanitized;
  emit('update:modelValue', sanitized);
};
</script> 