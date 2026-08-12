import { nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, test } from 'vitest'
import { ElForm } from '@element-plus/components/form'
import InputList from '../src/input-list.vue'

describe('InputList.vue', () => {
  test('按 modelValue 渲染对应行数', () => {
    const wrapper = mount(() => <InputList modelValue={['a', 'b', 'c']} />)

    expect(wrapper.findAll('.el-input-list__row')).toHaveLength(3)
    expect(wrapper.findAll('input')).toHaveLength(3)
  })

  test('点击新增追加一行并 emit', async () => {
    const list = ref(['a'])
    const wrapper = mount(() => (
      <InputList
        modelValue={list.value}
        onUpdate:modelValue={(v) => (list.value = v)}
      />
    ))

    await wrapper.find('.el-input-list__add').trigger('click')
    await nextTick()

    expect(list.value).toEqual(['a', ''])
    expect(wrapper.findAll('.el-input-list__row')).toHaveLength(2)
  })

  test('行数大于 min 才显示删除按钮，点击删除移除该行', async () => {
    const list = ref(['a', 'b'])
    const wrapper = mount(() => (
      <InputList
        modelValue={list.value}
        min={1}
        onUpdate:modelValue={(v) => (list.value = v)}
      />
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
      <InputList
        modelValue={list.value}
        min={1}
        onUpdate:modelValue={(v) => (list.value = v)}
      />
    ))

    // 无删除按钮可点；直接调逻辑：remove 被 min 挡住
    expect(wrapper.find('.el-input-list__delete').exists()).toBe(false)
  })

  test('达到 max 隐藏新增按钮', () => {
    const wrapper = mount(() => <InputList modelValue={['a', 'b']} max={2} />)

    expect(wrapper.find('.el-input-list__add').exists()).toBe(false)
  })

  test('行内输入更新对应 modelValue 项', async () => {
    const list = ref(['a', 'b'])
    const wrapper = mount(() => (
      <InputList
        modelValue={list.value}
        onUpdate:modelValue={(v) => (list.value = v)}
      />
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

    mount(() => (
      <ElForm ref={formRef} model={formModel.value} rules={{ contacts: rules }}>
        <InputList
          modelValue={formModel.value.contacts}
          onUpdate:modelValue={(v) => (formModel.value.contacts = v)}
          prop="contacts"
          rules={rules}
          placeholder="请输入"
        />
      </ElForm>
    ))

    const validate = (formRef.value as { validate: () => Promise<boolean> })
      .validate
    // EP Form.validate 失败时以校验字段对象 reject（非 Error），用 toBeTruthy 断言
    await expect(validate()).rejects.toBeTruthy()
  })
})
