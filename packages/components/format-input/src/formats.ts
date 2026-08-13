export type InputFormat = 'phone' | 'bankAccount' | 'idCard' | 'amount'

export interface InputFormatRule {
  formatter: (value: string) => string
  parser: (value: string) => string
  maxlength: number
}

const onlyDigits = (value: string) => value.replace(/\D/g, '')

export const inputFormatRules: Record<InputFormat, InputFormatRule> = {
  phone: {
    formatter(value) {
      const digits = onlyDigits(value).slice(0, 11)
      if (digits.length <= 3) return digits
      if (digits.length <= 7) return `${digits.slice(0, 3)} ${digits.slice(3)}`
      return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`
    },
    parser(value) {
      return onlyDigits(value).slice(0, 11)
    },
    maxlength: 13,
  },
  bankAccount: {
    formatter(value) {
      const digits = onlyDigits(value).slice(0, 19)
      return digits.replace(/(.{4})/g, '$1 ').trim()
    },
    parser(value) {
      return onlyDigits(value).slice(0, 19)
    },
    maxlength: 24,
  },
  idCard: {
    formatter(value) {
      const clean = value
        .replace(/\s/g, '')
        .toUpperCase()
        .replace(/[^0-9X]/g, '')
        .slice(0, 18)
      if (clean.length <= 6) return clean
      if (clean.length <= 14) return `${clean.slice(0, 6)} ${clean.slice(6)}`
      return `${clean.slice(0, 6)} ${clean.slice(6, 14)} ${clean.slice(14)}`
    },
    parser(value) {
      return value
        .replace(/\s/g, '')
        .toUpperCase()
        .replace(/[^0-9X]/g, '')
        .slice(0, 18)
    },
    maxlength: 20,
  },
  amount: {
    formatter(value) {
      const raw = String(value).replace(/,/g, '')
      const [int = '', dec = ''] = raw.split('.')
      const intPart = onlyDigits(int).slice(0, 15)
      const intWithSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      const decPart = onlyDigits(dec).slice(0, 2)
      if (decPart) return `${intWithSep}.${decPart}`
      // 保留刚输入的尾点，否则 '12.' 会被立即吞掉，小数无法连续输入
      return raw.includes('.') ? `${intWithSep}.` : intWithSep
    },
    parser(value) {
      const raw = String(value).replace(/,/g, '')
      const [int = '', dec = ''] = raw.split('.')
      const intPart = onlyDigits(int).slice(0, 15)
      const decPart = onlyDigits(dec).slice(0, 2)
      if (decPart) return `${intPart}.${decPart}`
      return raw.includes('.') ? `${intPart}.` : intPart
    },
    // 15 位整数千分位 19 字符 + '.00' = 22
    maxlength: 22,
  },
}
