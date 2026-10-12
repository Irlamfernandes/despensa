import { diasEntre, somarDias, type DataISO } from './datas';

export interface PrevisaoDeReposicao {
  ultimaCompra: DataISO;
  /** Intervalo médio, em dias, entre compras do produto. */
  intervaloMedio: number;
  proximaCompraPrevista: DataISO;
  /** Positivo: dias de atraso em relação à previsão. Negativo: dias que faltam. */
  diasDeAtraso: number;
}

/** Quantas compras (em dias diferentes) são necessárias para prever. */
export const MINIMO_DE_COMPRAS = 3;

/**
 * Prevê quando um produto deve ser comprado de novo, a partir das datas em
 * que ele foi comprado. Compras no mesmo dia contam como uma só.
 */
export function preverReposicao(datas: DataISO[], hoje: DataISO): PrevisaoDeReposicao | null {
  const dias = [...new Set(datas)].sort();
  if (dias.length < MINIMO_DE_COMPRAS) return null;

  const intervalos: number[] = [];
  for (let i = 1; i < dias.length; i++) {
    intervalos.push(diasEntre(dias[i - 1]!, dias[i]!));
  }
  const intervaloMedio = Math.round(intervalos.reduce((a, b) => a + b, 0) / intervalos.length);
  const ultimaCompra = dias[dias.length - 1]!;
  const proximaCompraPrevista = somarDias(ultimaCompra, intervaloMedio);

  return {
    ultimaCompra,
    intervaloMedio,
    proximaCompraPrevista,
    diasDeAtraso: diasEntre(proximaCompraPrevista, hoje),
  };
}

/** Produto que já passou (ou está a `margem` dias) da data prevista de reposição. */
export function estaAcabando(previsao: PrevisaoDeReposicao, margem = 2): boolean {
  return previsao.diasDeAtraso >= -margem;
}
