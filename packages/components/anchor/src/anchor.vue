<template>
  <div ref="anchorRef" :class="cls">
    <div v-if="hasHeader" :class="ns.e('header')">
      <div v-if="hasTitle" :class="ns.e('title')">
        <slot name="title">{{ title }}</slot>
      </div>
      <button
        v-if="collapsibleEnabled"
        type="button"
        :class="[ns.e('collapse-btn'), ns.is('collapsed', collapsed)]"
        @click="toggleCollapse"
      />
    </div>
    <div
      v-show="!collapsed"
      ref="bodyRef"
      :class="ns.e('body')"
      :style="bodyStyle"
    >
      <div
        v-if="marker"
        ref="markerRef"
        :class="ns.e('marker')"
        :style="markerStyle"
      />
      <div :class="ns.e('list')">
        <slot />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  computed,
  nextTick,
  onMounted,
  provide,
  ref,
  useSlots,
  watch,
} from 'vue'
import { useEventListener } from '@vueuse/core'
import { useNamespace } from '@element-plus/hooks'
import {
  addUnit,
  animateScrollTo,
  getElement,
  getOffsetTopDistance,
  getScrollElement,
  getScrollTop,
  isUndefined,
  isWindow,
  throttleByRaf,
} from '@element-plus/utils'
import { CHANGE_EVENT } from '@element-plus/constants'
import { anchorEmits } from './anchor'
import { anchorKey } from './constants'

import type { CSSProperties } from 'vue'
import type { AnchorProps } from './anchor'
import type { AnchorLinkState } from './constants'

defineOptions({
  name: 'ElAnchor',
})

const props = withDefaults(defineProps<AnchorProps>(), {
  offset: 0,
  bound: 15,
  duration: 300,
  marker: false,
  type: 'default',
  direction: 'vertical',
  variant: 'flat',
  size: 'default',
  // keep tri-state: absent must stay undefined, not Boolean-cast to false
  collapsible: undefined,
  showTooltip: true,
})
const emit = defineEmits(anchorEmits)
const slots = useSlots()

const currentAnchor = ref('')
const markerStyle = ref<CSSProperties>({})
const anchorRef = ref<HTMLElement | null>(null)
const bodyRef = ref<HTMLElement | null>(null)
const markerRef = ref<HTMLElement | null>(null)
const containerEl = ref<HTMLElement | Window>()
const collapsed = ref(props.defaultCollapsed ?? false)

const links: Record<string, HTMLElement> = {}
let isScrolling = false
let currentScrollTop = 0
let prevScrollTop = 0
let scrollDirection: 'down' | 'up' = 'down'

const ns = useNamespace('anchor')

const cls = computed(() => [
  ns.b(),
  props.type === 'underline' ? ns.m('underline') : '',
  ns.m(props.direction),
  props.variant === 'card' ? ns.m('card') : '',
  props.size === 'small' ? ns.m('small') : '',
  ns.is('collapsed', collapsed.value),
])

const hasTitle = computed(() => !!slots.title || !!props.title)
// collapse button shows by default for both flat and card variants
const collapsibleEnabled = computed(() => props.collapsible ?? true)
const hasHeader = computed(() => hasTitle.value || collapsibleEnabled.value)

const bodyStyle = computed<CSSProperties>(() => {
  if (isUndefined(props.maxHeight)) return {}
  return {
    maxHeight: addUnit(props.maxHeight),
    overflowY: 'auto',
  }
})

const toggleCollapse = () => {
  collapsed.value = !collapsed.value
}

const addLink = (state: AnchorLinkState) => {
  links[state.href] = state.el
}

const removeLink = (href: string) => {
  delete links[href]
}

const setCurrentAnchor = (href: string) => {
  const activeHref = currentAnchor.value
  if (activeHref !== href) {
    currentAnchor.value = href
    emit(CHANGE_EVENT, href)
  }
}

let clearAnimate: (() => void) | null = null
let currentTargetHref = ''

const scrollToAnchor = (href: string) => {
  if (!containerEl.value) return
  const target = getElement(href)
  if (!target) return

  if (clearAnimate) {
    if (currentTargetHref === href) return
    clearAnimate()
  }

  currentTargetHref = href
  isScrolling = true
  const scrollEle = getScrollElement(target, containerEl.value)
  const distance = getOffsetTopDistance(target, scrollEle)
  const max = scrollEle.scrollHeight - scrollEle.clientHeight
  const to = Math.min(distance - props.offset, max)
  clearAnimate = animateScrollTo(
    containerEl.value,
    currentScrollTop,
    to,
    props.duration,
    () => {
      // make sure it is executed after throttleByRaf's handleScroll
      setTimeout(() => {
        isScrolling = false
        currentTargetHref = ''
      }, 20)
    }
  )
}

const scrollTo = (href?: string) => {
  if (href) {
    scrollDirection = 'down'
    setCurrentAnchor(href)
    scrollToAnchor(href)
  }
}

const handleClick = (e: MouseEvent, href?: string) => {
  emit('click', e, href)
  scrollTo(href)
}

const handleScroll = throttleByRaf(() => {
  if (containerEl.value) {
    currentScrollTop = getScrollTop(containerEl.value)
    scrollDirection = currentScrollTop >= prevScrollTop ? 'down' : 'up'
    prevScrollTop = currentScrollTop
  }
  const currentHref = getCurrentHref()
  if (isScrolling || isUndefined(currentHref)) return
  setCurrentAnchor(currentHref)
})

const getCurrentHref = () => {
  if (!containerEl.value) return
  const scrollTop = getScrollTop(containerEl.value)
  const anchorTopList: { top: number; href: string }[] = []

  for (const href of Object.keys(links)) {
    const target = getElement(href)
    if (!target) continue
    const scrollEle = getScrollElement(target, containerEl.value)
    const distance = getOffsetTopDistance(target, scrollEle)
    anchorTopList.push({
      top: distance - props.offset - props.bound,
      href,
    })
  }
  anchorTopList.sort((prev, next) => prev.top - next.top)
  for (let i = 0; i < anchorTopList.length; i++) {
    const item = anchorTopList[i]
    const next = anchorTopList[i + 1]

    if (i === 0 && scrollTop === 0) {
      return props.selectScrollTop ? item.href : ''
    }
    if (item.top <= scrollTop && (!next || next.top > scrollTop)) {
      return item.href
    }
  }
}

const getContainer = () => {
  const el = getElement(props.container)
  if (!el || isWindow(el)) {
    containerEl.value = window
  } else {
    containerEl.value = el
  }
}

useEventListener(containerEl, 'scroll', handleScroll)

const updateMarkerStyle = () => {
  nextTick(() => {
    scrollActiveIntoView()
    if (!bodyRef.value || !markerRef.value || !currentAnchor.value) {
      markerStyle.value = {}
      return
    }
    const currentLinkEl = links[currentAnchor.value]
    if (!currentLinkEl) {
      markerStyle.value = {}
      return
    }
    const bodyRect = bodyRef.value.getBoundingClientRect()
    const markerRect = markerRef.value.getBoundingClientRect()
    const linkRect = currentLinkEl.getBoundingClientRect()

    if (props.direction === 'horizontal') {
      const left = linkRect.left - bodyRect.left + bodyRef.value.scrollLeft
      markerStyle.value = {
        left: `${left}px`,
        width: `${linkRect.width}px`,
        opacity: 1,
      }
    } else {
      const top =
        linkRect.top -
        bodyRect.top +
        bodyRef.value.scrollTop +
        (linkRect.height - markerRect.height) / 2
      markerStyle.value = {
        top: `${top}px`,
        opacity: 1,
      }
    }
  })
}

// When the active link sits at the last visible row of the scrollable list
// (or beyond) while scrolling down, move it to the top of the visible area
// so the upcoming links stay visible. Mirror rule applies when scrolling up.
const scrollActiveIntoView = () => {
  const body = bodyRef.value
  const currentLinkEl = links[currentAnchor.value]
  if (!body || !currentLinkEl) return
  if (body.scrollHeight <= body.clientHeight) return
  // hidden by a collapsed parent (v-show keeps it registered)
  if (!currentLinkEl.offsetParent) return

  const linkTop = currentLinkEl.offsetTop
  const linkBottom = linkTop + currentLinkEl.offsetHeight
  const viewTop = body.scrollTop
  const viewBottom = viewTop + body.clientHeight

  const alignToTop = () => {
    body.scrollTop = Math.min(linkTop, body.scrollHeight - body.clientHeight)
  }

  if (scrollDirection === 'down' && linkBottom >= viewBottom) {
    alignToTop()
  } else if (scrollDirection === 'up' && linkTop <= viewTop) {
    alignToTop()
  }
}

watch(currentAnchor, updateMarkerStyle)
watch(() => slots.default?.(), updateMarkerStyle)

onMounted(() => {
  getContainer()
  const hash = decodeURIComponent(window.location.hash)
  const target = getElement(hash)
  if (target) {
    scrollTo(hash)
  } else {
    handleScroll()
  }
})

watch(
  () => props.container,
  () => {
    getContainer()
  }
)

provide(anchorKey, {
  ns,
  direction: props.direction,
  currentAnchor,
  showTooltip: props.showTooltip,
  addLink,
  removeLink,
  handleClick,
})

defineExpose({
  scrollTo,
})
</script>
