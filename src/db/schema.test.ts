/**
 * Testa o supabase/schema.sql num Postgres de verdade (PGlite, roda em
 * memória): as regras de negócio e o RLS valem NO BANCO, mesmo quando
 * alguém ignora a tela e fala direto com a API.
 */
import { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import schema from '../../supabase/schema.sql?raw'
import prelude from './prelude.sql?raw'

const A = '11111111-1111-1111-1111-111111111111'
const B = '22222222-2222-2222-2222-222222222222'

let db: PGlite

/** Age como o Supabase: papel "authenticated" com o id do usuário, ou "anon". */
async function como(usuario: string | null) {
  await db.exec('reset role')
  if (usuario === null) {
    await db.exec(`select set_config('request.jwt.claim.sub', '', false); set role anon`)
  } else {
    await db.exec(`select set_config('request.jwt.claim.sub', '${usuario}', false); set role authenticated`)
  }
}

async function criarCliente(usuario: string, nome: string, limite: number): Promise<string> {
  await como(usuario)
  const r = await db.query<{ id: string }>(
    'insert into clientes (nome, limite) values ($1, $2) returning id',
    [nome, limite],
  )
  return r.rows[0].id
}

async function lancar(usuario: string, clienteId: string, tipo: string, valor: number) {
  await como(usuario)
  const r = await db.query<{ id: string }>(
    'insert into lancamentos (cliente_id, tipo, valor) values ($1, $2, $3) returning id',
    [clienteId, tipo, valor],
  )
  return r.rows[0].id
}

async function saldo(usuario: string, clienteId: string): Promise<number> {
  await como(usuario)
  const r = await db.query<{ saldo: string }>('select saldo from clientes_com_saldo where id = $1', [clienteId])
  return Number(r.rows[0].saldo)
}

beforeAll(async () => {
  db = new PGlite()
  await db.exec(prelude)
  await db.exec(schema)
  await db.exec(`insert into auth.users (id, email) values ('${A}', 'a@exemplo.com'), ('${B}', 'b@exemplo.com')`)
})

afterAll(async () => {
  await db.close()
})

beforeEach(async () => {
  await db.exec('reset role')
  await db.exec('truncate public.lancamentos, public.clientes')
})

describe('RN01 · valor maior que zero, no máximo 2 casas', () => {
  it('recusa valor 0, negativo e com 3 casas decimais, direto no banco', async () => {
    const c = await criarCliente(A, 'Maria', 200)
    await expect(lancar(A, c, 'compra', 0)).rejects.toThrow('O valor deve ser maior que zero.')
    await expect(lancar(A, c, 'compra', -5)).rejects.toThrow('O valor deve ser maior que zero.')
    await expect(lancar(A, c, 'pagamento', -5)).rejects.toThrow('O valor deve ser maior que zero.')
    await expect(lancar(A, c, 'compra', 10.005)).rejects.toThrow('Use no máximo 2 casas decimais.')
    expect(await saldo(A, c)).toBe(0)
  })

  it('aceita R$ 0,01', async () => {
    const c = await criarCliente(A, 'Maria', 200)
    await lancar(A, c, 'compra', 0.01)
    expect(await saldo(A, c)).toBeCloseTo(0.01, 2)
  })

  it('recusa tipo inválido', async () => {
    const c = await criarCliente(A, 'Maria', 200)
    await expect(lancar(A, c, 'doacao', 10)).rejects.toThrow('Tipo de lançamento inválido.')
  })
})

describe('RN01 · os CHECKs da tabela são a rede de segurança', () => {
  it('barram valor inválido mesmo se o gatilho fosse desligado', async () => {
    const c = await criarCliente(A, 'Maria', 200)
    await db.exec('reset role')
    await db.exec('alter table lancamentos disable trigger lancamentos_validar')
    for (const valor of [0, -5, 10.005]) {
      await expect(
        db.query(`insert into lancamentos (user_id, cliente_id, tipo, valor) values ($1, $2, 'compra', $3)`, [A, c, valor]),
      ).rejects.toThrow(/lancamentos_valor_ck/)
    }
    await db.exec('alter table lancamentos enable trigger lancamentos_validar')
  })
})

describe('RN02 · pagamento não passa da dívida', () => {
  it('aceita pagamento parcial e total (CA10, CA11)', async () => {
    const c = await criarCliente(A, 'Maria', 200)
    await lancar(A, c, 'compra', 50)
    await lancar(A, c, 'pagamento', 20)
    expect(await saldo(A, c)).toBe(30)
    await lancar(A, c, 'pagamento', 30)
    expect(await saldo(A, c)).toBe(0)
  })

  it('recusa R$ 30,01 com dívida de R$ 30 e informa a dívida (CA14)', async () => {
    const c = await criarCliente(A, 'Maria', 200)
    await lancar(A, c, 'compra', 30)
    await expect(lancar(A, c, 'pagamento', 30.01)).rejects.toThrow(
      'O pagamento não pode ser maior que a dívida atual (R$ 30,00).',
    )
    expect(await saldo(A, c)).toBe(30)
  })

  it('recusa qualquer pagamento com saldo zero (CA15)', async () => {
    const c = await criarCliente(A, 'Maria', 200)
    await expect(lancar(A, c, 'pagamento', 0.01)).rejects.toThrow('dívida atual (R$ 0,00)')
  })
})

describe('RN03 · compra não passa do limite', () => {
  it('recusa compra acima do limite e informa o disponível (CA16)', async () => {
    const c = await criarCliente(A, 'Maria', 200)
    await lancar(A, c, 'compra', 150)
    await expect(lancar(A, c, 'compra', 60)).rejects.toThrow(
      'Esta compra ultrapassa o limite de fiado (R$ 200,00). Valor disponível: R$ 50,00.',
    )
    expect(await saldo(A, c)).toBe(150)
  })

  it('aceita compra que chega exatamente ao limite (CA17)', async () => {
    const c = await criarCliente(A, 'Maria', 200)
    await lancar(A, c, 'compra', 150)
    await lancar(A, c, 'compra', 50)
    expect(await saldo(A, c)).toBe(200)
  })

  it('limite zero bloqueia qualquer compra (CA18)', async () => {
    const c = await criarCliente(A, 'Maria', 0)
    await expect(lancar(A, c, 'compra', 0.01)).rejects.toThrow('ultrapassa o limite de fiado')
  })

  it('reduzir o limite abaixo do saldo é permitido, mas bloqueia novas compras', async () => {
    const c = await criarCliente(A, 'Maria', 200)
    await lancar(A, c, 'compra', 150)
    await como(A)
    await db.query('update clientes set limite = 100 where id = $1', [c])
    await expect(lancar(A, c, 'compra', 1)).rejects.toThrow('Valor disponível: R$ 0,00.')
    await lancar(A, c, 'pagamento', 10) // pagar continua permitido
    expect(await saldo(A, c)).toBe(140)
  })
})

describe('editar e excluir lançamentos revalidam as regras', () => {
  it('excluir uma compra já paga em parte é bloqueado (RN02)', async () => {
    const c = await criarCliente(A, 'Maria', 200)
    const compra = await lancar(A, c, 'compra', 100)
    await lancar(A, c, 'pagamento', 40)
    await como(A)
    await expect(db.query('delete from lancamentos where id = $1', [compra])).rejects.toThrow(
      'pagamentos registrados ficariam maiores que a dívida',
    )
    expect(await saldo(A, c)).toBe(60)
  })

  it('excluir um pagamento recalcula o saldo (CA12)', async () => {
    const c = await criarCliente(A, 'Maria', 200)
    await lancar(A, c, 'compra', 100)
    const pag = await lancar(A, c, 'pagamento', 40)
    await como(A)
    await db.query('delete from lancamentos where id = $1', [pag])
    expect(await saldo(A, c)).toBe(100)
  })

  it('excluir um pagamento que estoura o limite é bloqueado (RN03)', async () => {
    const c = await criarCliente(A, 'Maria', 200)
    await lancar(A, c, 'compra', 100)
    const pag = await lancar(A, c, 'pagamento', 50)
    await como(A)
    await db.query('update clientes set limite = 60 where id = $1', [c])
    await expect(db.query('delete from lancamentos where id = $1', [pag])).rejects.toThrow(
      'ultrapassa o limite de fiado',
    )
  })

  it('editar o valor de um pagamento para além da dívida é bloqueado', async () => {
    const c = await criarCliente(A, 'Maria', 200)
    await lancar(A, c, 'compra', 50)
    const pag = await lancar(A, c, 'pagamento', 30)
    await como(A)
    await expect(db.query('update lancamentos set valor = 60 where id = $1', [pag])).rejects.toThrow(
      'pagamentos registrados ficariam maiores',
    )
    await db.query('update lancamentos set valor = 50 where id = $1', [pag])
    expect(await saldo(A, c)).toBe(0)
  })

  it('editar só a descrição passa mesmo com saldo acima do limite', async () => {
    const c = await criarCliente(A, 'Maria', 200)
    const compra = await lancar(A, c, 'compra', 150)
    await como(A)
    await db.query('update clientes set limite = 100 where id = $1', [c])
    await db.query(`update lancamentos set descricao = 'arroz e feijão' where id = $1`, [compra])
  })

  it('não permite mover um lançamento para outro cliente', async () => {
    const c1 = await criarCliente(A, 'Maria', 200)
    const c2 = await criarCliente(A, 'João', 200)
    const compra = await lancar(A, c1, 'compra', 10)
    await como(A)
    await expect(db.query('update lancamentos set cliente_id = $1 where id = $2', [c2, compra])).rejects.toThrow(
      'outro cliente',
    )
  })
})

describe('excluir cliente', () => {
  it('é bloqueado quando ainda deve (CA08)', async () => {
    const c = await criarCliente(A, 'Maria', 200)
    await lancar(A, c, 'compra', 30)
    await como(A)
    await expect(db.query('delete from clientes where id = $1', [c])).rejects.toThrow(
      'Este cliente ainda deve R$ 30,00. Registre o pagamento antes de excluir.',
    )
  })

  it('com saldo zero, exclui o cliente e o histórico (cascata)', async () => {
    const c = await criarCliente(A, 'Maria', 200)
    await lancar(A, c, 'compra', 30)
    await lancar(A, c, 'pagamento', 30)
    await como(A)
    await db.query('delete from clientes where id = $1', [c])
    const r = await db.query<{ n: string }>('select count(*) as n from lancamentos')
    expect(Number(r.rows[0].n)).toBe(0)
  })
})

describe('RN04 · isolamento entre comerciantes (RLS)', () => {
  it('A não enxerga os clientes nem os lançamentos de B, nem pela visão de saldo', async () => {
    const cb = await criarCliente(B, 'Cliente do B', 100)
    await lancar(B, cb, 'compra', 10)
    await criarCliente(A, 'Cliente do A', 100)

    await como(A)
    const nomes = (await db.query<{ nome: string }>('select nome from clientes')).rows.map((r) => r.nome)
    expect(nomes).toEqual(['Cliente do A'])
    expect((await db.query('select * from lancamentos')).rows).toHaveLength(0)
    expect((await db.query('select * from clientes_com_saldo where id = $1', [cb])).rows).toHaveLength(0)
  })

  it('acessar o ID de um cliente alheio retorna "não encontrado" (CA04)', async () => {
    const cb = await criarCliente(B, 'Cliente do B', 100)
    await como(A)
    expect((await db.query('select * from clientes where id = $1', [cb])).rows).toHaveLength(0)
  })

  it('A não consegue alterar nem apagar cliente de B (0 linhas afetadas)', async () => {
    const cb = await criarCliente(B, 'Cliente do B', 100)
    await como(A)
    const up = await db.query(`update clientes set nome = 'invadido' where id = $1`, [cb])
    expect(up.affectedRows).toBe(0)
    const del = await db.query('delete from clientes where id = $1', [cb])
    expect(del.affectedRows).toBe(0)
    await como(B)
    const r = await db.query<{ nome: string }>('select nome from clientes where id = $1', [cb])
    expect(r.rows[0].nome).toBe('Cliente do B')
  })

  it('A não consegue lançar na conta de um cliente de B', async () => {
    const cb = await criarCliente(B, 'Cliente do B', 100)
    await expect(lancar(A, cb, 'compra', 10)).rejects.toThrow('Cliente não encontrado.')
  })

  it('A não consegue criar linha em nome de B (user_id forjado)', async () => {
    await como(A)
    await expect(
      db.query('insert into clientes (user_id, nome, limite) values ($1, $2, $3)', [B, 'forjado', 10]),
    ).rejects.toThrow(/row-level security/)
  })

  it('A não consegue passar um cliente seu para B (troca de dono)', async () => {
    const c = await criarCliente(A, 'Maria', 100)
    await como(A)
    await expect(db.query('update clientes set user_id = $1 where id = $2', [B, c])).rejects.toThrow(
      /row-level security/,
    )
  })
})

describe('quem não fez login (anon)', () => {
  it('não lê, não apaga e não grava nada (E6 da aula: 401/403)', async () => {
    const c = await criarCliente(A, 'Maria', 100)
    await como(null)
    await expect(db.query('select * from clientes')).rejects.toThrow(/permission denied/)
    await expect(db.query('select * from lancamentos')).rejects.toThrow(/permission denied/)
    await expect(db.query('select * from clientes_com_saldo')).rejects.toThrow(/permission denied/)
    await expect(db.query('delete from clientes where id is not null')).rejects.toThrow(/permission denied/)
    await expect(db.query(`insert into clientes (nome, limite) values ('x', 1)`)).rejects.toThrow(/permission denied/)
    await como(A)
    expect((await db.query('select * from clientes where id = $1', [c])).rows).toHaveLength(1)
  })
})

describe('cadastro de cliente no banco', () => {
  it('recusa nome vazio, limite negativo e limite com 3 casas (CA06)', async () => {
    await como(A)
    await expect(db.query(`insert into clientes (nome, limite) values ('   ', 10)`)).rejects.toThrow(/clientes_nome_ck/)
    await expect(db.query(`insert into clientes (nome, limite) values ('Ana', -1)`)).rejects.toThrow(/clientes_limite_ck/)
    await expect(db.query(`insert into clientes (nome, limite) values ('Ana', 1.005)`)).rejects.toThrow(/clientes_limite_ck/)
    await expect(db.query(`insert into clientes (nome, limite) values ($1, 10)`, ['a'.repeat(81)])).rejects.toThrow(
      /clientes_nome_ck/,
    )
  })
})

describe('o próprio schema.sql', () => {
  it('pode ser executado duas vezes sem erro e sem perder dados', async () => {
    const c = await criarCliente(A, 'Maria', 200)
    await lancar(A, c, 'compra', 10)
    await db.exec('reset role')
    await db.exec(schema)
    expect(await saldo(A, c)).toBe(10)
  })

  it('migra a tabela de clientes criada na versão anterior (Marco 1) sem perder linhas', async () => {
    const antigo = new PGlite()
    await antigo.exec(prelude)
    await antigo.exec(`insert into auth.users (id) values ('${A}')`)
    await antigo.exec(`
      create table public.clientes (
        id uuid primary key default gen_random_uuid(),
        user_id uuid not null default auth.uid() references auth.users(id),
        nome text not null check (char_length(nome) between 1 and 80),
        limite numeric not null default 0 check (limite >= 0),
        created_at timestamptz default now()
      );
      alter table public.clientes enable row level security;
      create policy "dono acessa os proprios clientes" on public.clientes
        for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
      insert into public.clientes (user_id, nome, limite) values ('${A}', 'Cliente antigo', 150);
    `)
    await antigo.exec(schema)
    const r = await antigo.query<{ nome: string; telefone: string | null }>('select nome, telefone from clientes')
    expect(r.rows).toEqual([{ nome: 'Cliente antigo', telefone: null }])
    await antigo.close()
  })
})
