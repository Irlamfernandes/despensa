import type { CompraValida } from '@/domain/compra';

import type { Banco } from '../banco';
import { listarProdutosDoCatalogo } from '../catalogo';
import { excluirCompra, salvarCompra } from '../compras';
import {
  adicionarNaLista,
  alterarItemDaLista,
  carregarLista,
  diminuirNaLista,
  removerDaLista,
  responderEquivalencia,
} from '../lista';
import { criarBancoDeTeste } from './banco-em-memoria';

jest.mock('expo-crypto', () => ({ randomUUID: () => jest.requireActual('crypto').randomUUID() }));

function compraDeSuco(quantidade: number): CompraValida {
  const item = { produto: 'Suco em pó', quantidade, unidade: 'un' as const, precoUnitario: 150 };
  const total = quantidade * 150;
  return { mercado: 'Mercado A', data: '2026-10-12', itens: [{ ...item, total }], total };
}

/** Faz o relógio (usado em criado_em/desde) andar para o instante dado. */
function noInstante(iso: string) {
  jest.setSystemTime(new Date(iso));
}

let banco: Banco;

beforeEach(async () => {
  jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
  noInstante('2026-10-12T10:00:00.000Z');
  banco = await criarBancoDeTeste();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('lista de compras', () => {
  it('desconta só as compras registradas depois de o item entrar na lista', async () => {
    await salvarCompra(banco, compraDeSuco(5));
    noInstante('2026-10-12T11:00:00.000Z');
    await adicionarNaLista(banco, { produto: 'Suco em pó', quantidade: 30, unidade: 'un' });
    noInstante('2026-10-12T12:00:00.000Z');
    await salvarCompra(banco, compraDeSuco(3));

    const lista = await carregarLista(banco);
    expect(lista.pendentes).toEqual([
      expect.objectContaining({ produto: 'Suco em pó', quantidade: 30, comprado: 3, falta: 27 }),
    ]);
    expect(lista.comprados).toEqual([]);
  });

  it('usa o produto do catálogo e cadastra um novo se precisar', async () => {
    await salvarCompra(banco, compraDeSuco(1));
    await adicionarNaLista(banco, { produto: 'SUCO EM PO', quantidade: 2, unidade: 'un' });
    await adicionarNaLista(banco, { produto: 'Detergente', quantidade: 1, unidade: 'un' });

    expect(await listarProdutosDoCatalogo(banco)).toHaveLength(2);
  });

  it('adicionar de novo o mesmo produto redefine a quantidade', async () => {
    await adicionarNaLista(banco, { produto: 'Arroz', quantidade: 1, unidade: 'un' });
    await adicionarNaLista(banco, { produto: 'arroz', quantidade: 2, unidade: 'kg' });

    const { pendentes } = await carregarLista(banco);
    expect(pendentes).toEqual([expect.objectContaining({ quantidade: 2, unidade: 'kg' })]);
  });

  it('alterar a quantidade zera o que já foi descontado', async () => {
    await adicionarNaLista(banco, { produto: 'Suco em pó', quantidade: 30, unidade: 'un' });
    noInstante('2026-10-12T11:00:00.000Z');
    await salvarCompra(banco, compraDeSuco(3));
    const [item] = (await carregarLista(banco)).pendentes;

    noInstante('2026-10-12T12:00:00.000Z');
    await alterarItemDaLista(banco, item!.id, { quantidade: 10, unidade: 'un' });

    expect((await carregarLista(banco)).pendentes).toEqual([
      expect.objectContaining({ quantidade: 10, comprado: 0, falta: 10 }),
    ]);
  });

  it('item comprado por completo vai para comprados; excluir a compra devolve', async () => {
    await adicionarNaLista(banco, { produto: 'Suco em pó', quantidade: 3, unidade: 'un' });
    noInstante('2026-10-12T11:00:00.000Z');
    const compraId = await salvarCompra(banco, compraDeSuco(3));
    expect((await carregarLista(banco)).comprados).toHaveLength(1);

    await excluirCompra(banco, compraId);
    expect((await carregarLista(banco)).pendentes).toEqual([expect.objectContaining({ falta: 3 })]);
  });

  it('remove itens da lista', async () => {
    await adicionarNaLista(banco, { produto: 'Arroz', quantidade: 1, unidade: 'un' });
    const [item] = (await carregarLista(banco)).pendentes;
    await removerDaLista(banco, [item!.id]);

    expect(await carregarLista(banco)).toEqual({ pendentes: [], comprados: [], sugestoes: [] });
  });
});

function compraDe(produto: string, quantidade: number): CompraValida {
  const item = { produto, quantidade, unidade: 'un' as const, precoUnitario: 100 };
  const total = quantidade * 100;
  return { mercado: 'Mercado A', data: '2026-10-12', itens: [{ ...item, total }], total };
}

describe('nomes diferentes', () => {
  beforeEach(async () => {
    await adicionarNaLista(banco, { produto: 'Suco em pó', quantidade: 30, unidade: 'un' });
    noInstante('2026-10-12T11:00:00.000Z');
    await salvarCompra(banco, compraDe('SUCO PO TANG LARANJA 25G', 3));
    await salvarCompra(banco, compraDe('PAPEL HIGIENICO', 1));
  });

  async function primeiraSugestao() {
    const { sugestoes } = await carregarLista(banco);
    expect(sugestoes).toHaveLength(1);
    const [sugestao] = sugestoes;
    return {
      produtoId: sugestao!.item.produtoId,
      equivalenteId: sugestao!.compra.produtoId,
      nome: sugestao!.compra.nome,
    };
  }

  it('pergunta só sobre o produto de nome parecido', async () => {
    expect((await primeiraSugestao()).nome).toBe('SUCO PO TANG LARANJA 25G');
  });

  it('com "sim", desconta agora e nas próximas compras', async () => {
    const { produtoId, equivalenteId } = await primeiraSugestao();
    await responderEquivalencia(banco, { produtoId, equivalenteId, equivale: true });
    await salvarCompra(banco, compraDe('SUCO PO TANG LARANJA 25G', 2));

    const lista = await carregarLista(banco);
    expect(lista.pendentes).toEqual([expect.objectContaining({ comprado: 5, falta: 25 })]);
    expect(lista.sugestoes).toEqual([]);
  });

  it('com "não", não desconta nem pergunta de novo', async () => {
    const { produtoId, equivalenteId } = await primeiraSugestao();
    await responderEquivalencia(banco, { produtoId, equivalenteId, equivale: false });

    const lista = await carregarLista(banco);
    expect(lista.pendentes).toEqual([expect.objectContaining({ falta: 30 })]);
    expect(lista.sugestoes).toEqual([]);
  });

  it('mudar de ideia troca a resposta', async () => {
    const { produtoId, equivalenteId } = await primeiraSugestao();
    await responderEquivalencia(banco, { produtoId, equivalenteId, equivale: false });
    await responderEquivalencia(banco, { produtoId, equivalenteId, equivale: true });

    expect((await carregarLista(banco)).pendentes).toEqual([
      expect.objectContaining({ falta: 27 }),
    ]);
  });
});

describe('diminuirNaLista', () => {
  it('diminui à mão e remove quando não falta mais nada', async () => {
    await adicionarNaLista(banco, { produto: 'Arroz', quantidade: 5, unidade: 'un' });
    const [item] = (await carregarLista(banco)).pendentes;

    await diminuirNaLista(banco, item!, 2);
    const [depois] = (await carregarLista(banco)).pendentes;
    expect(depois).toMatchObject({ quantidade: 3, falta: 3 });

    await diminuirNaLista(banco, depois!, 3);
    expect((await carregarLista(banco)).pendentes).toEqual([]);
  });
});
