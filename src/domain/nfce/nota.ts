import type { CompraValida, Resultado } from '../compra';
import type { DataISO } from '../datas';
import { lerDinheiro, type Centavos } from '../dinheiro';
import { lerQuantidade, type Unidade } from '../quantidade';

/** Textos crus copiados da página pelo SCRIPT_DE_EXTRACAO (podem vir nulos). */
export interface ItemBruto {
  nome: string | null;
  codigo: string | null;
  quantidade: string | null;
  unidade: string | null;
  valorUnitario: string | null;
  valorTotal: string | null;
}

export interface NotaBruta {
  mercado: string | null;
  cabecalho: string | null;
  totais: string | null;
  informacoes: string | null;
  chave: string | null;
  itens: ItemBruto[];
}

export interface ItemDaNota {
  nome: string;
  codigo: string | null;
  quantidade: number;
  unidade: Unidade;
  valorUnitario: Centavos;
  valorTotal: Centavos;
}

export interface NotaFiscal {
  mercado: string;
  cnpj: string | null;
  data: DataISO;
  chave: string;
  total: Centavos;
  itens: ItemDaNota[];
}

/** Espaços, quebras de linha e &nbsp; viram um espaço simples. */
function limpar(texto: string | null): string {
  return (texto ?? '').replace(/\s+/g, ' ').trim();
}

/** Último número de um texto com rótulo: "Vl. Unit.: 6,99" → "6,99". */
function numeroNoTexto(texto: string | null): string {
  return /(\d[\d.]*(,\d+)?)\s*$/.exec(limpar(texto))?.[1] ?? '';
}

const UNIDADES_DA_NOTA: Record<string, Unidade> = {
  KG: 'kg',
  G: 'g',
  GR: 'g',
  L: 'l',
  LT: 'l',
  ML: 'ml',
};

/** "UN: KG" → "kg". Embalagens (UN, PC, CX, PCT...) contam como unidade. */
export function lerUnidadeDaNota(texto: string | null): Unidade {
  const sigla = limpar(texto)
    .replace(/^UN:\s*/i, '')
    .toUpperCase();
  return UNIDADES_DA_NOTA[sigla] ?? 'un';
}

/** "Emissão: 12/10/2026 12:43:48-03:00" → "2026-10-12". */
function lerDataDeEmissao(texto: string): DataISO | null {
  const m = /Emiss[ãa]o:\s*(\d{2})\/(\d{2})\/(\d{4})/i.exec(texto);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

function lerCnpj(texto: string): string | null {
  const m = /CNPJ:\s*([\d./-]+)/i.exec(texto);
  return m?.[1] ? m[1].replace(/\D/g, '') : null;
}

function lerTotal(totais: string | null): Centavos | null {
  const m = /Valor a pagar R\$:\s*([\d.,]+)/i.exec(limpar(totais));
  return m?.[1] ? lerDinheiro(m[1]) : null;
}

type SemNulos<T> = { [K in keyof T]: NonNullable<T[K]> };

/** Verdadeiro se nenhum campo for nulo ou texto vazio. */
function todosPreenchidos<T extends object>(campos: T): campos is SemNulos<T> {
  return Object.values(campos).every((valor) => valor !== null && valor !== '');
}

/** "(Código: 30002 )" → "30002". */
function lerCodigo(texto: string | null): string | null {
  return /C[óo]digo:\s*([^\s)]+)/i.exec(limpar(texto))?.[1] ?? null;
}

function lerItem(bruto: ItemBruto): ItemDaNota | null {
  const campos = {
    nome: limpar(bruto.nome),
    quantidade: lerQuantidade(numeroNoTexto(bruto.quantidade)),
    valorUnitario: lerDinheiro(numeroNoTexto(bruto.valorUnitario)),
    valorTotal: lerDinheiro(numeroNoTexto(bruto.valorTotal)),
  };
  if (!todosPreenchidos(campos)) return null;
  return { ...campos, codigo: lerCodigo(bruto.codigo), unidade: lerUnidadeDaNota(bruto.unidade) };
}

function lerItens(brutos: ItemBruto[]): ItemDaNota[] | null {
  const itens = brutos.map(lerItem);
  const validos = itens.filter((item): item is ItemDaNota => item !== null);
  return validos.length > 0 && validos.length === itens.length ? validos : null;
}

function lerCabecalho(bruta: NotaBruta): Omit<NotaFiscal, 'itens'> | null {
  const chave = limpar(bruta.chave).replace(/\D/g, '');
  const campos = {
    mercado: limpar(bruta.mercado),
    data: lerDataDeEmissao(limpar(bruta.informacoes)),
    total: lerTotal(bruta.totais),
    chave: chave.length === 44 ? chave : null,
  };
  return todosPreenchidos(campos) ? { ...campos, cnpj: lerCnpj(limpar(bruta.cabecalho)) } : null;
}

/** Converte os textos da página em uma nota com números, datas e unidades. */
export function converterNota(bruta: NotaBruta): Resultado<NotaFiscal> {
  const itens = lerItens(bruta.itens);
  if (!itens) return { ok: false, erros: ['Não foi possível ler os itens da nota.'] };
  const cabecalho = lerCabecalho(bruta);
  if (!cabecalho) return { ok: false, erros: ['Não foi possível ler os dados da nota.'] };
  return { ok: true, valor: { ...cabecalho, itens } };
}

function capitalizar(palavra: string): string {
  const primeira = palavra.charAt(0);
  return primeira.toUpperCase() + palavra.slice(1);
}

/** "OLEO SOJA SOYA 900ML" → "Oleo Soja Soya 900ml" (nomes da nota vêm em maiúsculas). */
export function formatarNomeDaNota(nome: string): string {
  return nome.toLowerCase().split(' ').map(capitalizar).join(' ');
}

/**
 * Transforma a nota em uma compra pronta para salvar. O total é o "valor a
 * pagar" da nota (já com descontos), que pode ser menor que a soma dos itens.
 */
export function notaParaCompra(nota: NotaFiscal): CompraValida {
  return {
    mercado: formatarNomeDaNota(nota.mercado),
    data: nota.data,
    total: nota.total,
    itens: nota.itens.map((item) => ({
      produto: formatarNomeDaNota(item.nome),
      quantidade: item.quantidade,
      unidade: item.unidade,
      precoUnitario: item.valorUnitario,
      total: item.valorTotal,
    })),
  };
}
