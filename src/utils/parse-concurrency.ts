import { maxCores, minusCores, halfCores } from 'hardware-concurrency'

export function parseConcurrency(text: string): number | null {
  if (text === 'max') {
    return maxCores()
  }

  if (text === 'half') {
    return halfCores()
  }

  {
    const result = text.match(/^(?<threads>\d+)$/)
    if (result?.groups?.threads) {
      return Number.parseInt(result.groups.threads, 10)
    }
  }

  {
    const result = text.match(/^(?<percentage>\d+)%$/)
    if (result?.groups?.percentage) {
      const threads = Math.ceil(maxCores() * Number.parseInt(result.groups.percentage, 10) / 100)
      return threads
    }
  }

  {
    const result = text.match(/^-(?<minusThreads>\d+)$/)
    if (result?.groups?.minusThreads) {
      return minusCores(Number.parseInt(result.groups.minusThreads, 10))
    }
  }

  {
    const result = text.match(/^(?<numerator>\d+)\/(?<denominator>\d+)$/)
    if (result?.groups?.numerator && result?.groups?.denominator) {
      const numerator = Number.parseInt(result.groups.numerator, 10)
      const denominator = Number.parseInt(result.groups.denominator, 10)
      const threads = Math.ceil(maxCores() * numerator / denominator)
      return Math.max(0, threads)
    }
  }

  return null
}
