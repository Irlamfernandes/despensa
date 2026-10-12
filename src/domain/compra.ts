import { lerDataBR, type DataISO } from './datas';
import { lerDinheiro, totalDoItem, type Centavos } from './dinheiro';
import { lerQuantidade, type Unidade } from './quantidade';

/** Item como digitado no formulário de compra manual (tudo texto). */
export interface ItemRascunho {
  produto: string;
  quantidade: string;
  unidade: Unidade;
  precoUnitario: string;
}

export interface ItemValido {
  produto: string;
  quantidade: number;
  unidade: Unidade;
  precoUnitario: Centavos;
  total: Centavos;
}

export interface CompraRascunho {
  mercado: string;
  data: string;
  itens: ItemValido[];
}

export interface CompraValida {
  mercado: string;
  data: DataISO;
  itens: ItemValido[];
  total: Centavos;
}

export type Resultado<T> = { ok: true; valor: T } | { ok: false; erros: string[] };

// Marcas de acento separadas da letra pela normalização NFD (U+0300 a U+036F).
const MARCAS_DE_ACENTO = /[\u0300-\u036f]/g;

/** Normaliza um nome para comparação: sem acento, minúsculo, espaços simples. */
export function normalizarNome(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(MARCAS_DE_ACENTO, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Uma regra de validação: [falhou?, mensagem]. */
type Verificacao = readonly [falhou: boolean, mensagem: string];

/** Mensagens das verificações que falharam, na ordem em que foram declaradas. */
function errosDe(verificacoes: readonly Verificacao[]): string[] {
  return verificacoes.filter(([falhou]) => falhou).map(([, mensagem]) => mensagem);
}

export function validarItem(item: ItemRascunho): Resultado<ItemValido> {
  const produto = item.produto.trim();
  const quantidade = lerQuantidade(item.quantidade);
  const precoUnitario = lerDinheiro(item.precoUnitario);
  const erros = errosDe([
    [produto === '', 'Informe o produto.'],
    [quantidade === null, 'Quantidade inválida.'],
    [precoUnitario === null, 'Preço inválido.'],
  ]);

  if (erros.length > 0 || quantidade === null || precoUnitario === null) {
    return { ok: false, erros };
  }
  return {
    ok: true,
    valor: {
      produto,
      quantidade,
      unidade: item.unidade,
      precoUnitario,
      total: totalDoItem(quantidade, precoUnitario),
    },
  };
}

export function validarCompra(compra: CompraRascunho): Resultado<CompraValida> {
  const mercado = compra.mercado.trim();
  const data = lerDataBR(compra.data);
  const erros = errosDe([
    [mercado === '', 'Informe o mercado.'],
    [data === null, 'Data inválida. Use DD/MM/AAAA.'],
    [compra.itens.length === 0, 'Adicione pelo menos um item.'],
  ]);

  if (erros.length > 0 || data === null) {
    return { ok: false, erros };
  }
  return {
    ok: true,
    valor: {
      mercado,
      data,
      itens: compra.itens,
      total: compra.itens.reduce((soma, item) => soma + item.total, 0),
    },
  };
}
