import { withInstall } from '@element-plus/utils'
import InputList from './src/input-list.vue'

import type { SFCWithInstall } from '@element-plus/utils'

export const ElInputList: SFCWithInstall<typeof InputList> =
  withInstall(InputList)
export default ElInputList

export * from './src/input-list'
