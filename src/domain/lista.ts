// Lista de compras. O que foi comprado depois que o produto entrou na lista
// (ou depois da última alteração dele) é descontado sozinho: lista com 30
// sucos, compra registrada com 3 → faltam 27. Nada é gravado ao comprar; o
// saldo é sempre calculado a partir das compras, então excluir uma compra
// devolve a quantidade para a lista. Produtos com nome diferente contam depois
// de confirmados como equivalentes (ver sugerirEquivalencias).
import { errosDe, type Resultado } from './compra';
import { formatarQuantidade, lerQuantidade, type Unidade } from './quantidade';
import { saoSemelhantes } from './semelhanca';

export interface ItemDaLista {
  id: string;
  produtoId: string;
  produto: string;
  quantidade: number;
  unidade: Unidade;
}

/** Item de compra do mesmo produto, registrado depois que ele entrou na lista. */
export interface CompraDoItem {
  itemId: string;
  quantidade: number;
  unidade: Unidade;
}

export interface SituacaoDoItem extends ItemDaLista {
  comprado: number;
  falta: number;
}

/**
 * Produto comprado depois que o item entrou na lista, com outro nome e sem
 * resposta ainda sobre ser o mesmo produto do item.
 */
export interface CompraCandidata {
  itemId: string;
  produtoId: string;
  nome: string;
  quantidade: number;
  unidade: Unidade;
}

/** Pergunta para quem usa o app: "esse produto comprado é o item da lista?" */
export interface SugestaoDeEquivalencia {
  item: SituacaoDoItem;
  compra: CompraCandidata;
}

export interface Lista {
  pendentes: SituacaoDoItem[];
  comprados: SituacaoDoItem[];
  sugestoes: SugestaoDeEquivalencia[];
}

// Evita resíduos de ponto flutuante (0,1 + 0,2) nas quantidades em kg ou litro.
function arredondar(valor: number): number {
  return Math.round(valor * 1000) / 1000;
}

// Comprado em outra unidade (lista em "un", nota em "kg"): não há como
// converter, então a compra resolve o item.
function abatimento(item: ItemDaLista, compra: CompraDoItem): number {
  return compra.unidade === item.unidade ? compra.quantidade : item.quantidade;
}

export function situacaoDoItem(
  item: ItemDaLista,
  compras: readonly CompraDoItem[],
): SituacaoDoItem {
  const total = compras
    .filter((compra) => compra.itemId === item.id)
    .reduce((soma, compra) => soma + abatimento(item, compra), 0);
  const comprado = arredondar(Math.min(item.quantidade, total));
  return { ...item, comprado, falta: arredondar(item.quantidade - comprado) };
}

/** Compras com nome parecido com o de um item que ainda falta comprar. */
export function sugerirEquivalencias(
  pendentes: readonly SituacaoDoItem[],
  candidatas: readonly CompraCandidata[],
): SugestaoDeEquivalencia[] {
  const porId = new Map(pendentes.map((item) => [item.id, item]));
  return candidatas.flatMap((compra) => {
    const item = porId.get(compra.itemId);
    return item && saoSemelhantes(item.produto, compra.nome) ? [{ item, compra }] : [];
  });
}

/**
 * Separa o que ainda falta comprar do que já foi comprado por completo, e
 * aponta compras de nome parecido que podem ser itens da lista.
 */
export function montarLista(
  itens: readonly ItemDaLista[],
  compras: readonly CompraDoItem[],
  candidatas: readonly CompraCandidata[] = [],
): Lista {
  const situacoes = itens.map((item) => situacaoDoItem(item, compras));
  const pendentes = situacoes.filter((s) => s.falta > 0);
  return {
    pendentes,
    comprados: situacoes.filter((s) => s.falta === 0),
    sugestoes: sugerirEquivalencias(pendentes, candidatas),
  };
}

/** Quanto passa a faltar depois de comprar `quantidade` (fora das compras registradas). */
export function faltaDepoisDe(situacao: SituacaoDoItem, quantidade: number): number {
  return Math.max(0, arredondar(situacao.falta - quantidade));
}

/** "Comprou 3 un de 30 un", "Comprado" ou nada, se ainda não comprou. */
export function descreverSituacao(situacao: SituacaoDoItem): string | undefined {
  if (situacao.falta === 0) return 'Comprado';
  if (situacao.comprado === 0) return undefined;
  const comprado = formatarQuantidade(situacao.comprado, situacao.unidade);
  return `Comprou ${comprado} de ${formatarQuantidade(situacao.quantidade, situacao.unidade)}`;
}

/** Item como digitado no formulário da lista. */
export interface ItemDaListaRascunho {
  produto: string;
  quantidade: string;
  unidade: Unidade;
}

export interface ItemDaListaValido {
  produto: string;
  quantidade: number;
  unidade: Unidade;
}

export function validarItemDaLista(item: ItemDaListaRascunho): Resultado<ItemDaListaValido> {
  const produto = item.produto.trim();
  const quantidade = lerQuantidade(item.quantidade);
  const erros = errosDe([
    [produto === '', 'Informe o produto.'],
    [quantidade === null, 'Quantidade inválida.'],
  ]);
  if (erros.length > 0 || quantidade === null) return { ok: false, erros };
  return { ok: true, valor: { produto, quantidade, unidade: item.unidade } };
}
