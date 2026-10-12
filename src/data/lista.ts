import {
  montarLista,
  type CompraDoItem,
  type ItemDaLista,
  type ItemDaListaValido,
  type Lista,
} from '@/domain/lista';

import { agoraISO, type Banco } from './banco';
import { buscarOuCriarProduto } from './catalogo';
import { novoId } from './ids';

/** Lista de compras com o saldo de cada item (o que falta e o que já foi comprado). */
export async function carregarLista(banco: Banco): Promise<Lista> {
  const [itens, compras] = await Promise.all([
    banco.getAllAsync<ItemDaLista>(
      `SELECT l.id, l.produto_id AS produtoId, p.nome AS produto, l.quantidade, l.unidade
         FROM lista_de_compras l
         JOIN produtos p ON p.id = l.produto_id
        WHERE l.excluido_em IS NULL
        ORDER BY p.nome_normalizado`,
      [],
    ),
    // Compras registradas depois que o item entrou (ou foi alterado) na lista.
    banco.getAllAsync<CompraDoItem>(
      `SELECT l.id AS itemId, i.quantidade, i.unidade
         FROM lista_de_compras l
         JOIN itens_compra i ON i.produto_id = l.produto_id AND i.excluido_em IS NULL
         JOIN compras c ON c.id = i.compra_id AND c.excluido_em IS NULL AND c.criado_em >= l.desde
        WHERE l.excluido_em IS NULL`,
      [],
    ),
  ]);
  return montarLista(itens, compras);
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
