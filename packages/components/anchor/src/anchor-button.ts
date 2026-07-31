import { isString } from '@element-plus/utils'

import type AnchorButton from './anchor-button.vue'

export interface AnchorButtonLink {
  /**
   * @description the link name, shown as the button text when it is the next target
   */
  title: string
  /**
   * @description the address of the anchor link
   */
  href: string
}

export interface AnchorButtonProps {
  /**
   * @description anchor links to cycle through on each click
   */
  links?: AnchorButtonLink[]
  /**
   * @description scroll container
   */
  container?: string | HTMLElement | Window | null
  /**
   * @description Set the offset of the anchor scroll
   */
  offset?: number
  /**
   * @description Set the scroll duration of the container when the button is clicked, in milliseconds
   */
  duration?: number
}

export type AnchorButtonInstance = InstanceType<typeof AnchorButton> & unknown

export const anchorButtonEmits = {
  change: (href: string) => isString(href),
  click: (e: MouseEvent, href: string) =>
    e instanceof MouseEvent && isString(href),
}
export type AnchorButtonEmits = typeof anchorButtonEmits
