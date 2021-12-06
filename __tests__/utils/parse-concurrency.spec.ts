import { parseConcurrency } from '@utils/parse-concurrency'
import { maxCores, halfCores } from 'hardware-concurrency'

describe('parseConcurrency(text: string): number | null', () => {
  describe('n', () => {
    test('n = 0', () => {
      const result = parseConcurrency('0')

      expect(result).toBe(0)
    })

    test('n > 0', () => {
      const result = parseConcurrency('1')

      expect(result).toBe(1)
    })
  })

  test('max', () => {
    const result = parseConcurrency('max')

    expect(result).toBe(maxCores())
  })

  test('half', () => {
    const result = parseConcurrency('half')

    expect(result).toBe(halfCores())
  })

  describe('-n', () => {
    test('n = 0', () => {
      const result = parseConcurrency('-0')

      expect(result).toBe(maxCores())
    })

    test('n > maxCores()', () => {
      const result = parseConcurrency(`-${maxCores() + 1}`)

      expect(result).toBe(1)
    })

    test('maxCores() > n > 0', () => {
      const result = parseConcurrency(`-${halfCores()}`)

      expect(result).toBe(halfCores())
    })

    test('n = maxCores()', () => {
      const result = parseConcurrency(`-${maxCores()}`)

      expect(result).toBe(1)
    })
  })

  describe('n/m', () => {
    test('n = 0', () => {
      const result = parseConcurrency('0/1')

      expect(result).toBe(0)
    })

    test('n > m', () => {
      const result = parseConcurrency('2/1')

      expect(result).toBe(2 * maxCores())
    })

    test('n = m', () => {
      const result = parseConcurrency('1/1')

      expect(result).toBe(maxCores())
    })

    test('n < m', () => {
      const result = parseConcurrency('1/2')

      expect(result).toBe(halfCores())
    })
  })

  describe('n%', () => {
    test('n = 0', () => {
      const result = parseConcurrency('0%')

      expect(result).toBe(0)
    })

    test('100 > n > 0', () => {
      const result = parseConcurrency('50%')

      expect(result).toBe(halfCores())
    })

    test('n = 100', () => {
      const result = parseConcurrency('100%')

      expect(result).toBe(maxCores())
    })

    test('n > 100', () => {
      const result = parseConcurrency('200%')

      expect(result).toBe(2 * maxCores())
    })
  })

  test('invalid', () => {
    const result = parseConcurrency('-100%')

    expect(result).toBeNull()
  })
})
