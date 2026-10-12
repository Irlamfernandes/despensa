import type { Centavos } from './dinheiro';
import type { DataISO } from './datas';

export interface PrecoNoMercado {
  data: DataISO;
  mercado: string;
  precoUnitario: Centavos;
}

/** Preço mais recente de cada mercado, do mais barato para o mais caro. */
export function precoAtualPorMercado(historico: readonly PrecoNoMercado[]): PrecoNoMercado[] {
  const maisRecente = new Map<string, PrecoNoMercado>();
  for (const registro of historico) {
    const atual = maisRecente.get(registro.mercado);
    if (!atual || registro.data > atual.data) maisRecente.set(registro.mercado, registro);
  }
  return [...maisRecente.values()].sort((a, b) => a.precoUnitario - b.precoUnitario);
}
