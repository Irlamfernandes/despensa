import type { CompraValida } from '@/domain/compra';

import type { Banco } from '../banco';
import { buscarMercado, juntarMercados, listarMercados, renomearMercado } from '../catalogo';
import { buscarCompra, listarCompras, salvarCompra } from '../compras';
import { criarBancoDeTeste } from './banco-em-memoria';

jest.mock('expo-crypto', () => ({ randomUUID: () => jest.requireActual('crypto').randomUUID() }));

function compra(mercado: string): CompraValida {
  const item = { produto: 'Pão', quantidade: 1, unidade: 'un' as const, precoUnitario: 100 };
  return { mercado, data: '2026-10-12', itens: [{ ...item, total: 100 }], total: 100 };
}

async function mercadoDaCompra(banco: Banco, compraId: string): Promise<string> {
  const detalhe = await buscarCompra(banco, compraId);
  return detalhe!.mercadoId;
}

let banco: Banco;

beforeEach(async () => {
  banco = await criarBancoDeTeste();
});

describe('renomearMercado', () => {
  it('troca o nome e as próximas notas do mesmo CNPJ continuam nele', async () => {
    const nfce = { chave: '1'.repeat(44), cnpj: '12345678000199' };
    const id = await mercadoDaCompra(
      banco,
      await salvarCompra(banco, compra('SUPERMERCADOS X LTDA'), nfce),
    );

    expect(await renomearMercado(banco, id, 'Mercado X')).toEqual({ tipo: 'renomeado' });

    const outraNota = { chave: '2'.repeat(44), cnpj: nfce.cnpj };
    await salvarCompra(banco, compra('SUPERMERCADOS X LTDA'), outraNota);
    expect(await listarMercados(banco)).toEqual([{ id, nome: 'Mercado X' }]);
    expect(await buscarMercado(banco, id)).toEqual({ id, nome: 'Mercado X', cnpj: nfce.cnpj });
  });

  it('aceita mudar só a caixa do próprio nome', async () => {
    const id = await mercadoDaCompra(banco, await salvarCompra(banco, compra('mercado x')));
    expect(await renomearMercado(banco, id, 'Mercado X')).toEqual({ tipo: 'renomeado' });
  });

  it('não renomeia para o nome de outro mercado', async () => {
    const a = await mercadoDaCompra(banco, await salvarCompra(banco, compra('Mercado A')));
    const b = await mercadoDaCompra(banco, await salvarCompra(banco, compra('Mercado B')));

    expect(await renomearMercado(banco, a, 'mercado b')).toEqual({
      tipo: 'nome-em-uso',
      outro: { id: b, nome: 'Mercado B' },
    });
    expect((await buscarMercado(banco, a))?.nome).toBe('Mercado A');
  });
});

describe('juntarMercados', () => {
  it('move as compras, exclui a origem e passa o CNPJ para o destino', async () => {
    const nfce = { chave: '1'.repeat(44), cnpj: '12345678000199' };
    const daNota = await salvarCompra(banco, compra('SUPERMERCADOS X LTDA'), nfce);
    const manual = await salvarCompra(banco, compra('Mercado X'));
    const origem = await mercadoDaCompra(banco, daNota);
    const destino = await mercadoDaCompra(banco, manual);

    await juntarMercados(banco, origem, destino);

    expect(await listarMercados(banco)).toEqual([{ id: destino, nome: 'Mercado X' }]);
    expect((await listarCompras(banco)).map((c) => c.mercado)).toEqual(['Mercado X', 'Mercado X']);
    expect((await buscarMercado(banco, destino))?.cnpj).toBe(nfce.cnpj);
    expect(await buscarMercado(banco, origem)).toBeNull();
  });
});
