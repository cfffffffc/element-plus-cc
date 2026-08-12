import { isArray, isString } from '@element-plus/utils'

import type { ComponentSize } from '@element-plus/constants'
import type { FormItemRule } from '@element-plus/components/form'
import type { Arrayable } from '@element-plus/utils'

export interface InputListProps {
  modelValue: string[]
  placeholder?: string
  min?: number
  max?: number
  addText?: string
  size?: ComponentSize
  disabled?: boolean
  rules?: Arrayable<FormItemRule>
  prop?: string
}

export const inputListEmits = {
  'update:modelValue': (value: string[]) =>
    isArray(value) && value.every(isString),
  change: (value: string[]) => isArray(value) && value.every(isString),
}
export type InputListEmits = typeof inputListEmits
