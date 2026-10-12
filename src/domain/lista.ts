// Lista de compras. O que foi comprado depois que o produto entrou na lista
// (ou depois da última alteração dele) é descontado sozinho: lista com 30
// sucos, compra registrada com 3 → faltam 27. Nada é gravado ao comprar; o
// saldo é sempre calculado a partir das compras, então excluir uma compra
// devolve a quantidade para a lista.
import { errosDe, type Resultado } from './compra';
import { formatarQuantidade, lerQuantidade, type Unidade } from './quantidade';

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

export interface Lista {
  pendentes: SituacaoDoItem[];
  comprados: SituacaoDoItem[];
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

/** Separa o que ainda falta comprar do que já foi comprado por completo. */
export function montarLista(
  itens: readonly ItemDaLista[],
  compras: readonly CompraDoItem[],
): Lista {
  const situacoes = itens.map((item) => situacaoDoItem(item, compras));
  return {
    pendentes: situacoes.filter((s) => s.falta > 0),
    comprados: situacoes.filter((s) => s.falta === 0),
  };
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
