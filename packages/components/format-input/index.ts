import { withInstall, withNoopInstall } from '@element-plus/utils'
import FormatInput from './src/format-input.vue'
import PhoneInput from './src/phone-input.vue'
import BankAccountInput from './src/bank-account-input.vue'
import IdCardInput from './src/id-card-input.vue'
import AmountInput from './src/amount-input.vue'

import type { SFCWithInstall } from '@element-plus/utils'

export const ElFormatInput: SFCWithInstall<typeof FormatInput> =
  withInstall(FormatInput)
export const ElPhoneInput: SFCWithInstall<typeof PhoneInput> =
  withNoopInstall(PhoneInput)
export const ElBankAccountInput: SFCWithInstall<typeof BankAccountInput> =
  withNoopInstall(BankAccountInput)
export const ElIdCardInput: SFCWithInstall<typeof IdCardInput> =
  withNoopInstall(IdCardInput)
export const ElAmountInput: SFCWithInstall<typeof AmountInput> =
  withNoopInstall(AmountInput)
export default ElFormatInput

export * from './src/format-input'
export * from './src/formats'
