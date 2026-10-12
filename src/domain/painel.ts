import { chaveDoMes, type DataISO } from './datas';
import {
  compararComMedia,
  gastoPorMercado,
  type ComparacaoDoMes,
  type CompraResumida,
  type GastoPorMercado,
} from './estatisticas';
import { estaAcabando, preverReposicao, type PrevisaoDeReposicao } from './reposicao';

export interface DatasDeCompraDoProduto {
  produtoId: string;
  nome: string;
  datas: DataISO[];
}

export interface ProdutoAcabando {
  produtoId: string;
  nome: string;
  previsao: PrevisaoDeReposicao;
}

export interface Painel {
  comparacao: ComparacaoDoMes;
  porMercado: GastoPorMercado[];
  acabando: ProdutoAcabando[];
}

export interface EntradaDoPainel {
  compras: CompraResumida[];
  datasPorProduto: DatasDeCompraDoProduto[];
  hoje: DataISO;
}

/** Produtos que provavelmente estão acabando, dos mais atrasados para os menos. */
export function produtosAcabando(
  datasPorProduto: DatasDeCompraDoProduto[],
  hoje: DataISO,
): ProdutoAcabando[] {
  return datasPorProduto
    .map(({ produtoId, nome, datas }) => ({
      produtoId,
      nome,
      previsao: preverReposicao(datas, hoje),
    }))
    .filter((p): p is ProdutoAcabando => p.previsao !== null && estaAcabando(p.previsao))
    .sort((a, b) => b.previsao.diasDeAtraso - a.previsao.diasDeAtraso);
}

/** Tudo o que a tela de resumo mostra, calculado a partir dos dados brutos. */
export function montarPainel({ compras, datasPorProduto, hoje }: EntradaDoPainel): Painel {
  const mes = chaveDoMes(hoje);
  return {
    comparacao: compararComMedia(compras, mes),
    porMercado: gastoPorMercado(compras, mes),
    acabando: produtosAcabando(datasPorProduto, hoje),
  };
}

/** 0.18 → "18% acima da média"; -0.05 → "5% abaixo da média". */
export function descreverVariacao(variacao: number): string {
  const percentual = Math.round(Math.abs(variacao) * 100);
  if (percentual === 0) return 'igual à média';
  return `${percentual}% ${variacao > 0 ? 'acima' : 'abaixo'} da média`;
}

/** Texto curto sobre a previsão: "acabando hoje", "atrasado 3 dias", "em 2 dias". */
export function descreverPrevisao({ diasDeAtraso }: PrevisaoDeReposicao): string {
  if (diasDeAtraso === 0) return 'deve acabar hoje';
  const dias = Math.abs(diasDeAtraso);
  const unidade = dias === 1 ? 'dia' : 'dias';
  return diasDeAtraso > 0
    ? `passou ${dias} ${unidade} do previsto`
    : `deve acabar em ${dias} ${unidade}`;
}
