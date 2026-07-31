import { withInstall, withNoopInstall } from '@element-plus/utils'
import Anchor from './src/anchor.vue'
import AnchorLink from './src/anchor-link.vue'
import AnchorButton from './src/anchor-button.vue'

import type { SFCWithInstall } from '@element-plus/utils'

export const ElAnchor: SFCWithInstall<typeof Anchor> & {
  AnchorLink: typeof AnchorLink
  AnchorButton: typeof AnchorButton
} = withInstall(Anchor, {
  AnchorLink,
  AnchorButton,
})
export const ElAnchorLink: SFCWithInstall<typeof AnchorLink> =
  withNoopInstall(AnchorLink)
export const ElAnchorButton: SFCWithInstall<typeof AnchorButton> =
  withNoopInstall(AnchorButton)
export default ElAnchor

export * from './src/anchor'
export * from './src/anchor-button'
