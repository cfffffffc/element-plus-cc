<template>
  <div :class="ns.e('item')">
    <div :class="[ns.e('link-row'), ns.is('active', isActive)]">
      <el-tooltip
        :disabled="!showTooltip || !isOverflow"
        :content="tooltipContent"
        effect="dark"
        placement="bottom"
        :show-after="200"
      >
        <a ref="linkRef" :class="cls" :href="href" @click="handleClick">
          <slot>{{ title }}</slot>
        </a>
      </el-tooltip>
      <button
        v-if="showSubLink"
        type="button"
        :class="[ns.e('expand-btn'), ns.is('collapsed', collapsed)]"
        @click="toggleCollapse"
      >
        <el-icon><arrow-down /></el-icon>
      </button>
    </div>
    <div v-if="showSubLink" v-show="!collapsed" :class="ns.e('list')">
      <slot name="sub-link" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  computed,
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  ref,
  useSlots,
  watch,
} from 'vue'
import { useResizeObserver } from '@vueuse/core'
import ElIcon from '@element-plus/components/icon'
import { ElTooltip } from '@element-plus/components/tooltip'
import { ArrowDown } from '@element-plus/icons-vue'
import { anchorKey } from './constants'

import type { AnchorLinkProps } from './anchor-link'

defineOptions({
  name: 'ElAnchorLink',
})

const props = defineProps<AnchorLinkProps>()
const slots = useSlots()

const linkRef = ref<HTMLElement | null>(null)
const collapsed = ref(false)
const isOverflow = ref(false)

const {
  ns,
  direction,
  currentAnchor,
  showTooltip,
  addLink,
  removeLink,
  handleClick: contextHandleClick,
} = inject(anchorKey)!

const isActive = computed(() => currentAnchor.value === props.href)

const cls = computed(() => [ns.e('link'), ns.is('active', isActive.value)])

const showSubLink = computed(
  () => !!slots['sub-link'] && direction === 'vertical'
)

const tooltipContent = computed(
  () => props.title ?? linkRef.value?.textContent ?? ''
)

const toggleCollapse = () => {
  collapsed.value = !collapsed.value
}

const updateOverflow = () => {
  const el = linkRef.value
  isOverflow.value = !!el && el.scrollWidth > el.clientWidth
}

useResizeObserver(linkRef, updateOverflow)

const handleClick = (e: MouseEvent) => {
  contextHandleClick(e, props.href)
}

watch(
  () => props.href,
  (val, oldVal) => {
    nextTick(() => {
      if (oldVal) removeLink(oldVal)
      if (val) {
        addLink({
          href: val,
          el: linkRef.value!,
        })
      }
    })
  }
)

onMounted(() => {
  updateOverflow()
  const { href } = props
  if (href) {
    addLink({
      href,
      el: linkRef.value!,
    })
  }
})

onUpdated(updateOverflow)

onBeforeUnmount(() => {
  const { href } = props
  if (href) {
    removeLink(href)
  }
})
</script>
