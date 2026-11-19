import { describe, expect, it } from 'vitest'
import {
  formatarReais,
  lerLimite,
  lerValor,
  MSG_CASAS_DECIMAIS,
  MSG_VALOR_INVALIDO,
  MSG_VALOR_POSITIVO,
  paraCampo,
  reaisParaCentavos,
} from './dinheiro'

describe('RN01 · valor do lançamento (lerValor)', () => {
  it('recusa zero, negativo e vazio com a mensagem do SPEC (CA13)', () => {
    for (const texto of ['0', '0,00', '-5', '-0,01', '', '   ']) {
      expect(lerValor(texto)).toEqual({ ok: false, erro: MSG_VALOR_POSITIVO })
    }
  })

  it('recusa texto não numérico', () => {
    for (const texto of ['abc', '12abc', '1,2,3', ',50', 'R$']) {
      const r = lerValor(texto)
      expect(r.ok).toBe(false)
    }
    expect(lerValor('abc')).toEqual({ ok: false, erro: MSG_VALOR_INVALIDO })
  })

  it('aceita o menor valor possível, R$ 0,01', () => {
    expect(lerValor('0,01')).toEqual({ ok: true, centavos: 1 })
  })

  it('aceita vírgula, ponto e prefixo R$', () => {
    expect(lerValor('25,9')).toEqual({ ok: true, centavos: 2590 })
    expect(lerValor('25.90')).toEqual({ ok: true, centavos: 2590 })
    expect(lerValor('R$ 30')).toEqual({ ok: true, centavos: 3000 })
    expect(lerValor('12,')).toEqual({ ok: true, centavos: 1200 })
  })

  it('aceita no máximo 2 casas decimais', () => {
    expect(lerValor('10,005')).toEqual({ ok: false, erro: MSG_CASAS_DECIMAIS })
  })

  it('não confunde "1.234" com R$ 1,23: vira erro', () => {
    expect(lerValor('1.234').ok).toBe(false)
  })

  it('não erra conta com centavos (sem ponto flutuante)', () => {
    expect(lerValor('0,10')).toEqual({ ok: true, centavos: 10 })
    expect(lerValor('1,15')).toEqual({ ok: true, centavos: 115 })
    expect(lerValor('4,35')).toEqual({ ok: true, centavos: 435 })
  })

  it('recusa valor acima do máximo', () => {
    expect(lerValor('10000000').ok).toBe(false)
    expect(lerValor('9999999,99')).toEqual({ ok: true, centavos: 999_999_999 })
  })
})

describe('limite de fiado (lerLimite)', () => {
  it('aceita zero (cliente não compra fiado)', () => {
    expect(lerLimite('0')).toEqual({ ok: true, centavos: 0 })
  })
  it('recusa vazio e negativo', () => {
    expect(lerLimite('').ok).toBe(false)
    expect(lerLimite('-1').ok).toBe(false)
  })
})

describe('formatação', () => {
  it('formata em reais com espaço comum', () => {
    expect(formatarReais(3000)).toBe('R$ 30,00')
    expect(formatarReais(5)).toBe('R$ 0,05')
    expect(formatarReais(123456)).toBe('R$ 1.234,56')
  })
  it('converte entre reais e centavos', () => {
    expect(reaisParaCentavos(30.01)).toBe(3001)
    expect(reaisParaCentavos(0.29)).toBe(29)
    expect(paraCampo(3050)).toBe('30,50')
  })
})
