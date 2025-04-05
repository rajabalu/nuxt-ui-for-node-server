<script setup>
import { useI18n } from 'vue-i18n';

defineOptions({
  inheritAttrs: false,
});

const { locale } = useI18n();

const isRTL = computed(() => locale.value === 'ar');

const elementId = computed(() => {
  const attrs = useAttrs();
  const _elementIdToken = attrs.id || attrs.label;

  return _elementIdToken
    ? `global-text-field-${_elementIdToken}-${Math.random().toString(36).slice(2, 7)}`
    : undefined;
});

const label = computed(() => useAttrs().label);

// Computed styles to apply to the text field based on RTL context
const rtlStyles = computed(() => {
  return isRTL.value ? { textAlign: 'right', direction: 'rtl' } : {};
});
</script>

<template>
  <div :class="$attrs.class">
    <v-label v-if="label" :for="elementId" class="mb-1 form-label" :text="label" />
    <VTextField
      v-bind="{
        ...$attrs,
        class: null,
        label: undefined,
        id: elementId,
      }"
      :style="rtlStyles"
    >
      <template v-for="(_, name) in $slots" #[name]="slotProps">
        <slot :name="name" v-bind="slotProps || {}" />
      </template>
    </VTextField>
  </div>
</template>
