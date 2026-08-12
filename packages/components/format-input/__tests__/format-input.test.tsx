import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, test } from 'vitest'
import { inputFormatRules } from '../src/formats'
import FormatInput from '../src/format-input.vue'
import ElPhoneInput from '../src/phone-input.vue'

describe('format 规则', () => {
  test('phone: 3-4-4 空格分组，parser 还原纯数字', () => {
    const rule = inputFormatRules.phone
    expect(rule.formatter('13556997554')).toBe('135 5699 7554')
    expect(rule.formatter('1355699')).toBe('135 5699')
    expect(rule.parser('135 5699 7554')).toBe('13556997554')
    expect(rule.parser('13a5b5')).toBe('1355')
  })

  test('bankAccount: 每 4 位空格分组', () => {
    const rule = inputFormatRules.bankAccount
    expect(rule.formatter('6222021234543210')).toBe('6222 0212 3454 3210')
    expect(rule.parser('6222 0212 3454 3210')).toBe('6222021234543210')
  })

  test('idCard: 6-8-4 分组，末位 X 大写', () => {
    const rule = inputFormatRules.idCard
    expect(rule.formatter('11010119900307451X')).toBe('110101 19900307 451X')
    expect(rule.parser('110101 19900307 451x')).toBe('11010119900307451X')
  })

  test('amount: 千分位，保留两位小数', () => {
    const rule = inputFormatRules.amount
    expect(rule.formatter('122123322')).toBe('122,123,322')
    expect(rule.formatter('122123322.00')).toBe('122,123,322.00')
    expect(rule.parser('122,123,322.00')).toBe('122123322.00')
    expect(rule.parser('755.5')).toBe('755.5')
  })

  test('非法字符被忽略', () => {
    const rule = inputFormatRules.phone
    expect(rule.formatter('13-5-5')).toBe('135 5')
    expect(rule.formatter('')).toBe('')
  })
})

describe('FormatInput.vue', () => {
  test('渲染内部 input 并透传 placeholder', () => {
    const wrapper = mount(() => (
      <FormatInput
        format="phone"
        placeholder="请输入手机号"
        modelValue="13556997554"
      />
    ))

    const input = wrapper.find('input')
    expect(input.exists()).toBe(true)
    expect(input.attributes('placeholder')).toBe('请输入手机号')
    expect(input.element.value).toBe('135 5699 7554')
  })

  test('输入时 parser 还原原始值并 emit', async () => {
    const value = ref<string | number | null>('')
    const wrapper = mount(() => (
      <FormatInput
        format="phone"
        modelValue={value.value}
        onUpdate:modelValue={(v) => (value.value = v)}
      />
    ))

    const input = wrapper.find('input')
    await input.setValue('13800138000')
    expect(value.value).toBe('13800138000')
  })

  test('别名组件 phone 预置 format', () => {
    const wrapper = mount(() => <ElPhoneInput modelValue="13556997554" />)
    expect(wrapper.find('input').element.value).toBe('135 5699 7554')
  })
})
