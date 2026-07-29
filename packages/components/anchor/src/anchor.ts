import {
  buildProps,
  definePropType,
  isString,
  isUndefined,
} from '@element-plus/utils'

import type { ExtractPublicPropTypes } from 'vue'
import type Anchor from './anchor.vue'

export interface AnchorProps {
  /**
   * @description scroll container
   */
  container?: string | HTMLElement | Window | null
  /**
   * @description Set the offset of the anchor scroll
   */
  offset?: number
  /**
   * @description The offset of the element starting to trigger the anchor
   */
  bound?: number
  /**
   * @description Set the scroll duration of the container when the anchor is clicked, in milliseconds
   */
  duration?: number
  /**
   * @description Whether to show the marker
   */
  marker?: boolean
  /**
   * @description Set Anchor type
   */
  type?: 'default' | 'underline'
  /**
   * @description Set Anchor direction
   */
  direction?: 'vertical' | 'horizontal'
  /**
   * @description Scroll whether link is selected at the top
   */
  selectScrollTop?: boolean
  /**
   * @description The title of the anchor
   */
  title?: string
  /**
   * @description Set Anchor variant
   */
  variant?: 'flat' | 'card'
  /**
   * @description Set Anchor size
   */
  size?: 'default' | 'small'
  /**
   * @description Whether the anchor can be collapsed
   */
  collapsible?: boolean
  /**
   * @description Whether the anchor is collapsed by default
   */
  defaultCollapsed?: boolean
  /**
   * @description The max height of the anchor list, the list scrolls internally when exceeded
   */
  maxHeight?: number | string
  /**
   * @description Whether to show a tooltip when the link title overflows
   */
  showTooltip?: boolean
}

/**
 * @deprecated Removed after 3.0.0, Use `AnchorProps` instead.
 */
export const anchorProps = buildProps({
  /**
   * @description scroll container
   */
  container: {
    type: definePropType<string | HTMLElement | Window | null>([
      String,
      Object,
    ]),
  },
  /**
   * @description Set the offset of the anchor scroll
   */
  offset: {
    type: Number,
    default: 0,
  },
  /**
   * @description The offset of the element starting to trigger the anchor
   */
  bound: {
    type: Number,
    default: 15,
  },
  /**
   * @description Set the scroll duration of the container when the anchor is clicked, in milliseconds
   */
  duration: {
    type: Number,
    default: 300,
  },
  /**
   * @description Whether to show the marker
   */
  marker: {
    type: Boolean,
    default: true,
  },
  /**
   * @description Set Anchor type
   */
  type: {
    type: definePropType<'default' | 'underline'>(String),
    default: 'default',
  },
  /**
   * @description Set Anchor direction
   */
  direction: {
    type: definePropType<'vertical' | 'horizontal'>(String),
    default: 'vertical',
  },
  /**
   * @description Scroll whether link is selected at the top
   */
  selectScrollTop: Boolean,
  /**
   * @description The title of the anchor
   */
  title: String,
  /**
   * @description Set Anchor variant
   */
  variant: {
    type: definePropType<'flat' | 'card'>(String),
    default: 'flat',
  },
  /**
   * @description Set Anchor size
   */
  size: {
    type: definePropType<'default' | 'small'>(String),
    default: 'default',
  },
  /**
   * @description Whether the anchor can be collapsed
   */
  collapsible: Boolean,
  /**
   * @description Whether the anchor is collapsed by default
   */
  defaultCollapsed: Boolean,
  /**
   * @description The max height of the anchor list, the list scrolls internally when exceeded
   */
  maxHeight: {
    type: definePropType<number | string>([Number, String]),
  },
  /**
   * @description Whether to show a tooltip when the link title overflows
   */
  showTooltip: {
    type: Boolean,
    default: true,
  },
})

/**
 * @deprecated Removed after 3.0.0, Use `AnchorProps` instead.
 */
export type AnchorPropsPublic = ExtractPublicPropTypes<typeof anchorProps>
export type AnchorInstance = InstanceType<typeof Anchor> & unknown

export const anchorEmits = {
  change: (href: string) => isString(href),
  click: (e: MouseEvent, href?: string) =>
    e instanceof MouseEvent && (isString(href) || isUndefined(href)),
}
export type AnchorEmits = typeof anchorEmits
