import {
  faltaDepoisDe,
  montarLista,
  type CompraCandidata,
  type CompraDoItem,
  type ItemDaLista,
  type ItemDaListaValido,
  type Lista,
  type SituacaoDoItem,
} from '@/domain/lista';

import { agoraISO, type Banco } from './banco';
import { buscarOuCriarProduto } from './catalogo';
import { novoId } from './ids';

const ITENS = `
  SELECT l.id, l.produto_id AS produtoId, p.nome AS produto, l.quantidade, l.unidade
    FROM lista_de_compras l
    JOIN produtos p ON p.id = l.produto_id
   WHERE l.excluido_em IS NULL
   ORDER BY p.nome_normalizado`;

// Compras registradas depois que o item entrou (ou foi alterado) na lista, do
// próprio produto ou de um confirmado como equivalente.
const COMPRAS_DOS_ITENS = `
  WITH produtos_do_item AS (
    SELECT id AS item_id, produto_id, desde
      FROM lista_de_compras
     WHERE excluido_em IS NULL
    UNION
    SELECT l.id, e.equivalente_id, l.desde
      FROM lista_de_compras l
      JOIN equivalencias e ON e.produto_id = l.produto_id AND e.equivale = 1
     WHERE l.excluido_em IS NULL AND e.excluido_em IS NULL
  )
  SELECT x.item_id AS itemId, i.quantidade, i.unidade
    FROM produtos_do_item x
    JOIN itens_compra i ON i.produto_id = x.produto_id AND i.excluido_em IS NULL
    JOIN compras c ON c.id = i.compra_id AND c.excluido_em IS NULL AND c.criado_em >= x.desde`;

// Outros produtos comprados no mesmo período, ainda sem resposta e que não
// estão na lista por conta própria. O domínio filtra os de nome parecido.
const CANDIDATAS = `
  SELECT l.id AS itemId, p.id AS produtoId, p.nome, SUM(i.quantidade) AS quantidade, i.unidade
    FROM lista_de_compras l
    JOIN itens_compra i ON i.produto_id <> l.produto_id AND i.excluido_em IS NULL
    JOIN compras c ON c.id = i.compra_id AND c.excluido_em IS NULL AND c.criado_em >= l.desde
    JOIN produtos p ON p.id = i.produto_id
   WHERE l.excluido_em IS NULL
     AND NOT EXISTS (SELECT 1 FROM equivalencias e
                      WHERE e.produto_id = l.produto_id AND e.equivalente_id = i.produto_id
                        AND e.excluido_em IS NULL)
     AND NOT EXISTS (SELECT 1 FROM lista_de_compras o
                      WHERE o.produto_id = i.produto_id AND o.excluido_em IS NULL)
   GROUP BY l.id, p.id, i.unidade`;

/** Lista de compras com o saldo de cada item e as perguntas de equivalência. */
export async function carregarLista(banco: Banco): Promise<Lista> {
  const [itens, compras, candidatas] = await Promise.all([
    banco.getAllAsync<ItemDaLista>(ITENS, []),
    banco.getAllAsync<CompraDoItem>(COMPRAS_DOS_ITENS, []),
    banco.getAllAsync<CompraCandidata>(CANDIDATAS, []),
  ]);
  return montarLista(itens, compras, candidatas);
}

export interface Resposta {
  produtoId: string;
  equivalenteId: string;
  equivale: boolean;
}

/** Guarda se o produto comprado é (ou não) o mesmo produto do item da lista. */
export async function responderEquivalencia(banco: Banco, resposta: Resposta): Promise<void> {
  const agora = agoraISO();
  await banco.runAsync(
    `INSERT INTO equivalencias (id, produto_id, equivalente_id, equivale, criado_em, atualizado_em)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (produto_id, equivalente_id)
     DO UPDATE SET equivale = excluded.equivale, atualizado_em = excluded.atualizado_em,
                   excluido_em = NULL`,
    [novoId(), resposta.produtoId, resposta.equivalenteId, resposta.equivale ? 1 : 0, agora, agora],
  );
}

/**
 * Define quanto falta comprar do item. As compras anteriores deixam de ser
 * descontadas: a nova quantidade já é o que falta a partir de agora.
 */
export async function alterarItemDaLista(
  banco: Banco,
  id: string,
  { quantidade, unidade }: Pick<ItemDaListaValido, 'quantidade' | 'unidade'>,
): Promise<void> {
  const agora = agoraISO();
  await banco.runAsync(
    `UPDATE lista_de_compras SET quantidade = ?, unidade = ?, desde = ?, atualizado_em = ?
      WHERE id = ? AND excluido_em IS NULL`,
    [quantidade, unidade, agora, agora, id],
  );
}

/**
 * Põe o produto na lista, cadastrando-o se for novo. Se ele já estiver na
 * lista, só redefine a quantidade (cada produto aparece uma vez).
 */
export async function adicionarNaLista(banco: Banco, item: ItemDaListaValido): Promise<void> {
  await banco.withTransactionAsync(async () => {
    const produtoId = await buscarOuCriarProduto(banco, {
      nome: item.produto,
      unidade: item.unidade,
    });
    const existente = await banco.getFirstAsync<{ id: string }>(
      'SELECT id FROM lista_de_compras WHERE produto_id = ? AND excluido_em IS NULL',
      [produtoId],
    );
    if (existente) return alterarItemDaLista(banco, existente.id, item);

    const agora = agoraISO();
    await banco.runAsync(
      `INSERT INTO lista_de_compras
         (id, produto_id, quantidade, unidade, desde, criado_em, atualizado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [novoId(), produtoId, item.quantidade, item.unidade, agora, agora, agora],
    );
  });
}

/** Exclusão lógica dos itens da lista. */
export async function removerDaLista(banco: Banco, ids: readonly string[]): Promise<void> {
  const agora = agoraISO();
  await banco.withTransactionAsync(async () => {
    for (const id of ids) {
      await banco.runAsync(
        `UPDATE lista_de_compras SET excluido_em = ?, atualizado_em = ?
          WHERE id = ? AND excluido_em IS NULL`,
        [agora, agora, id],
      );
    }
  });
}

/**
 * Desconta uma compra feita sem registro no app. Se não faltar mais nada, o
 * item sai da lista.
 */
export async function diminuirNaLista(
  banco: Banco,
  item: SituacaoDoItem,
  quantidade: number,
): Promise<void> {
  const falta = faltaDepoisDe(item, quantidade);
  if (falta === 0) return removerDaLista(banco, [item.id]);
  return alterarItemDaLista(banco, item.id, { quantidade: falta, unidade: item.unidade });
}
