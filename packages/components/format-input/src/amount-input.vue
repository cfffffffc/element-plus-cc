<script lang="ts" setup>
import { useAttrs } from 'vue'
import FormatInput from './format-input.vue'

defineOptions({
  name: 'ElAmountInput',
  inheritAttrs: false,
})

const props = defineProps<{
  modelValue?: string | number | null
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | null): void
}>()
const attrs = useAttrs()
</script>

<template>
  <FormatInput
    v-bind="attrs"
    :model-value="props.modelValue ?? ''"
    format="amount"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>
