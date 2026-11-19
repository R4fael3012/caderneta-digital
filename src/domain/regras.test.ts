import { describe, expect, it } from 'vitest'
import type { Cliente, Lancamento } from './tipos'
import {
  contarDevedores,
  filtrarClientes,
  ordenarHistorico,
  saldoDoCliente,
  totalAReceber,
  validarCliente,
  validarEntradaLancamento,
  validarExclusaoCliente,
  validarMudanca,
} from './regras'

const reais = (n: number) => Math.round(n * 100)

/** compra nova para um cliente com `saldo` e `limite` (em reais) */
const comprar = (valor: number, saldo: number, limite: number) =>
  validarMudanca({
    operacao: 'criar',
    saldoAtual: reais(saldo),
    limite: reais(limite),
    novo: { tipo: 'compra', valor: reais(valor) },
  })

const pagar = (valor: number, saldo: number, limite = 200) =>
  validarMudanca({
    operacao: 'criar',
    saldoAtual: reais(saldo),
    limite: reais(limite),
    novo: { tipo: 'pagamento', valor: reais(valor) },
  })

describe('saldo do cliente', () => {
  it('é compras menos pagamentos (CA09, CA10)', () => {
    expect(saldoDoCliente([])).toBe(0)
    expect(saldoDoCliente([{ tipo: 'compra', valor: 5000 }])).toBe(5000)
    expect(
      saldoDoCliente([
        { tipo: 'compra', valor: 5000 },
        { tipo: 'pagamento', valor: 2000 },
      ]),
    ).toBe(3000)
  })
})

describe('RN01 · valor maior que zero', () => {
  it('recusa lançamento de valor zero ou negativo, e o saldo não muda (CA13)', () => {
    expect(comprar(0, 0, 200)).toBe('O valor deve ser maior que zero.')
    expect(pagar(-1, 30)).toBe('O valor deve ser maior que zero.')
  })
})

describe('RN02 · pagamento não passa da dívida', () => {
  it('aceita pagamento menor que o saldo (CA10)', () => {
    expect(pagar(20, 50)).toBeNull()
  })
  it('aceita pagamento igual ao saldo, que zera a dívida (CA11)', () => {
    expect(pagar(30, 30)).toBeNull()
  })
  it('recusa R$ 30,01 quando a dívida é R$ 30 e informa a dívida (CA14)', () => {
    expect(pagar(30.01, 30)).toBe('O pagamento não pode ser maior que a dívida atual (R$ 30,00).')
  })
  it('recusa qualquer pagamento quando o saldo é zero (CA15)', () => {
    expect(pagar(0.01, 0)).toBe('O pagamento não pode ser maior que a dívida atual (R$ 0,00).')
  })
})

describe('RN03 · compra não passa do limite', () => {
  it('recusa compra que passa do limite e informa o disponível (CA16)', () => {
    expect(comprar(60, 150, 200)).toBe(
      'Esta compra ultrapassa o limite de fiado (R$ 200,00). Valor disponível: R$ 50,00.',
    )
  })
  it('aceita compra que deixa o saldo exatamente no limite (CA17)', () => {
    expect(comprar(50, 150, 200)).toBeNull()
  })
  it('recusa R$ 0,01 acima do limite', () => {
    expect(comprar(50.01, 150, 200)).not.toBeNull()
  })
  it('limite zero bloqueia qualquer compra (CA18)', () => {
    expect(comprar(0.01, 0, 0)).toBe(
      'Esta compra ultrapassa o limite de fiado (R$ 0,00). Valor disponível: R$ 0,00.',
    )
  })
  it('compra com saldo já acima do limite (limite reduzido) é recusada', () => {
    expect(comprar(1, 150, 100)).toContain('Valor disponível: R$ 0,00.')
  })
})

describe('editar e excluir lançamentos revalidam as regras', () => {
  it('excluir uma compra já paga em parte é bloqueado (RN02)', () => {
    // compra 100 e pagamento 40 => saldo 60; excluir a compra deixaria -40
    const erro = validarMudanca({
      operacao: 'excluir',
      saldoAtual: reais(60),
      limite: reais(200),
      antigo: { tipo: 'compra', valor: reais(100) },
    })
    expect(erro).toBe('Não é possível: os pagamentos registrados ficariam maiores que a dívida do cliente.')
  })

  it('excluir um pagamento é permitido se a dívida cabe no limite', () => {
    expect(
      validarMudanca({
        operacao: 'excluir',
        saldoAtual: reais(100),
        limite: reais(200),
        antigo: { tipo: 'pagamento', valor: reais(50) },
      }),
    ).toBeNull()
  })

  it('excluir um pagamento que estoura o limite é bloqueado (RN03)', () => {
    expect(
      validarMudanca({
        operacao: 'excluir',
        saldoAtual: reais(100),
        limite: reais(120),
        antigo: { tipo: 'pagamento', valor: reais(50) },
      }),
    ).toContain('ultrapassa o limite de fiado')
  })

  it('editar só a descrição (mesmo valor) passa mesmo com saldo acima do limite', () => {
    const l = { tipo: 'compra', valor: reais(80) } as const
    expect(
      validarMudanca({ operacao: 'editar', saldoAtual: reais(150), limite: reais(100), antigo: l, novo: l }),
    ).toBeNull()
  })

  it('editar o valor de um pagamento para além da dívida é bloqueado', () => {
    expect(
      validarMudanca({
        operacao: 'editar',
        saldoAtual: reais(20), // compra 50, pagamento 30
        limite: reais(200),
        antigo: { tipo: 'pagamento', valor: reais(30) },
        novo: { tipo: 'pagamento', valor: reais(60) },
      }),
    ).not.toBeNull()
  })
})

describe('cadastro de cliente', () => {
  it('aceita nome e limite válidos (CA05)', () => {
    expect(validarCliente({ nome: '  Maria   Souza ', telefone: '', limite: '200' })).toEqual({
      ok: true,
      dados: { nome: 'Maria Souza', telefone: null, limite: 20000 },
    })
  })
  it('recusa nome vazio e limite negativo, indicando o campo (CA06)', () => {
    const r = validarCliente({ nome: '   ', telefone: '', limite: '-10' })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.erros.nome).toBe('Informe o nome do cliente (até 80 caracteres).')
      expect(r.erros.limite).toBeDefined()
    }
  })
  it('recusa nome com mais de 80 caracteres', () => {
    expect(validarCliente({ nome: 'a'.repeat(81), telefone: '', limite: '0' }).ok).toBe(false)
  })
  it('recusa excluir cliente com dívida e libera com saldo zero (CA08)', () => {
    expect(validarExclusaoCliente(3000)).toBe(
      'Este cliente ainda deve R$ 30,00. Registre o pagamento antes de excluir.',
    )
    expect(validarExclusaoCliente(0)).toBeNull()
  })
})

const cliente = (nome: string, saldo: number): Cliente => ({
  id: nome,
  nome,
  telefone: null,
  limite: 100000,
  saldo: reais(saldo),
})

describe('consulta e resumo', () => {
  const lista = [cliente('Maria Souza', 50), cliente('João Silva', 30), cliente('Joana Lima', 0)]

  it('busca "joa" acha João e Joana, sem diferenciar maiúsculas e acentos (CA19)', () => {
    const nomes = filtrarClientes(lista, 'joa', false).map((c) => c.nome)
    expect(nomes).toEqual(['João Silva', 'Joana Lima'])
    expect(filtrarClientes(lista, 'JOÃO', false).map((c) => c.nome)).toEqual(['João Silva'])
    expect(filtrarClientes(lista, 'joao', false).map((c) => c.nome)).toEqual(['João Silva'])
  })

  it('filtro "devedores" mostra só saldo > 0 e combina com a busca (CA20)', () => {
    expect(filtrarClientes(lista, '', true).map((c) => c.nome)).toEqual(['Maria Souza', 'João Silva'])
    expect(filtrarClientes(lista, 'joa', true).map((c) => c.nome)).toEqual(['João Silva'])
  })

  it('total a receber soma os saldos: R$ 50 + R$ 30 + R$ 0 = R$ 80 (CA21)', () => {
    expect(totalAReceber(lista)).toBe(8000)
    expect(contarDevedores(lista)).toBe(2)
  })

  it('sem clientes, o total é zero (CA23)', () => {
    expect(totalAReceber([])).toBe(0)
  })

  it('histórico vem do mais recente para o mais antigo (RF09)', () => {
    const l = (id: string, data: string, criadoEm: string): Lancamento => ({
      id,
      clienteId: 'c',
      tipo: 'compra',
      valor: 100,
      descricao: null,
      data,
      criadoEm,
    })
    const ordem = ordenarHistorico([
      l('antigo', '2026-11-01', '2026-11-01T10:00:00Z'),
      l('novo', '2026-11-10', '2026-11-10T09:00:00Z'),
      l('novo-depois', '2026-11-10', '2026-11-10T15:00:00Z'),
    ]).map((x) => x.id)
    expect(ordem).toEqual(['novo-depois', 'novo', 'antigo'])
  })
})

describe('formulário de lançamento (validarEntradaLancamento)', () => {
  const contexto = { saldoAtual: reais(150), limite: reais(200) }
  const base = { tipo: 'compra', valor: '50', data: '2026-11-12', descricao: ' arroz ' } as const

  it('aceita uma compra válida e limpa a descrição', () => {
    expect(validarEntradaLancamento(base, contexto)).toEqual({
      ok: true,
      dados: { tipo: 'compra', valor: 5000, data: '2026-11-12', descricao: 'arroz' },
    })
  })

  it('manda a mensagem da regra para o campo valor (RN03)', () => {
    const r = validarEntradaLancamento({ ...base, valor: '60' }, contexto)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.erros.valor).toContain('Valor disponível: R$ 50,00.')
  })

  it('recusa valor vazio, data inválida e descrição longa de uma vez', () => {
    const r = validarEntradaLancamento(
      { tipo: 'compra', valor: '', data: '', descricao: 'x'.repeat(121) },
      contexto,
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(Object.keys(r.erros).sort()).toEqual(['data', 'descricao', 'valor'])
  })
})
