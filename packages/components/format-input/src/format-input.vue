<template>
  <el-input
    :class="ns.b()"
    :model-value="displayValue"
    :placeholder="placeholder"
    :clearable="clearable"
    :size="size"
    :disabled="disabled"
    :maxlength="rule?.maxlength"
    :formatter="rule?.formatter"
    :parser="rule?.parser"
    @update:model-value="handleUpdate"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useNamespace } from '@element-plus/hooks'
import { ElInput } from '@element-plus/components/input'
import { formatInputEmits } from './format-input'
import { inputFormatRules } from './formats'

import type { FormatInputProps } from './format-input'

defineOptions({
  name: 'ElFormatInput',
})

const props = withDefaults(defineProps<FormatInputProps>(), {
  modelValue: '',
  placeholder: '',
  clearable: false,
  size: undefined,
  disabled: false,
})
const emit = defineEmits(formatInputEmits)

const ns = useNamespace('format-input')

const rule = computed(() => inputFormatRules[props.format])

const displayValue = computed(() =>
  props.modelValue == null ? '' : String(props.modelValue)
)

const handleUpdate = (value: string) => {
  emit('update:modelValue', value)
}
</script>
