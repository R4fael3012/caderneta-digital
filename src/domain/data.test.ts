import { describe, expect, it } from 'vitest'
import { dataValida, formatarData, hojeISO } from './data'

describe('datas', () => {
  it('formata AAAA-MM-DD como DD/MM/AAAA', () => {
    expect(formatarData('2026-11-12')).toBe('12/11/2026')
  })
  it('hojeISO usa o dia local do aparelho', () => {
    expect(hojeISO(new Date(2026, 10, 5, 23, 59))).toBe('2026-11-05')
    expect(hojeISO(new Date(2026, 0, 9))).toBe('2026-01-09')
  })
  it('valida datas reais', () => {
    expect(dataValida('2026-02-28')).toBe(true)
    expect(dataValida('2026-02-30')).toBe(false)
    expect(dataValida('12/11/2026')).toBe(false)
    expect(dataValida('')).toBe(false)
  })
})
