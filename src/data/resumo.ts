import type { DataISO } from '@/domain/datas';
import type { CompraResumida } from '@/domain/estatisticas';
import type { DatasDeCompraDoProduto } from '@/domain/painel';

import type { Banco } from './banco';

/** Total de cada compra ativa, para as estatísticas mensais. */
export function listarComprasResumidas(banco: Banco): Promise<CompraResumida[]> {
  return banco.getAllAsync<CompraResumida>(
    `SELECT c.data, c.total, m.nome AS mercado
       FROM compras c
       JOIN mercados m ON m.id = c.mercado_id
      WHERE c.excluido_em IS NULL`,
    [],
  );
}

/** Para cada produto, os dias em que ele foi comprado (em ordem), para prever a reposição. */
export async function listarDatasDeCompraPorProduto(
  banco: Banco,
): Promise<DatasDeCompraDoProduto[]> {
  const linhas = await banco.getAllAsync<{ produtoId: string; nome: string; data: DataISO }>(
    `SELECT DISTINCT p.id AS produtoId, p.nome, c.data
       FROM itens_compra i
       JOIN compras c ON c.id = i.compra_id AND c.excluido_em IS NULL
       JOIN produtos p ON p.id = i.produto_id AND p.excluido_em IS NULL
      WHERE i.excluido_em IS NULL
      ORDER BY p.nome_normalizado, c.data`,
    [],
  );

  const porProduto = new Map<string, DatasDeCompraDoProduto>();
  for (const { produtoId, nome, data } of linhas) {
    const atual = porProduto.get(produtoId) ?? { produtoId, nome, datas: [] };
    atual.datas.push(data);
    porProduto.set(produtoId, atual);
  }
  return [...porProduto.values()];
}
