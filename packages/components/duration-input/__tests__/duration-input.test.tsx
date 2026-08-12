import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, test } from 'vitest'
import DurationInput from '../src/duration-input.vue'

import type { DurationValue } from '../src/duration-input'

describe('DurationInput.vue', () => {
  test('渲染时/分/秒三段输入', () => {
    const wrapper = mount(() => <DurationInput modelValue={null} />)

    expect(wrapper.findAll('.el-duration-input__input')).toHaveLength(3)
    const units = wrapper
      .findAll('.el-duration-input__unit')
      .map((n) => n.text())
    expect(units).toEqual(['时', '分', '秒'])
  })

  test('输入秒段 emit {h,m,s}', async () => {
    const value = ref<DurationValue | null>(null)
    const wrapper = mount(() => (
      <DurationInput
        modelValue={value.value}
        onUpdate:modelValue={(v) => (value.value = v)}
      />
    ))

    const inputs = wrapper.findAll('.el-duration-input__input')
    await inputs[2].setValue('45')
    expect(value.value).toEqual({ h: null, m: null, s: 45 })
  })

  test('失焦自动补 0', async () => {
    const value = ref<DurationValue | null>({ h: null, m: null, s: 45 })
    const wrapper = mount(() => (
      <DurationInput
        modelValue={value.value}
        onUpdate:modelValue={(v) => (value.value = v)}
      />
    ))

    const inputs = wrapper.findAll('.el-duration-input__input')
    await inputs[2].trigger('blur')
    expect(value.value).toEqual({ h: 0, m: 0, s: 45 })
  })

  test('分/秒超过 59 失焦钳制并提示', async () => {
    const value = ref<DurationValue | null>({ h: null, m: 75, s: 0 })
    const wrapper = mount(() => (
      <DurationInput
        modelValue={value.value}
        onUpdate:modelValue={(v) => (value.value = v)}
      />
    ))

    const inputs = wrapper.findAll('.el-duration-input__input')
    await inputs[1].trigger('blur')

    // 单次 blur 内完成：钳制 m=59 + 空段补 0 + 错误提示
    expect(value.value).toEqual({ h: 0, m: 59, s: 0 })
    expect(wrapper.find('.el-duration-input__error').exists()).toBe(true)
  })

  test('值为 0 的段聚焦时自动清空', async () => {
    const value = ref<DurationValue | null>({ h: 0, m: 5, s: 0 })
    const wrapper = mount(() => (
      <DurationInput
        modelValue={value.value}
        onUpdate:modelValue={(v) => (value.value = v)}
      />
    ))

    const inputs = wrapper.findAll('.el-duration-input__input')
    await inputs[0].trigger('focus')
    expect(value.value).toEqual({ h: null, m: 5, s: 0 })
  })

  test('点击段区域聚焦对应 input', async () => {
    const wrapper = mount(() => <DurationInput modelValue={null} />, {
      attachTo: document.body,
    })

    const items = wrapper.findAll('.el-duration-input__item')
    await items[1].trigger('click')
    expect(document.activeElement).toBe(
      wrapper.findAll('.el-duration-input__input')[1].element
    )

    wrapper.unmount()
  })
})
