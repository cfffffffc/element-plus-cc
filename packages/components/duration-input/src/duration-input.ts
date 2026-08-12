import type { ComponentSize } from '@element-plus/constants'

export interface DurationValue {
  h: number | null
  m: number | null
  s: number | null
}

export interface DurationInputProps {
  modelValue?: DurationValue | null
  placeholder?: string
  size?: ComponentSize
  disabled?: boolean
}

export const durationInputEmits = {
  'update:modelValue': (value: DurationValue | null) =>
    value === null || (typeof value === 'object' && 'h' in value),
}
export type DurationInputEmits = typeof durationInputEmits
