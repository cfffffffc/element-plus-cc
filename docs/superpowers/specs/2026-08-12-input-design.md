# 输入框二开设计方案

- 日期：2026-08-12
- 分支：`dev-0728`
- 依据：`UI/input.png` 设计图（1920×10259，已按行切为 `UI/input_split/input_r1_c1 ~ r12_c1`）
- 前置：anchor 二开已完成（同分支 `fix(directives): 0729/0730/0731`），本方案沿用其接入与主题化模式

## 1. 背景与目标

对 Element Plus `ElInput` 生态做二次开发，使基础输入框、文本域、组合输入框、联想、动态增减及常用业务输入（手机号/银行账号/身份证/金额/时分秒）的视觉与交互贴合 `UI/input.png` 设计规范。

已确认的核心取向：

- **视觉以品牌橙 `#ff9900` 局部品牌化**（聚焦边框染橙），其余沿用 EP 默认，改动面最小、回归风险低。
- 实施策略：**全量落地**（主题改造 + 新增组件），覆盖设计图全部 12 节。

## 2. 设计图章节解读

| 切图 | 章节           | 内容                                                                                                                                    |
| ---- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| r1   | 概述           | 输入框定义：鼠标/键盘录入，最基础表单控件。构成 = 输入行 + 标签                                                                         |
| r2   | 标签           | 标签文本、右对齐、可换行、标签与输入框间距固定；必填星号、提示图标                                                                      |
| r3   | 基础输入框状态 | 悬停 / 激活 / 输入中 / 输入完成 / 输入后悬停 / 无内容禁用 / 有内容禁用 / 超长文字 / 异常状态+提醒文案；可配置清空                       |
| r4   | 文本域         | 高度自适应；高度固定+右下角拖拽 resize（最小=标准输入框高 40px）；字数达上限自动截断；字数统计 2/2；超出最大高度 112px 出滚动条；禁用态 |
| r5   | 前后缀固定标识 | 文字/图标前缀、后缀，前后缀并存；含字数限制输入框（0/50）                                                                               |
| r6   | 前后缀可选择   | 前缀/后缀处放置下拉选择器（如"浙江省▾"）                                                                                                |
| r7   | 关联操作       | 支持输入及选择；点击热区=整个输入框；点击后弹出操作（如弹窗）；已选内容反选展示；禁用/异常态                                            |
| r8   | 组合输入框     | 范围输入框（最小金额~最大金额）、千分位金额格式；建议一行显示                                                                           |
| r9   | 联想输入       | 未输入激活→展示全部/历史选项；输入后→匹配选项关键词高亮；点空白收起不清空输入                                                           |
| r10  | 动态增减输入框 | 样式一/样式二；+新增按钮；每行可删除，至少保留一个                                                                                      |
| r11  | 业务组件①      | 时分秒时长输入（任填、失焦自动补 0 并计算、超 60 提示、点击哪块激活哪块）；银行账号（自动空格分组）；密码输入框                         |
| r12  | 业务组件②      | 手机号（3-4-4 分组）；金额（千分位）；身份证分组；辅助信息提示（普通/警示文案、链接"查看支付说明"、刷新按钮）                           |

## 3. 整体架构

```
L0 主题层    var.scss 设计变量（focus 品牌橙 #ff9900）
L1 现有组件改造  ElInput / InputGroup / Textarea / FormItem / Autocomplete → SCSS restyle（极少量）
L2 新增组件    ElInputList / ElFormatInput(+别名) / ElDurationInput
L3 示例与文档   play 验收页覆盖 12 节
```

### 3.1 现有组件改造映射（L1）

| 现有组件                   | 覆盖章节    | 改造方式                                                       |
| -------------------------- | ----------- | -------------------------------------------------------------- |
| `ElInput`                  | r1 r3 r5 r7 | 纯 SCSS：focus 边框染橙；其余状态（hover/禁用/异常）沿用默认   |
| `ElTextarea`（Input 内部） | r4          | SCSS：40px 最小高、112px 最大高出滚动条、字数、resize、禁用    |
| `ElInputGroup`             | r5 r6 r8    | SCSS：前后缀放选择器、范围输入框组合、前后缀并存               |
| `ElFormItem`               | r2          | SCSS：标签右对齐/换行/间距、必填星号、提示图标                 |
| `ElAutocomplete`           | r9          | SCSS：下拉面板 restyle；关键词高亮经其自定义 slot 在用法层实现 |
| `ElSelect`                 | r6          | SCSS：前后缀内嵌时样式融入                                     |

### 3.2 新增组件（L2）

| 组件              | 覆盖章节 | 职责                                                             |
| ----------------- | -------- | ---------------------------------------------------------------- |
| `ElInputList`     | r10      | 动态增减：多行输入框，+新增、行内删除、至少保留一个              |
| `ElFormatInput`   | r11 r12  | 业务格式化输入：`format='phone'/'bankAccount'/'idCard'/'amount'` |
| `ElPhoneInput` 等 | r11 r12  | `ElFormatInput` 的 format 预置便捷别名（4 个）                   |
| `ElDurationInput` | r11      | 时分秒时长输入：三段独立热区、失焦补 0、超 60 提示               |

### 3.3 不做的事（YAGNI）

- 不新建独立"密码输入框"组件 —— 用 `ElInput show-password` restyle 即可。
- 不新建独立"范围输入框"组件 —— 用 `ElInputGroup` 组合两个格式化输入实现 r8。
- 辅助信息提示（普通/警示/链接）不新建组件 —— 用现有 slot/FormItem 在示例层实现。

## 4. 主题层（L0 + L1 样式改造点）

### 4.1 变量设计（`var.scss`）

- `$input` 的 `focus-border-color`：`color-primary`(蓝) → `#ff9900`。
- 其余输入框变量**全部保持 EP 默认**：
  - `hover-border-color` = `border-color-hover`（浅灰）
  - 异常/错误状态 = `color-danger`（danger 红）
  - `border-radius` = 4px、`bg-color` = 白、尺寸/字号 = EP 默认
  - `clear-hover-color` = 默认灰（不染橙）

### 4.2 样式改造点

| 文件                                        | 改造内容                                                        |
| ------------------------------------------- | --------------------------------------------------------------- |
| `theme-chalk/src/common/var.scss`           | `$input.focus-border-color = #ff9900`；如需新增组件变量在此追加 |
| `theme-chalk/src/input.scss`                | 极少量：确认 `__wrapper` focus 橙色生效；异常态保持 danger      |
| `theme-chalk/src/input-list.scss`（新）     | 行布局、新增/删除按钮样式                                       |
| `theme-chalk/src/duration-input.scss`（新） | 三段布局、单位标签、异常提示                                    |
| `theme-chalk/src/format-input.scss`（新）   | 极薄，主要复用 input 样式                                       |

> theme-chalk 构建自动 glob `src/*.scss`，新增 scss 无需手挂入口（anchor 已如此）。

## 5. 新增组件详细设计

### 5.1 `ElInputList`（r10 动态增减输入框）

**Props**

| Props         | 类型            | 默认           | 说明                            |
| ------------- | --------------- | -------------- | ------------------------------- |
| `modelValue`  | `string[]`      | `[]`           | 各行的值（v-model）             |
| `placeholder` | `string`        | —              | 透传给每行输入框                |
| `min`         | `number`        | `1`            | 最少行数（≤此值不显示删除按钮） |
| `max`         | `number`        | `Infinity`     | 最多行数（达到后隐藏新增按钮）  |
| `addText`     | `string`        | `'+ 点击新增'` | 新增按钮文案                    |
| `size`        | `ComponentSize` | —              | 透传行内 ElInput                |
| `disabled`    | `boolean`       | `false`        | 透传行内 ElInput                |

**行为**：渲染 `modelValue.length` 行 ElInput，行尾删除按钮（≤min 不显示）；`addText` 按钮追加空行（达 max 隐藏）；删除任意行，始终保留 ≥ min 行。Emits：`update:modelValue`、`change`。

**实现要点**：props.modelValue → 响应式副本驱动；增删改统一 `emit('update:modelValue', next)`；`v-for` + 稳定 key；提供默认 slot 渲染行内输入框（默认 ElInput，可自定义前后缀）。样式一/样式二：设计图仅区分"仅新增按钮"与"含删除按钮"两种初态，由行数/`min` 驱动，不额外设 prop。

### 5.2 `ElFormatInput`（r11/r12 业务格式化输入）

**Props**

| Props                                             | 类型                                               | 默认           | 说明                           |
| ------------------------------------------------- | -------------------------------------------------- | -------------- | ------------------------------ |
| `format`                                          | `'phone' \| 'bankAccount' \| 'idCard' \| 'amount'` | 必填           | 格式化规则                     |
| `modelValue`                                      | `string \| number \| null`                         | `''`           | **原始值**（去格式化纯净数据） |
| `placeholder` / `size` / `disabled` / `clearable` | —                                                  | —              | 透传内部 ElInput               |
| `maxlength`                                       | `number`                                           | 按 format 推断 | 各格式最大长度                 |

**各 format 规则**

| format        | 显示格式                                                                         | 输入限制                 | 原始值        |
| ------------- | -------------------------------------------------------------------------------- | ------------------------ | ------------- |
| `phone`       | `135 5699 7554`（3-4-4）                                                         | 仅数字，≤11 位           | `13556997554` |
| `bankAccount` | `6222 0212 3454 3210`（4 位分组）                                                | 仅数字                   | 去空格纯数字  |
| `idCard`      | 18 位，`6-8-4` 空格分组（6 位地区 + 8 位生日 + 3 位顺序 + 1 位校验，末位可为 X） | 数字 + 末位 X            | 去空格大写    |
| `amount`      | `122,123,322.00`（千分位）                                                       | 数字 + 小数点，≤2 位小数 | `122123322`   |

**行为**：复用 ElInput 现成 `formatter`/`parser` prop，按 format 注入规则函数；v-model 始终为原始值。Emits：`update:modelValue`、`change`。

**实现要点**：`src/formats.ts` 集中管理各 format 的 `formatter`/`parser`/`maxlength` 三元组（独立单测）；金额含小数位/千分位进位；银行账号保留空格是否允许可配置。

**便捷别名**：`ElPhoneInput`、`ElBankAccountInput`、`ElIdCardInput`、`ElAmountInput` 为 `ElFormatInput` 的 format 预置薄封装（`withNoopInstall` 导出并注册）。

### 5.3 `ElDurationInput`（r11 时分秒时长输入）

**Props**

| Props               | 类型                    | 默认       | 说明                                                                                             |
| ------------------- | ----------------------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `modelValue`        | `DurationValue \| null` | `null`     | 时长对象；`DurationValue = { h: number\|null; m: number\|null; s: number\|null }`；`null` = 全空 |
| `placeholder`       | `string`                | `'请输入'` | 空态暗提示                                                                                       |
| `disabled` / `size` | —                       | —          | 透传                                                                                             |

**行为（严格按 r11）**：

1. 三段输入框（时/分/秒 + 右侧单位标签），**点击哪段聚焦哪段**（独立热区）。
2. 每段仅允许数字；任一段有值即可。
3. **失焦**：空段自动补 `0`；分/秒 > 59 → 异常提示（"请输入时/请输入分"）并回钳。
4. **段内值为 0 再次聚焦 → 自动清空**，可直接输入新值。
5. 任一段变化 → 重算并 `emit('update:modelValue', { h, m, s })`。

**实现要点**：内部 h/m/s state 由 `modelValue` 派生并双向同步；blur 时统一校验 + 补零 + emit；单位标签固定宽度保证三段对齐。

## 6. 边界与错误处理

| 组件              | 边界                                                       |
| ----------------- | ---------------------------------------------------------- |
| `ElInputList`     | 行数下界 `min`（不可删光）、上界 `max`（隐藏新增）         |
| `ElFormatInput`   | 非法字符忽略；粘贴先净化再格式化；超长截断；金额小数位上限 |
| `ElDurationInput` | 分/秒 > 59 校验提示；小时上限 99；0 值聚焦清空             |

## 7. 文件清单与接入

### 新增组件目录（每个组件一套，按 anchor 模式）

```
packages/components/input-list/
  index.ts  src/input-list.ts  src/input-list.vue
  style/index.ts  style/css.ts  __tests__/input-list.test.tsx
packages/components/format-input/
  index.ts  src/format-input.ts  src/format-input.vue  src/formats.ts
  style/index.ts  style/css.ts  __tests__/format-input.test.tsx
packages/components/duration-input/
  index.ts  src/duration-input.ts  src/duration-input.vue
  style/index.ts  style/css.ts  __tests__/duration-input.test.tsx
```

> 新组件 Props 采用 anchor 的现代风格：`src/*.ts` 定义 `interface Props` + `emits`，vue 内 `defineProps<Props>()` + `withDefaults`。

### 修改文件

| 文件                                                                          | 改动                                                                                                                                     |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `theme-chalk/src/common/var.scss`                                             | `$input.focus-border-color: #ff9900`                                                                                                     |
| `theme-chalk/src/input.scss`                                                  | 确认 focus 橙色生效、异常态保持 danger                                                                                                   |
| `theme-chalk/src/input-list.scss`、`duration-input.scss`、`format-input.scss` | 新增组件样式                                                                                                                             |
| `packages/element-plus/component.ts`                                          | 注册 7 个组件：`ElInputList`、`ElFormatInput`、`ElPhoneInput`、`ElBankAccountInput`、`ElIdCardInput`、`ElAmountInput`、`ElDurationInput` |
| `typings/global.d.ts`                                                         | 上述 7 个组件的全局类型声明                                                                                                              |

## 8. 测试计划（vitest，沿用现有 setup）

| 组件              | 测试点                                                                                                                  |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `ElInputList`     | 初始渲染、新增追加行、删除行、`min` 下界不可删光、`max` 上界隐藏新增、v-model 双向                                      |
| `ElFormatInput`   | 各 format formatter/parser 单测（手机 3-4-4、银行 4 分组、身份证、金额千分位+小数位）；非法字符忽略、粘贴净化、超长截断 |
| `ElDurationInput` | 失焦补 0、分/秒 > 59 校验、0 值聚焦清空、点击段聚焦、`{h,m,s}` emit、双向同步                                           |

现有 `input`/`form` 相关测试应保持通过（纯样式改动）。

## 9. 验收示例（L3，可选轻量）

在 `play/` 新增输入框二开 demo 页，按 12 节分组展示（基础/状态、文本域、前后缀、选择器前缀、组合范围、联想、动态增减、业务组件），用于人工验收设计还原度。

## 10. 已确认决策记录

1. 实施策略：A 全量落地（主题 + 新组件）。
2. 边框形态：外框式（四边边框）。
3. 圆角：4px。
4. focus 状态色：品牌橙 `#ff9900`。
5. 底色：白色。
6. 尺寸/字号：沿用 EP 默认。
7. hover 边框：保持 EP 默认浅灰（不染橙）。
8. 异常/错误状态：沿用 EP danger 红。
9. 清除按钮 hover：保持默认灰。
10. `ElFormatInput` 便捷别名（`ElPhoneInput` 等）：要。
11. `ElDurationInput` v-model：`{h,m,s}` 对象。
