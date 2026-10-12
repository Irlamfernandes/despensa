import type { CompraValida, ItemValido } from '@/domain/compra';
import type { Centavos } from '@/domain/dinheiro';
import type { DataISO } from '@/domain/datas';
import type { Unidade } from '@/domain/quantidade';

import { agoraISO, type Banco } from './banco';
import { buscarOuCriarMercado, buscarOuCriarProduto } from './catalogo';
import { novoId } from './ids';

export type OrigemDaCompra = 'manual' | 'nfce';

export interface CompraListada {
  id: string;
  data: DataISO;
  total: Centavos;
  mercado: string;
  quantidadeDeItens: number;
}

export interface ItemDaCompra {
  produtoId: string;
  produto: string;
  quantidade: number;
  unidade: Unidade;
  precoUnitario: Centavos;
  total: Centavos;
}

export interface CompraDetalhada {
  id: string;
  data: DataISO;
  total: Centavos;
  mercado: string;
  itens: ItemDaCompra[];
}

async function inserirItem(banco: Banco, compraId: string, item: ItemValido): Promise<void> {
  const produtoId = await buscarOuCriarProduto(banco, {
    nome: item.produto,
    unidade: item.unidade,
  });
  const agora = agoraISO();
  await banco.runAsync(
    `INSERT INTO itens_compra
       (id, compra_id, produto_id, quantidade, unidade, preco_unitario, total, criado_em, atualizado_em)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      novoId(),
      compraId,
      produtoId,
      item.quantidade,
      item.unidade,
      item.precoUnitario,
      item.total,
      agora,
      agora,
    ],
  );
}

/** Grava a compra, o mercado e os produtos novos numa única transação. Devolve o id da compra. */
export async function salvarCompra(
  banco: Banco,
  compra: CompraValida,
  origem: OrigemDaCompra = 'manual',
): Promise<string> {
  const id = novoId();
  await banco.withTransactionAsync(async () => {
    const mercadoId = await buscarOuCriarMercado(banco, compra.mercado);
    const agora = agoraISO();
    await banco.runAsync(
      `INSERT INTO compras (id, mercado_id, data, total, origem, criado_em, atualizado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, mercadoId, compra.data, compra.total, origem, agora, agora],
    );
    for (const item of compra.itens) {
      await inserirItem(banco, id, item);
    }
  });
  return id;
}

/** Compras ativas, da mais recente para a mais antiga. */
export function listarCompras(banco: Banco): Promise<CompraListada[]> {
  return banco.getAllAsync<CompraListada>(
    `SELECT c.id, c.data, c.total, m.nome AS mercado,
            (SELECT COUNT(*) FROM itens_compra i
              WHERE i.compra_id = c.id AND i.excluido_em IS NULL) AS quantidadeDeItens
       FROM compras c
       JOIN mercados m ON m.id = c.mercado_id
      WHERE c.excluido_em IS NULL
      ORDER BY c.data DESC, c.criado_em DESC`,
    [],
  );
}

export async function buscarCompra(banco: Banco, id: string): Promise<CompraDetalhada | null> {
  const compra = await banco.getFirstAsync<Omit<CompraDetalhada, 'itens'>>(
    `SELECT c.id, c.data, c.total, m.nome AS mercado
       FROM compras c
       JOIN mercados m ON m.id = c.mercado_id
      WHERE c.id = ? AND c.excluido_em IS NULL`,
    [id],
  );
  if (!compra) return null;

  const itens = await banco.getAllAsync<ItemDaCompra>(
    `SELECT i.produto_id AS produtoId, p.nome AS produto, i.quantidade, i.unidade,
            i.preco_unitario AS precoUnitario, i.total
       FROM itens_compra i
       JOIN produtos p ON p.id = i.produto_id
      WHERE i.compra_id = ? AND i.excluido_em IS NULL
      ORDER BY p.nome_normalizado`,
    [id],
  );
  return { ...compra, itens };
}

/** Exclusão lógica da compra e dos seus itens. */
export async function excluirCompra(banco: Banco, id: string): Promise<void> {
  const agora = agoraISO();
  await banco.withTransactionAsync(async () => {
    await banco.runAsync(
      'UPDATE itens_compra SET excluido_em = ?, atualizado_em = ? WHERE compra_id = ? AND excluido_em IS NULL',
      [agora, agora, id],
    );
    await banco.runAsync(
      'UPDATE compras SET excluido_em = ?, atualizado_em = ? WHERE id = ? AND excluido_em IS NULL',
      [agora, agora, id],
    );
  });
}
