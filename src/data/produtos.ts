import type { Centavos } from '@/domain/dinheiro';
import type { DataISO } from '@/domain/datas';
import type { Unidade } from '@/domain/quantidade';

import type { Banco } from './banco';

export interface ProdutoListado {
  id: string;
  nome: string;
  unidade: Unidade;
  ultimoPreco: Centavos;
  ultimaCompra: DataISO;
  vezesComprado: number;
}

export interface RegistroDePreco {
  data: DataISO;
  mercado: string;
  quantidade: number;
  unidade: Unidade;
  precoUnitario: Centavos;
}

export interface ProdutoDetalhado {
  id: string;
  nome: string;
  unidade: Unidade;
  historico: RegistroDePreco[];
}

// Itens e compras ativos, com o mercado e a data da compra.
const ITENS_ATIVOS = `
  FROM itens_compra i
  JOIN compras c ON c.id = i.compra_id AND c.excluido_em IS NULL
  JOIN mercados m ON m.id = c.mercado_id
 WHERE i.excluido_em IS NULL`;

/** Produtos já comprados, com o preço e a data da compra mais recente. */
export function listarProdutos(banco: Banco): Promise<ProdutoListado[]> {
  return banco.getAllAsync<ProdutoListado>(
    `WITH ultimos AS (
       SELECT i.produto_id, i.preco_unitario, c.data,
              ROW_NUMBER() OVER (PARTITION BY i.produto_id ORDER BY c.data DESC, c.criado_em DESC) AS ordem
       ${ITENS_ATIVOS}
     ),
     contagem AS (
       SELECT i.produto_id, COUNT(DISTINCT c.id) AS vezes
       ${ITENS_ATIVOS}
       GROUP BY i.produto_id
     )
     SELECT p.id, p.nome, p.unidade, u.preco_unitario AS ultimoPreco,
            u.data AS ultimaCompra, k.vezes AS vezesComprado
       FROM produtos p
       JOIN ultimos u ON u.produto_id = p.id AND u.ordem = 1
       JOIN contagem k ON k.produto_id = p.id
      WHERE p.excluido_em IS NULL
      ORDER BY p.nome_normalizado`,
    [],
  );
}

export async function buscarProduto(banco: Banco, id: string): Promise<ProdutoDetalhado | null> {
  const produto = await banco.getFirstAsync<Omit<ProdutoDetalhado, 'historico'>>(
    'SELECT id, nome, unidade FROM produtos WHERE id = ? AND excluido_em IS NULL',
    [id],
  );
  if (!produto) return null;

  const historico = await banco.getAllAsync<RegistroDePreco>(
    `SELECT c.data, m.nome AS mercado, i.quantidade, i.unidade, i.preco_unitario AS precoUnitario
     ${ITENS_ATIVOS} AND i.produto_id = ?
     ORDER BY c.data DESC, c.criado_em DESC`,
    [id],
  );
  return { ...produto, historico };
}
