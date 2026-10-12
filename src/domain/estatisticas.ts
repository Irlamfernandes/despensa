import type { Centavos } from './dinheiro';
import { chaveDoMes, mesAnterior, type DataISO } from './datas';

export interface CompraResumida {
  data: DataISO;
  total: Centavos;
  mercado: string;
}

export interface ComparacaoDoMes {
  mes: string;
  total: Centavos;
  /** Média dos meses anteriores que tiveram compras; null se não houver histórico. */
  media: Centavos | null;
  /** Diferença percentual em relação à média (ex.: 0.18 = 18% acima). */
  variacao: number | null;
  mesesConsiderados: number;
}

export function totaisPorMes(compras: CompraResumida[]): Map<string, Centavos> {
  const totais = new Map<string, Centavos>();
  for (const compra of compras) {
    const mes = chaveDoMes(compra.data);
    totais.set(mes, (totais.get(mes) ?? 0) + compra.total);
  }
  return totais;
}

/** Totais dos `janela` meses antes de `mes`, pulando os meses sem compras. */
function totaisDosMesesAnteriores(
  totais: Map<string, Centavos>,
  mes: string,
  janela: number,
): Centavos[] {
  const meses: string[] = [];
  for (let cursor = mesAnterior(mes); meses.length < janela; cursor = mesAnterior(cursor)) {
    meses.push(cursor);
  }
  return meses.flatMap((m) => totais.get(m) ?? []);
}

/**
 * Compara o gasto de um mês com a média dos `janela` meses anteriores.
 * Meses sem nenhuma compra são ignorados: provavelmente o app ainda não
 * era usado, e contar zero puxaria a média para baixo.
 */
export function compararComMedia(
  compras: CompraResumida[],
  mes: string,
  janela = 6,
): ComparacaoDoMes {
  const totais = totaisPorMes(compras);
  const total = totais.get(mes) ?? 0;
  const anteriores = totaisDosMesesAnteriores(totais, mes, janela);

  if (anteriores.length === 0) {
    return { mes, total, media: null, variacao: null, mesesConsiderados: 0 };
  }
  const media = Math.round(anteriores.reduce((a, b) => a + b, 0) / anteriores.length);
  return {
    mes,
    total,
    media,
    variacao: media === 0 ? null : (total - media) / media,
    mesesConsiderados: anteriores.length,
  };
}

export interface GastoPorMercado {
  mercado: string;
  total: Centavos;
}

export function gastoPorMercado(compras: CompraResumida[], mes: string): GastoPorMercado[] {
  const totais = new Map<string, Centavos>();
  for (const compra of compras) {
    if (chaveDoMes(compra.data) !== mes) continue;
    totais.set(compra.mercado, (totais.get(compra.mercado) ?? 0) + compra.total);
  }
  return [...totais.entries()]
    .map(([mercado, total]) => ({ mercado, total }))
    .sort((a, b) => b.total - a.total);
}
