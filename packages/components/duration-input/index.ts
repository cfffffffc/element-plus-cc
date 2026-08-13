import { withInstall } from '@element-plus/utils'
import DurationInput from './src/duration-input.vue'

import type { SFCWithInstall } from '@element-plus/utils'

export const ElDurationInput: SFCWithInstall<typeof DurationInput> =
  withInstall(DurationInput)
export default ElDurationInput

export * from './src/duration-input'
