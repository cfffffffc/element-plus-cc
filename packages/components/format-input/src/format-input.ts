import { isString } from '@element-plus/utils'

import type { InputFormat } from './formats'

export interface FormatInputProps {
  modelValue?: string | number | null
  format: InputFormat
  placeholder?: string
  clearable?: boolean
  size?: 'large' | 'default' | 'small'
  disabled?: boolean
}

export const formatInputEmits = {
  'update:modelValue': (value: string | number | null) =>
    value === null || isString(value) || typeof value === 'number',
}
export type FormatInputEmits = typeof formatInputEmits
