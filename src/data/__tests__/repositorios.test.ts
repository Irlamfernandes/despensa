import type { CompraValida, ItemValido } from '@/domain/compra';

import type { Banco } from '../banco';
import { listarMercados, listarProdutosDoCatalogo } from '../catalogo';
import { buscarCompra, excluirCompra, listarCompras, salvarCompra } from '../compras';
import { VERSAO_ATUAL, migrar } from '../migracoes';
import { buscarProduto, listarProdutos } from '../produtos';
import { listarComprasResumidas, listarDatasDeCompraPorProduto } from '../resumo';
import { criarBancoDeTeste } from './banco-em-memoria';

jest.mock('expo-crypto', () => ({ randomUUID: () => jest.requireActual('crypto').randomUUID() }));

function item(produto: string, quantidade: number, precoUnitario: number): ItemValido {
  return {
    produto,
    quantidade,
    unidade: 'un',
    precoUnitario,
    total: Math.round(quantidade * precoUnitario),
  };
}

function compra(mercado: string, data: string, itens: ItemValido[]): CompraValida {
  return { mercado, data, itens, total: itens.reduce((soma, i) => soma + i.total, 0) };
}

let banco: Banco;

beforeEach(async () => {
  banco = await criarBancoDeTeste();
});

describe('migrações', () => {
  it('deixam o banco na versão atual e podem rodar de novo sem efeito', async () => {
    await migrar(banco);
    const linha = await banco.getFirstAsync<{ user_version: number }>('PRAGMA user_version', []);
    expect(linha?.user_version).toBe(VERSAO_ATUAL);
  });
});

describe('salvarCompra', () => {
  it('grava a compra com os itens e lista da mais recente para a mais antiga', async () => {
    await salvarCompra(banco, compra('Mercado A', '2026-10-01', [item('Arroz', 1, 2490)]));
    const id = await salvarCompra(
      banco,
      compra('Mercado B', '2026-10-05', [item('Leite', 12, 499), item('Café', 1, 1890)]),
    );

    expect(await listarCompras(banco)).toEqual([
      { id, data: '2026-10-05', total: 7878, mercado: 'Mercado B', quantidadeDeItens: 2 },
      expect.objectContaining({ data: '2026-10-01', mercado: 'Mercado A', quantidadeDeItens: 1 }),
    ]);
    expect(await buscarCompra(banco, id)).toMatchObject({
      mercado: 'Mercado B',
      total: 7878,
      itens: [
        { produto: 'Café', quantidade: 1, precoUnitario: 1890, total: 1890 },
        { produto: 'Leite', quantidade: 12, precoUnitario: 499, total: 5988 },
      ],
    });
  });

  it('reaproveita mercado e produto com o mesmo nome, ignorando acento e caixa', async () => {
    await salvarCompra(banco, compra('Supermercado São João', '2026-10-01', [item('Pão', 1, 100)]));
    await salvarCompra(banco, compra('supermercado sao joao', '2026-10-02', [item('PAO', 2, 100)]));

    expect(await listarMercados(banco)).toHaveLength(1);
    expect(await listarProdutosDoCatalogo(banco)).toEqual([
      expect.objectContaining({ nome: 'Pão', unidade: 'un' }),
    ]);
  });

  it('não grava nada se algum item falhar', async () => {
    const invalida = compra('Mercado A', '2026-10-01', [
      item('Arroz', 1, 100),
      item('Feijão', 0, 100),
    ]);
    await expect(salvarCompra(banco, invalida)).rejects.toThrow();

    expect(await listarCompras(banco)).toEqual([]);
    expect(await listarMercados(banco)).toEqual([]);
  });
});

describe('excluirCompra', () => {
  it('tira a compra e os itens das listagens e estatísticas', async () => {
    const id = await salvarCompra(
      banco,
      compra('Mercado A', '2026-10-01', [item('Arroz', 1, 2490)]),
    );
    await excluirCompra(banco, id);

    expect(await listarCompras(banco)).toEqual([]);
    expect(await buscarCompra(banco, id)).toBeNull();
    expect(await listarProdutos(banco)).toEqual([]);
    expect(await listarComprasResumidas(banco)).toEqual([]);
  });
});

describe('produtos', () => {
  beforeEach(async () => {
    await salvarCompra(banco, compra('Mercado A', '2026-09-01', [item('Café', 1, 1790)]));
    await salvarCompra(banco, compra('Mercado B', '2026-09-20', [item('Café', 2, 1890)]));
  });

  it('lista com o último preço e quantas vezes foi comprado', async () => {
    expect(await listarProdutos(banco)).toEqual([
      expect.objectContaining({
        nome: 'Café',
        ultimoPreco: 1890,
        ultimaCompra: '2026-09-20',
        vezesComprado: 2,
      }),
    ]);
  });

  it('mostra o histórico de preço por mercado, do mais recente ao mais antigo', async () => {
    const [cafe] = await listarProdutos(banco);
    expect((await buscarProduto(banco, cafe?.id ?? ''))?.historico).toEqual([
      {
        data: '2026-09-20',
        mercado: 'Mercado B',
        quantidade: 2,
        unidade: 'un',
        precoUnitario: 1890,
      },
      {
        data: '2026-09-01',
        mercado: 'Mercado A',
        quantidade: 1,
        unidade: 'un',
        precoUnitario: 1790,
      },
    ]);
  });

  it('agrupa os dias de compra de cada produto', async () => {
    expect(await listarDatasDeCompraPorProduto(banco)).toEqual([
      expect.objectContaining({ nome: 'Café', datas: ['2026-09-01', '2026-09-20'] }),
    ]);
  });
});
