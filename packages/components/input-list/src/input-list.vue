<template>
  <div :class="[ns.b(), ns.m(size)]">
    <el-form-item
      v-for="(item, index) in list"
      :key="`${rowKeyBase}-${index}`"
      :prop="rowProp(index)"
      :rules="rules"
      :class="ns.e('row')"
    >
      <div :class="ns.e('row-content')">
        <slot name="default" :index="index" :value="item">
          <el-input
            :model-value="item"
            :placeholder="placeholder"
            :size="size"
            :disabled="disabled"
            @update:model-value="(v: string) => updateRow(index, v)"
          />
        </slot>
        <button
          v-if="list.length > min"
          type="button"
          :class="ns.e('delete')"
          :disabled="disabled"
          @click="removeRow(index)"
        >
          删除
        </button>
      </div>
    </el-form-item>
    <button
      v-if="list.length < max"
      type="button"
      :class="ns.e('add')"
      :disabled="disabled"
      @click="addRow"
    >
      {{ addText }}
    </button>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useId, useNamespace } from '@element-plus/hooks'
import { ElFormItem } from '@element-plus/components/form'
import { ElInput } from '@element-plus/components/input'
import { inputListEmits } from './input-list'

import type { InputListProps } from './input-list'

defineOptions({
  name: 'ElInputList',
})

const props = withDefaults(defineProps<InputListProps>(), {
  placeholder: '',
  min: 1,
  max: Infinity,
  addText: '+ 点击新增',
  size: undefined,
  disabled: false,
  rules: undefined,
  prop: undefined,
})
const emit = defineEmits(inputListEmits)

const ns = useNamespace('input-list')
const uid = useId()
const rowKeyBase = `input-list-${uid.value}`

const list = computed<string[]>(() => props.modelValue ?? [])

const rowProp = (index: number): string | undefined =>
  props.prop ? `${props.prop}[${index}]` : undefined

const updateRow = (index: number, value: string) => {
  const next = [...list.value]
  next[index] = value
  emit('update:modelValue', next)
}

const addRow = () => {
  const next = [...list.value, '']
  emit('update:modelValue', next)
  emit('change', next)
}

const removeRow = (index: number) => {
  if (list.value.length <= props.min) return
  const next = list.value.filter((_, i) => i !== index)
  emit('update:modelValue', next)
  emit('change', next)
}
</script>
