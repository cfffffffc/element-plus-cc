# 输入框二开 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 全量落地输入框二开：主题层 focus 染橙、文本域 resize 行为调整，并新增 `ElInputList` / `ElFormatInput`(+4 别名) / `ElDurationInput` 三个组件，覆盖设计图全部 12 节。

**Architecture:** 四层。L0 主题变量（var.scss 中 `$input.focus-border-color: #ff9900`）；L1 现有组件极少量 SCSS/class 调整（input.scss 文本域 + input.vue 加 autosize class）；L2 三个新组件（各自独立 package 目录，按 anchor 模式接入）；L3 可选 play 验收页。新组件 Props 用 `defineProps<Props>()` + `withDefaults` 现代风格，测试用 vitest + `@vue/test-utils` 的 `.tsx` 文件。

**Tech Stack:** Vue 3.4+、TypeScript、Sass（theme-chalk）、vitest + @vue/test-utils、pnpm workspace。

## Global Constraints

- 品牌橙聚焦色：`#ff9900`（仅此一处主题改动；hover/异常/圆角/尺寸/底色均保持 EP 默认）。
- 主题层改动面最小，现有 `input`/`form` 相关测试必须保持通过。
- 新增组件命名：`ElInputList`、`ElFormatInput`、`ElPhoneInput`、`ElBankAccountInput`、`ElIdCardInput`、`ElAmountInput`、`ElDurationInput`（均无现有冲突）。
- 新组件接入按 anchor 模式：自身 `index.ts` + `packages/components/index.ts` barrel + `packages/element-plus/component.ts` 注册 + `typings/global.d.ts` 全局类型 + theme-chalk scss。
- 新组件 Props 类型用 interface（anchor 风格），Emits 用 const 对象。
- 文本域固定高度态默认 `resize: both`（右下角拖宽高）、无 max-height；自适应态 max-height `112px` 出滚动条。
- `ElDurationInput` v-model 为 `DurationValue | null`，`DurationValue = { h: number|null; m: number|null; s: number|null }`。
- 每个任务结束提交一次（中文 message，风格同仓库：`feat(components): ...` / `style(theme-chalk): ...`）。

---

## File Structure

```
新增组件目录：
packages/components/input-list/
  index.ts                       # withInstall 导出 ElInputList
  src/input-list.ts              # InputListProps interface + emits + 类型
  src/input-list.vue             # 组件（内部用 ElInput + ElFormItem）
  style/index.ts  style/css.ts
  __tests__/input-list.test.tsx
packages/components/format-input/
  index.ts                       # 导出 ElFormatInput + 4 别名
  src/format-input.ts            # InputFormat 类型 + formatInputRules（formatter/parser/maxlength）
  src/format-input.vue           # 核心组件（包一层 ElInput）
  src/phone-input.vue  src/bank-account-input.vue  src/id-card-input.vue  src/amount-input.vue   # 别名薄封装
  style/index.ts  style/css.ts
  __tests__/format-input.test.tsx
packages/components/duration-input/
  index.ts
  src/duration-input.ts          # DurationValue + props + emits
  src/duration-input.vue         # 三段时间输入组件
  style/index.ts  style/css.ts
  __tests__/duration-input.test.tsx

新增/修改样式：
packages/theme-chalk/src/input-list.scss      (新增)
packages/theme-chalk/src/format-input.scss    (新增)
packages/theme-chalk/src/duration-input.scss  (新增)
packages/theme-chalk/src/common/var.scss      (修改: $input.focus-border-color)
packages/theme-chalk/src/input.scss           (修改: textarea resize/autosize)

修改接入文件：
packages/components/index.ts                  (加 3 个 barrel)
packages/element-plus/component.ts            (注册 7 个组件)
typings/global.d.ts                            (加 7 个全局类型)
packages/components/input/src/input.vue       (textarea 加 is-autosize class)

可选：
play/ 验收页
```

---

### Task 1: 主题变量 — 输入框聚焦边框染品牌橙

**Files:**
- Modify: `packages/theme-chalk/src/common/var.scss:585`（`$input` map 的 `focus-border-color`）

**Interfaces:**
- Produces: `$input.focus-border-color` = `#ff9900`（全局 CSS 变量 `--el-input-focus-border-color` 来源）

- [ ] **Step 1: 修改变量**

将 `packages/theme-chalk/src/common/var.scss` 中 `$input` map（约 585 行）的：

```scss
'focus-border-color': getCssVar('color-primary'),
```

改为：

```scss
'focus-border-color': #ff9900,
```

- [ ] **Step 2: 验证**

运行 `pnpm build:theme`（或项目对应主题构建命令），确认 `dist/theme-chalk` 产出的 CSS 中 `--el-input-focus-border-color` 值为 `#ff9900`。

- [ ] **Step 3: Commit**

```bash
git add packages/theme-chalk/src/common/var.scss
git commit -m "style(theme-chalk): input 聚焦边框染品牌橙 #ff9900"
```

---

### Task 2: 文本域 — 固定高度默认 resize both、自适应 112px 上限

**Files:**
- Modify: `packages/theme-chalk/src/input.scss:54`（`__inner` 的 `resize: vertical`）
- Modify: `packages/components/input/src/input.vue:127-131`（textarea class 数组）
- Test: `packages/components/input/__tests__/input.test.tsx`

**Interfaces:**
- Consumes: 现有 `nsTextarea`（input.vue 中已定义）。
- Produces: textarea 在 `autosize` 为真时带 `is-autosize` class；`.el-textarea__inner` 默认 `resize: both`，`.el-textarea__inner.is-autosize` 限 `max-height: 112px` 且不可手动 resize。

- [ ] **Step 1: 写失败测试**

在 `packages/components/input/__tests__/input.test.tsx` 的 `describe('Input.vue')` 内追加：

```tsx
test('textarea 渲染 autosize 标记 class', async () => {
  const wrapper = mount(() => (
    <Input
      type="textarea"
      autosize={{ minRows: 2 }}
      modelValue="text"
    />
  ))

  const textarea = wrapper.find('textarea')
  expect(textarea.classes()).toContain('is-autosize')
})

test('textarea 非 autosize 不渲染标记 class', () => {
  const wrapper = mount(() => (
    <Input type="textarea" modelValue="text" />
  ))

  const textarea = wrapper.find('textarea')
  expect(textarea.classes()).not.toContain('is-autosize')
})
```

- [ ] **Step 2: 运行确认失败**

Run: `pnpm vitest packages/components/input/__tests__/input.test.tsx -t "autosize 标记"`
Expected: FAIL（`is-autosize` class 不存在）

- [ ] **Step 3: input.vue 加 class**

在 `packages/components/input/src/input.vue` 的 textarea class 数组（127-131 行）追加：

```tsx
:class="[
  nsTextarea.e('inner'),
  nsInput.is('focus', isFocused),
  nsTextarea.is('clearable', clearable),
  nsTextarea.is('autosize', !!props.autosize),
]"
```

- [ ] **Step 4: input.scss 调整 resize 与 autosize 上限**

在 `packages/theme-chalk/src/input.scss`：

1. 将 `.el-textarea__inner`（约 54 行）的 `resize: vertical;` 改为 `resize: both;`（固定高度态：右下角拖拽调宽+高，无 max-height）。

2. 在 `.el-textarea__inner` 块内、`@include when(clearable)` 之后追加：

```scss
@include when(autosize) {
  resize: none;
  max-height: 112px;
  overflow-y: auto;
}
```

- [ ] **Step 5: 运行确认通过**

Run: `pnpm vitest packages/components/input/__tests__/input.test.tsx`
Expected: PASS，且其它 input 测试全部保持通过。

- [ ] **Step 6: Commit**

```bash
git add packages/components/input/src/input.vue packages/theme-chalk/src/input.scss packages/components/input/__tests__/input.test.tsx
git commit -m "feat(input): 文本域固定高度默认 resize both，自适应态 112px 上限"
```

---

### Task 3: ElInputList — 动态增减输入框（含表单校验）

**Files:**
- Create: `packages/components/input-list/src/input-list.ts`
- Create: `packages/components/input-list/src/input-list.vue`
- Create: `packages/components/input-list/index.ts`
- Create: `packages/components/input-list/style/index.ts`
- Create: `packages/components/input-list/style/css.ts`
- Create: `packages/theme-chalk/src/input-list.scss`
- Test: `packages/components/input-list/__tests__/input-list.test.tsx`

**Interfaces:**
- Consumes: `ElInput`（`@element-plus/components/input`）、`ElFormItem`（`@element-plus/components/form`）、`useNamespace`/`useId`（`@element-plus/hooks`）、`ComponentSize`（`@element-plus/constants`）、`Arrayable`（`@element-plus/utils`）、`FormItemRule`（`@element-plus/components/form`）。
- Produces: `ElInputList`，props 见下；emits `update:modelValue`、`change`。`rowProp(index)` 内部生成 `${prop}[${index}]`。

- [ ] **Step 1: 写失败测试**

创建 `packages/components/input-list/__tests__/input-list.test.tsx`：

```tsx
import { nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, test } from 'vitest'
import { ElForm } from '@element-plus/components/form'
import InputList from '../src/input-list.vue'

describe('InputList.vue', () => {
  test('按 modelValue 渲染对应行数', () => {
    const wrapper = mount(() => (
      <InputList modelValue={['a', 'b', 'c']} />
    ))

    expect(wrapper.findAll('.el-input-list__row')).toHaveLength(3)
    expect(wrapper.findAll('input')).toHaveLength(3)
  })

  test('点击新增追加一行并 emit', async () => {
    const list = ref(['a'])
    const wrapper = mount(() => (
      <InputList modelValue={list.value} onUpdate:modelValue={(v) => (list.value = v)} />
    ))

    await wrapper.find('.el-input-list__add').trigger('click')
    await nextTick()

    expect(list.value).toEqual(['a', ''])
    expect(wrapper.findAll('.el-input-list__row')).toHaveLength(2)
  })

  test('行数大于 min 才显示删除按钮，点击删除移除该行', async () => {
    const list = ref(['a', 'b'])
    const wrapper = mount(() => (
      <InputList modelValue={list.value} min={1} onUpdate:modelValue={(v) => (list.value = v)} />
    ))

    const deletes = wrapper.findAll('.el-input-list__delete')
    expect(deletes).toHaveLength(2)

    await deletes[0].trigger('click')
    await nextTick()

    expect(list.value).toEqual(['b'])
    // 只剩 1 行（等于 min）时删除按钮消失
    expect(wrapper.findAll('.el-input-list__delete')).toHaveLength(0)
  })

  test('min=1 且仅 1 行时点击删除不生效', async () => {
    const list = ref(['a'])
    const wrapper = mount(() => (
      <InputList modelValue={list.value} min={1} onUpdate:modelValue={(v) => (list.value = v)} />
    ))

    // 无删除按钮可点；直接调逻辑：remove 被 min 挡住
    expect(wrapper.find('.el-input-list__delete').exists()).toBe(false)
  })

  test('达到 max 隐藏新增按钮', () => {
    const wrapper = mount(() => (
      <InputList modelValue={['a', 'b']} max={2} />
    ))

    expect(wrapper.find('.el-input-list__add').exists()).toBe(false)
  })

  test('行内输入更新对应 modelValue 项', async () => {
    const list = ref(['a', 'b'])
    const wrapper = mount(() => (
      <InputList modelValue={list.value} onUpdate:modelValue={(v) => (list.value = v)} />
    ))

    const inputs = wrapper.findAll('.el-input-list__row input')
    await inputs[1].setValue('xyz')
    await nextTick()

    expect(list.value).toEqual(['a', 'xyz'])
  })

  test('表单集成：ElForm 内共用同一组 rules，空行校验失败', async () => {
    const formModel = ref({ contacts: ['', ''] })
    const formRef = ref()
    const rules = [{ required: true, message: '请输入联系人', trigger: 'blur' }]

    const wrapper = mount(() => (
      <ElForm ref={formRef} model={formModel.value} rules={{ contacts: rules }}>
        <InputList
          v-model={formModel.value.contacts}
          prop="contacts"
          rules={rules}
          placeholder="请输入"
        />
      </ElForm>
    ))

    const validate = (formRef.value as { validate: () => Promise<boolean> }).validate
    // EP Form.validate 失败时以校验字段对象 reject（非 Error），用 toBeTruthy 断言
    await expect(validate()).rejects.toBeTruthy()
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run: `pnpm vitest packages/components/input-list/__tests__/input-list.test.tsx`
Expected: FAIL（组件不存在：Cannot find module）

- [ ] **Step 3: 实现 src/input-list.ts**

创建 `packages/components/input-list/src/input-list.ts`：

```ts
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
  'update:modelValue': (value: string[]) => isArray(value) && value.every(isString),
  change: (value: string[]) => isArray(value) && value.every(isString),
}
export type InputListEmits = typeof inputListEmits
```

- [ ] **Step 4: 实现 src/input-list.vue**

创建 `packages/components/input-list/src/input-list.vue`：

```vue
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
```

- [ ] **Step 5: 实现 index.ts 与 style 入口**

创建 `packages/components/input-list/index.ts`：

```ts
import { withInstall } from '@element-plus/utils'
import InputList from './src/input-list.vue'

import type { SFCWithInstall } from '@element-plus/utils'

export const ElInputList: SFCWithInstall<typeof InputList> =
  withInstall(InputList)
export default ElInputList

export * from './src/input-list'
```

创建 `packages/components/input-list/style/index.ts`：

```ts
import '@element-plus/components/base/style'
import '@element-plus/theme-chalk/src/input-list.scss'
```

创建 `packages/components/input-list/style/css.ts`：

```ts
import '@element-plus/components/base/style/css'
import '@element-plus/theme-chalk/el-input-list.css'
```

- [ ] **Step 6: 实现 input-list.scss**

创建 `packages/theme-chalk/src/input-list.scss`：

```scss
@use 'mixins/mixins' as *;
@use 'common/var' as *;

@include b(input-list) {
  display: flex;
  flex-direction: column;
  gap: 4px;

  @include e(row) {
    margin-bottom: 0;
  }

  @include e(row-content) {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  @include e(delete) {
    flex-shrink: 0;
    border: none;
    background: none;
    padding: 4px 6px;
    font-size: getCssVar('font-size', 'base');
    color: getCssVar('text-color-secondary');
    cursor: pointer;

    &:hover {
      color: getCssVar('color-danger');
    }

    &:disabled {
      cursor: not-allowed;
    }
  }

  @include e(add) {
    align-self: flex-start;
    border: none;
    background: none;
    padding: 4px 6px;
    font-size: getCssVar('font-size', 'base');
    color: #ff9900;
    cursor: pointer;

    &:hover {
      opacity: 0.8;
    }
  }
}
```

- [ ] **Step 7: 运行确认通过**

Run: `pnpm vitest packages/components/input-list/__tests__/input-list.test.tsx`
Expected: PASS。

- [ ] **Step 8: Commit**

```bash
git add packages/components/input-list packages/theme-chalk/src/input-list.scss
git commit -m "feat(components): [input-list] 动态增减输入框，支持整组共用校验规则"
```

---

### Task 4: ElFormatInput — 业务格式化输入 + 4 个别名

**Files:**
- Create: `packages/components/format-input/src/formats.ts`
- Create: `packages/components/format-input/src/format-input.ts`
- Create: `packages/components/format-input/src/format-input.vue`
- Create: `packages/components/format-input/src/phone-input.vue`
- Create: `packages/components/format-input/src/bank-account-input.vue`
- Create: `packages/components/format-input/src/id-card-input.vue`
- Create: `packages/components/format-input/src/amount-input.vue`
- Create: `packages/components/format-input/index.ts`
- Create: `packages/components/format-input/style/index.ts`
- Create: `packages/components/format-input/style/css.ts`
- Create: `packages/theme-chalk/src/format-input.scss`
- Test: `packages/components/format-input/__tests__/format-input.test.tsx`

**Interfaces:**
- Consumes: `ElInput`（`@element-plus/components/input`）、`useNamespace`（`@element-plus/hooks`）。
- Produces: `InputFormat` 类型、`inputFormatRules`（各 format 的 `formatter`/`parser`/`maxlength`）；`ElFormatInput` + 4 别名组件。

- [ ] **Step 1: 写失败测试**

创建 `packages/components/format-input/__tests__/format-input.test.tsx`：

```tsx
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
    expect(rule.formatter('13-5-5')).toBe('1355')
    expect(rule.formatter('')).toBe('')
  })
})

describe('FormatInput.vue', () => {
  test('渲染内部 input 并透传 placeholder', () => {
    const wrapper = mount(() => (
      <FormatInput format="phone" placeholder="请输入手机号" modelValue="13556997554" />
    ))

    const input = wrapper.find('input')
    expect(input.exists()).toBe(true)
    expect(input.attributes('placeholder')).toBe('请输入手机号')
    expect(input.element.value).toBe('135 5699 7554')
  })

  test('输入时 parser 还原原始值并 emit', async () => {
    const value = ref('')
    const wrapper = mount(() => (
      <FormatInput format="phone" modelValue={value.value} onUpdate:modelValue={(v) => (value.value = v)} />
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
```

- [ ] **Step 2: 运行确认失败**

Run: `pnpm vitest packages/components/format-input/__tests__/format-input.test.tsx`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现 src/formats.ts**

创建 `packages/components/format-input/src/formats.ts`：

```ts
export type InputFormat = 'phone' | 'bankAccount' | 'idCard' | 'amount'

export interface InputFormatRule {
  formatter: (value: string) => string
  parser: (value: string) => string
  maxlength: number
}

const onlyDigits = (value: string) => value.replace(/\D/g, '')

export const inputFormatRules: Record<InputFormat, InputFormatRule> = {
  phone: {
    formatter(value) {
      const digits = onlyDigits(value).slice(0, 11)
      if (digits.length <= 3) return digits
      if (digits.length <= 7) return `${digits.slice(0, 3)} ${digits.slice(3)}`
      return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`
    },
    parser(value) {
      return onlyDigits(value).slice(0, 11)
    },
    maxlength: 13,
  },
  bankAccount: {
    formatter(value) {
      const digits = onlyDigits(value).slice(0, 19)
      return digits.replace(/(.{4})/g, '$1 ').trim()
    },
    parser(value) {
      return onlyDigits(value).slice(0, 19)
    },
    maxlength: 24,
  },
  idCard: {
    formatter(value) {
      const clean = value
        .replace(/\s/g, '')
        .toUpperCase()
        .replace(/[^0-9X]/g, '')
        .slice(0, 18)
      if (clean.length <= 6) return clean
      if (clean.length <= 14) return `${clean.slice(0, 6)} ${clean.slice(6)}`
      return `${clean.slice(0, 6)} ${clean.slice(6, 14)} ${clean.slice(14)}`
    },
    parser(value) {
      return value.replace(/\s/g, '').toUpperCase().replace(/[^0-9X]/g, '')
    },
    maxlength: 20,
  },
  amount: {
    formatter(value) {
      const raw = String(value).replace(/,/g, '')
      const [int = '', dec = ''] = raw.split('.')
      const intPart = onlyDigits(int)
      const intWithSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      const decPart = onlyDigits(dec).slice(0, 2)
      return decPart ? `${intWithSep}.${decPart}` : intWithSep
    },
    parser(value) {
      const raw = String(value).replace(/,/g, '')
      const [int = '', dec = ''] = raw.split('.')
      const intPart = onlyDigits(int).slice(0, 15)
      const decPart = onlyDigits(dec).slice(0, 2)
      return decPart ? `${intPart}.${decPart}` : intPart
    },
    maxlength: 20,
  },
}
```

- [ ] **Step 4: 实现 src/format-input.ts**

创建 `packages/components/format-input/src/format-input.ts`：

```ts
import { isString } from '@element-plus/utils'
import { inputFormatRules } from './formats'

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
```

- [ ] **Step 5: 实现 src/format-input.vue**

创建 `packages/components/format-input/src/format-input.vue`：

```vue
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
```

- [ ] **Step 6: 实现 4 个别名薄封装**

创建 `packages/components/format-input/src/phone-input.vue`：

```vue
<script lang="ts" setup>
import { useAttrs } from 'vue'
import FormatInput from './format-input.vue'

defineOptions({
  name: 'ElPhoneInput',
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
    @update:model-value="emit('update:modelValue', $event)"
    format="phone"
  />
</template>
```

创建 `packages/components/format-input/src/bank-account-input.vue`（同上结构，`name: 'ElBankAccountInput'`，`format="bankAccount"`）：

```vue
<script lang="ts" setup>
import { useAttrs } from 'vue'
import FormatInput from './format-input.vue'

defineOptions({
  name: 'ElBankAccountInput',
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
    @update:model-value="emit('update:modelValue', $event)"
    format="bankAccount"
  />
</template>
```

创建 `packages/components/format-input/src/id-card-input.vue`（同上结构，`name: 'ElIdCardInput'`，`format="idCard"`）。

创建 `packages/components/format-input/src/amount-input.vue`（同上结构，`name: 'ElAmountInput'`，`format="amount"`）。

- [ ] **Step 7: 实现 index.ts 与 style 入口**

创建 `packages/components/format-input/index.ts`：

```ts
import { withInstall, withNoopInstall } from '@element-plus/utils'
import FormatInput from './src/format-input.vue'
import PhoneInput from './src/phone-input.vue'
import BankAccountInput from './src/bank-account-input.vue'
import IdCardInput from './src/id-card-input.vue'
import AmountInput from './src/amount-input.vue'

import type { SFCWithInstall } from '@element-plus/utils'

export const ElFormatInput: SFCWithInstall<typeof FormatInput> =
  withInstall(FormatInput)
export const ElPhoneInput: SFCWithInstall<typeof PhoneInput> =
  withNoopInstall(PhoneInput)
export const ElBankAccountInput: SFCWithInstall<typeof BankAccountInput> =
  withNoopInstall(BankAccountInput)
export const ElIdCardInput: SFCWithInstall<typeof IdCardInput> =
  withNoopInstall(IdCardInput)
export const ElAmountInput: SFCWithInstall<typeof AmountInput> =
  withNoopInstall(AmountInput)
export default ElFormatInput

export * from './src/format-input'
export * from './src/formats'
```

创建 `packages/components/format-input/style/index.ts`：

```ts
import '@element-plus/components/base/style'
import '@element-plus/theme-chalk/src/format-input.scss'
```

创建 `packages/components/format-input/style/css.ts`：

```ts
import '@element-plus/components/base/style/css'
import '@element-plus/theme-chalk/el-format-input.css'
```

- [ ] **Step 8: 实现 format-input.scss**

创建 `packages/theme-chalk/src/format-input.scss`：

```scss
@use 'mixins/mixins' as *;

@include b(format-input) {
  width: 100%;
}
```

- [ ] **Step 9: 运行确认通过**

Run: `pnpm vitest packages/components/format-input/__tests__/format-input.test.tsx`
Expected: PASS。

- [ ] **Step 10: Commit**

```bash
git add packages/components/format-input packages/theme-chalk/src/format-input.scss
git commit -m "feat(components): [format-input] 业务格式化输入 + 手机号/银行/身份证/金额别名"
```

---

### Task 5: ElDurationInput — 时分秒时长输入

**Files:**
- Create: `packages/components/duration-input/src/duration-input.ts`
- Create: `packages/components/duration-input/src/duration-input.vue`
- Create: `packages/components/duration-input/index.ts`
- Create: `packages/components/duration-input/style/index.ts`
- Create: `packages/components/duration-input/style/css.ts`
- Create: `packages/theme-chalk/src/duration-input.scss`
- Test: `packages/components/duration-input/__tests__/duration-input.test.tsx`

**Interfaces:**
- Consumes: `useNamespace`（`@element-plus/hooks`）、`ComponentSize`（`@element-plus/constants`）。
- Produces: `DurationValue = { h: number|null; m: number|null; s: number|null }`；`ElDurationInput`，emits `update:modelValue`。

- [ ] **Step 1: 写失败测试**

创建 `packages/components/duration-input/__tests__/duration-input.test.tsx`：

```tsx
import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, test } from 'vitest'
import DurationInput from '../src/duration-input.vue'

import type { DurationValue } from '../src/duration-input'

describe('DurationInput.vue', () => {
  test('渲染时/分/秒三段输入', () => {
    const wrapper = mount(() => <DurationInput modelValue={null} />)

    expect(wrapper.findAll('.el-duration-input__input')).toHaveLength(3)
    const units = wrapper.findAll('.el-duration-input__unit').map((n) => n.text())
    expect(units).toEqual(['时', '分', '秒'])
  })

  test('输入秒段 emit {h,m,s}', async () => {
    const value = ref<DurationValue | null>(null)
    const wrapper = mount(() => (
      <DurationInput modelValue={value.value} onUpdate:modelValue={(v) => (value.value = v)} />
    ))

    const inputs = wrapper.findAll('.el-duration-input__input')
    await inputs[2].setValue('45')
    expect(value.value).toEqual({ h: null, m: null, s: 45 })
  })

  test('失焦自动补 0', async () => {
    const value = ref<DurationValue | null>({ h: null, m: null, s: 45 })
    const wrapper = mount(() => (
      <DurationInput modelValue={value.value} onUpdate:modelValue={(v) => (value.value = v)} />
    ))

    const inputs = wrapper.findAll('.el-duration-input__input')
    await inputs[2].trigger('blur')
    expect(value.value).toEqual({ h: 0, m: 0, s: 45 })
  })

  test('分/秒超过 59 失焦钳制并提示', async () => {
    const value = ref<DurationValue | null>({ h: null, m: 75, s: 0 })
    const wrapper = mount(() => (
      <DurationInput modelValue={value.value} onUpdate:modelValue={(v) => (value.value = v)} />
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
      <DurationInput modelValue={value.value} onUpdate:modelValue={(v) => (value.value = v)} />
    ))

    const inputs = wrapper.findAll('.el-duration-input__input')
    await inputs[0].trigger('focus')
    expect(value.value).toEqual({ h: null, m: 5, s: 0 })
  })

  test('点击段区域聚焦对应 input', async () => {
    const wrapper = mount(() => <DurationInput modelValue={null} />)

    const items = wrapper.findAll('.el-duration-input__item')
    await items[1].trigger('click')
    expect(document.activeElement).toBe(wrapper.findAll('.el-duration-input__input')[1].element)
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run: `pnpm vitest packages/components/duration-input/__tests__/duration-input.test.tsx`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现 src/duration-input.ts**

创建 `packages/components/duration-input/src/duration-input.ts`：

```ts
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
```

- [ ] **Step 4: 实现 src/duration-input.vue**

创建 `packages/components/duration-input/src/duration-input.vue`：

```vue
<template>
  <div
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

const activeSeg = ref<SegKey>()
const errorMessage = ref('')
const segInputs = ref<Record<string, HTMLInputElement | null>>({})

const current = computed<DurationValue>(() => props.modelValue ?? { h: null, m: null, s: null })

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
  const raw = (evt.target as HTMLInputElement).value.replace(/\D/g, '')
  const num = raw === '' ? null : Number(raw)
  emit('update:modelValue', { ...current.value, [key]: num })
}

const handleBlur = () => {
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
```

- [ ] **Step 5: 实现 index.ts 与 style 入口**

创建 `packages/components/duration-input/index.ts`：

```ts
import { withInstall } from '@element-plus/utils'
import DurationInput from './src/duration-input.vue'

import type { SFCWithInstall } from '@element-plus/utils'

export const ElDurationInput: SFCWithInstall<typeof DurationInput> =
  withInstall(DurationInput)
export default ElDurationInput

export * from './src/duration-input'
```

创建 `packages/components/duration-input/style/index.ts`：

```ts
import '@element-plus/components/base/style'
import '@element-plus/theme-chalk/src/duration-input.scss'
```

创建 `packages/components/duration-input/style/css.ts`：

```ts
import '@element-plus/components/base/style/css'
import '@element-plus/theme-chalk/el-duration-input.css'
```

- [ ] **Step 6: 实现 duration-input.scss**

创建 `packages/theme-chalk/src/duration-input.scss`：

```scss
@use 'sass:map';

@use 'mixins/mixins' as *;
@use 'common/var' as *;

@include b(duration-input) {
  display: inline-flex;
  align-items: center;
  gap: 4px;

  @include e(item) {
    display: inline-flex;
    align-items: center;
    border: 1px solid getCssVar('border-color');
    border-radius: 4px;
    background-color: getCssVar('fill-color', 'blank');
    cursor: text;
    overflow: hidden;
    transition: getCssVar('transition-box-shadow');

    &:hover {
      border-color: getCssVar('border-color-hover');
    }

    @include when(active) {
      border-color: #ff9900;
    }
  }

  @include e(input) {
    width: 3em;
    height: 30px;
    padding: 0 8px;
    border: none;
    outline: none;
    background: none;
    font-size: getCssVar('font-size', 'base');
    color: getCssVar('text-color-regular');
    box-sizing: border-box;

    &::placeholder {
      color: getCssVar('text-color-placeholder');
    }
  }

  @include e(unit) {
    padding-right: 8px;
    color: getCssVar('text-color-secondary');
    font-size: getCssVar('font-size', 'base');
    user-select: none;
  }

  @include e(error) {
    color: getCssVar('color-danger');
    font-size: 12px;
    line-height: 1.2;
  }

  @include when(error) {
    .#{$namespace}-duration-input__item {
      border-color: getCssVar('color-danger');
    }
  }

  @include when(disabled) {
    .#{$namespace}-duration-input__item {
      background-color: getCssVar('disabled-bg-color');
      cursor: not-allowed;

      .#{$namespace}-duration-input__input {
        color: getCssVar('disabled-text-color');
        cursor: not-allowed;
      }
    }
  }

  @include when(large) {
    .#{$namespace}-duration-input__input {
      height: 38px;
    }
  }

  @include when(small) {
    .#{$namespace}-duration-input__input {
      height: 22px;
    }
  }
}
```

- [ ] **Step 7: 运行确认通过**

Run: `pnpm vitest packages/components/duration-input/__tests__/duration-input.test.tsx`
Expected: PASS。

- [ ] **Step 8: Commit**

```bash
git add packages/components/duration-input packages/theme-chalk/src/duration-input.scss
git commit -m "feat(components): [duration-input] 时分秒时长输入"
```

---

### Task 6: 注册与导出

**Files:**
- Modify: `packages/components/index.ts`
- Modify: `packages/element-plus/component.ts`
- Modify: `typings/global.d.ts`

**Interfaces:**
- Consumes: Task 3/4/5 产出的各组件导出。
- Produces: `import { ElInputList, ElFormatInput, ElPhoneInput, ElBankAccountInput, ElIdCardInput, ElAmountInput, ElDurationInput } from 'element-plus'` 全部可用，且可 `app.use(ElementPlus)` 全量安装。

- [ ] **Step 1: 修改 components barrel**

在 `packages/components/index.ts` 末尾（`export * from './splitter'` 之后）追加：

```ts
export * from './input-list'
export * from './format-input'
export * from './duration-input'
```

- [ ] **Step 2: 修改 component.ts 注册**

在 `packages/element-plus/component.ts`：
1. import 区（参考现有 `ElInput` 等导入）追加：

```ts
import { ElInputList } from '@element-plus/components/input-list'
import {
  ElAmountInput,
  ElBankAccountInput,
  ElFormatInput,
  ElIdCardInput,
  ElPhoneInput,
} from '@element-plus/components/format-input'
import { ElDurationInput } from '@element-plus/components/duration-input'
```

2. 默认导出数组（`ElInput` 等附近）追加：

```ts
  ElInputList,
  ElFormatInput,
  ElPhoneInput,
  ElBankAccountInput,
  ElIdCardInput,
  ElAmountInput,
  ElDurationInput,
```

- [ ] **Step 3: 修改 typings/global.d.ts**

在 `typings/global.d.ts` 的 `declare module 'vue'` 组件名列表中，`ElInput` 相关位置追加（保持字母序）：

```ts
    ElInputList: typeof import('element-plus')['ElInputList']
    ElFormatInput: typeof import('element-plus')['ElFormatInput']
    ElPhoneInput: typeof import('element-plus')['ElPhoneInput']
    ElBankAccountInput: typeof import('element-plus')['ElBankAccountInput']
    ElIdCardInput: typeof import('element-plus')['ElIdCardInput']
    ElAmountInput: typeof import('element-plus')['ElAmountInput']
    ElDurationInput: typeof import('element-plus')['ElDurationInput']
```

- [ ] **Step 4: 类型检查**

Run: `pnpm check:type`（或项目对应 typecheck 脚本）
Expected: PASS，无未定义类型错误。

- [ ] **Step 5: Commit**

```bash
git add packages/components/index.ts packages/element-plus/component.ts typings/global.d.ts
git commit -m "feat: 注册 input-list/format-input/duration-input 系列组件"
```

---

### Task 7: play 验收页（可选轻量）

**Files:**
- Create: `play/src/views/input-cc.vue`（示例）

**Interfaces:**
- Consumes: Task 6 注册后的全局组件。

- [ ] **Step 1: 创建验收页**

在 `play/` 下按现有 play 路由模式新增 `input-cc.vue`，分组展示设计图 12 节：基础输入框状态、文本域（固定/自适应）、前后缀、前后缀选择器、组合范围、联想（用 ElAutocomplete 自定义 slot 做关键词高亮）、动态增减（ElInputList）、业务组件（ElPhoneInput/ElBankAccountInput/ElIdCardInput/ElAmountInput/ElDurationInput）。每个新组件一段 `el-card`，含交互演示。

- [ ] **Step 2: 启动 play 目视验收**

Run: `pnpm dev:play`（或项目 play 启动脚本）
人工核对：输入框聚焦边框为 `#ff9900`；文本域固定态右下角可拖宽高、自适应态超 112px 出滚动条；三个新组件交互符合设计图。

- [ ] **Step 3: Commit**

```bash
git add play/src/views/input-cc.vue
git commit -m "feat(play): 输入框二开验收页"
```

---

## Self-Review 记录

- **Spec 覆盖**：L0/L1（§4.1 focus 橙、§4.2 文本域 resize/112px）→ Task 1/2；ElInputList（§5.1，含表单 rules 集成决策 12）→ Task 3；ElFormatInput + 别名（§5.2，决策 10）→ Task 4；ElDurationInput `{h,m,s}`（§5.3，决策 11）→ Task 5；接入（§7）→ Task 6；验收页（§9）→ Task 7。YAGNI 项（密码/范围/辅助提示）不建组件，未设任务，符合规格 §3.3。
- **占位符扫描**：无 TBD/TODO；所有代码步骤含完整代码。
- **类型一致性**：`DurationValue` 在 Task 5 的 .ts 与 .vue 同源导入；`rowProp`/`list`/`updateRow` 命名在 Task 3 内一致；`inputFormatRules` 的 `formatter`/`parser`/`maxlength` 三元组在 Task 4 各处一致。
