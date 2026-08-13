<template>
  <div
    ref="rootRef"
    :class="[
      ns.b(),
      ns.m(size),
      ns.is('error', !!errorMessage),
      ns.is('disabled', disabled),
    ]"
  >
    <div
      v-for="seg in segments"
      :key="seg.key"
      :class="[ns.e('item'), ns.is('active', activeSeg === seg.key)]"
      @click="focusSegment(seg.key)"
    >
      <input
        :ref="(el) => setSegRef(seg.key, el)"
        :class="ns.e('input')"
        :value="display(seg.key)"
        :placeholder="placeholder"
        :disabled="disabled"
        inputmode="numeric"
        @focus="handleFocus(seg.key)"
        @blur="handleBlur"
        @input="handleInput(seg.key, $event)"
      />
      <span :class="ns.e('unit')">{{ seg.unit }}</span>
    </div>
    <div v-if="errorMessage" :class="ns.e('error')" role="alert">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useNamespace } from '@element-plus/hooks'
import { durationInputEmits } from './duration-input'

import type { DurationInputProps, DurationValue } from './duration-input'

defineOptions({
  name: 'ElDurationInput',
})

const props = withDefaults(defineProps<DurationInputProps>(), {
  modelValue: null,
  placeholder: '请输入',
  size: undefined,
  disabled: false,
})
const emit = defineEmits(durationInputEmits)

const ns = useNamespace('duration-input')

const segments = [
  { key: 'h', unit: '时' },
  { key: 'm', unit: '分' },
  { key: 's', unit: '秒' },
] as const

type SegKey = (typeof segments)[number]['key']

const rootRef = ref<HTMLElement>()
const activeSeg = ref<SegKey>()
const errorMessage = ref('')
const segInputs = ref<Record<string, HTMLInputElement | null>>({})

const current = computed<DurationValue>(
  () => props.modelValue ?? { h: null, m: null, s: null }
)

const setSegRef = (key: SegKey, el: unknown) => {
  segInputs.value[key] = el as HTMLInputElement
}

const display = (key: SegKey) => {
  const v = current.value[key]
  return v === null ? '' : String(v)
}

const focusSegment = (key: SegKey) => {
  segInputs.value[key]?.focus()
}

const handleFocus = (key: SegKey) => {
  activeSeg.value = key
  // 值为 0 的段聚焦时自动清空，便于直接输入新值
  if (current.value[key] === 0) {
    emit('update:modelValue', { ...current.value, [key]: null })
  }
}

const handleInput = (key: SegKey, evt: Event) => {
  if (errorMessage.value) errorMessage.value = ''
  const raw = (evt.target as HTMLInputElement).value.replace(/\D/g, '')
  const num = raw === '' ? null : Number(raw)
  emit('update:modelValue', { ...current.value, [key]: num })
}

const handleBlur = (evt: FocusEvent) => {
  // 焦点在同一组件内的段之间移动时不触发整组钳制/补零，避免打断跨段编辑
  const related = evt.relatedTarget as HTMLElement | null
  if (related && rootRef.value?.contains(related)) return
  let next = { ...current.value }
  let error = ''
  if (next.h != null && next.h > 99) {
    next.h = 99
    error = '小时数不能超过 99'
  }
  if (next.m != null && next.m > 59) {
    next.m = 59
    error = error || '分钟数不能超过 59'
  }
  if (next.s != null && next.s > 59) {
    next.s = 59
    error = error || '秒数不能超过 59'
  }
  // 失焦自动补 0
  next = { h: next.h ?? 0, m: next.m ?? 0, s: next.s ?? 0 }
  errorMessage.value = error
  emit('update:modelValue', next)
  activeSeg.value = undefined
}
</script>
