<script setup>
import { useRTL } from '~/composables/useRTL';

defineOptions({
  inheritAttrs: false,
});

// Use our centralized RTL utils instead of implementing locally
const { isRTL, textStyles } = useRTL();

const elementId = computed(() => {
  const attrs = useAttrs();
  const _elementIdToken = attrs.id || attrs.label;

  return _elementIdToken
    ? `global-text-field-${_elementIdToken}-${Math.random().toString(36).slice(2, 7)}`
    : undefined;
});

const label = computed(() => useAttrs().label);
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
      :style="textStyles"
    >
      <template v-for="(_, name) in $slots" #[name]="slotProps">
        <slot :name="name" v-bind="slotProps || {}" />
      </template>
    </VTextField>
  </div>
</template>
