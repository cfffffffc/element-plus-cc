<template>
  <button
    v-if="links.length"
    type="button"
    :class="[ns.b(), ns.is('active', currentIndex !== 0)]"
    @click="handleClick"
  >
    {{ nextTitle }}
  </button>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useNamespace } from '@element-plus/hooks'
import {
  animateScrollTo,
  getElement,
  getOffsetTopDistance,
  getScrollElement,
  getScrollTop,
  isWindow,
} from '@element-plus/utils'
import { anchorButtonEmits } from './anchor-button'

import type { AnchorButtonProps } from './anchor-button'

defineOptions({
  name: 'ElAnchorButton',
})

const props = withDefaults(defineProps<AnchorButtonProps>(), {
  links: () => [],
  offset: 0,
  duration: 300,
})
const emit = defineEmits(anchorButtonEmits)

const ns = useNamespace('anchor-button')

// index of the item the page is currently positioned at, starts at the first
const currentIndex = ref(0)
const containerEl = ref<HTMLElement | Window>()

const nextIndex = computed(() =>
  props.links.length ? (currentIndex.value + 1) % props.links.length : 0
)
const nextTitle = computed(() => props.links[nextIndex.value]?.title ?? '')

let clearAnimate: (() => void) | null = null

const scrollToLink = (href: string) => {
  if (!containerEl.value) return
  const target = getElement(href)
  if (!target) return

  if (clearAnimate) clearAnimate()

  const scrollEle = getScrollElement(target, containerEl.value)
  const distance = getOffsetTopDistance(target, scrollEle)
  const max = scrollEle.scrollHeight - scrollEle.clientHeight
  const to = Math.min(distance - props.offset, max)
  clearAnimate = animateScrollTo(
    containerEl.value,
    getScrollTop(containerEl.value),
    to,
    props.duration
  )
}

const handleClick = (e: MouseEvent) => {
  const target = props.links[nextIndex.value]
  if (!target) return
  currentIndex.value = nextIndex.value
  emit('click', e, target.href)
  emit('change', target.href)
  scrollToLink(target.href)
}

const getContainer = () => {
  const el = getElement(props.container)
  if (!el || isWindow(el)) {
    containerEl.value = window
  } else {
    containerEl.value = el
  }
}

onMounted(getContainer)

watch(
  () => props.container,
  () => {
    getContainer()
  }
)

defineExpose({
  scrollTo: (href: string) => {
    const index = props.links.findIndex((link) => link.href === href)
    if (index === -1) return
    currentIndex.value = index
    scrollToLink(href)
  },
})
</script>
