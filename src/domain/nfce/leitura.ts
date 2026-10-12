import { converterNota, type NotaBruta, type NotaFiscal } from './nota';

// Máquina de estados da leitura de uma NFC-e pela WebView. A tela só despacha
// eventos e desenha o estado; toda decisão fica aqui, testada.

export type EstadoDaLeitura =
  | { etapa: 'verificando' }
  | { etapa: 'abrindo'; url: string; tentativa: number }
  | { etapa: 'lida'; nota: NotaFiscal }
  | { etapa: 'duplicada'; compraId: string }
  | { etapa: 'falhou'; motivo: string };

export type EventoDaLeitura =
  | { tipo: 'nao-importada' }
  | { tipo: 'ja-importada'; compraId: string }
  | { tipo: 'navegar'; url: string }
  | { tipo: 'mensagem'; texto: string }
  | { tipo: 'erro-de-carga' }
  | { tipo: 'tempo-esgotado' }
  | { tipo: 'tentar-de-novo' };

export const ESTADO_INICIAL: EstadoDaLeitura = { etapa: 'verificando' };

/** Tempo máximo esperando a página da SEFAZ mostrar a nota. */
export const TEMPO_LIMITE_MS = 30_000;

export const MOTIVO_SEM_RESPOSTA =
  'A SEFAZ não mostrou a nota. No Wi-Fi de casa o site pode bloquear o acesso: tente pelos dados móveis.';

export const MOTIVO_NOTA_ILEGIVEL =
  'A página abriu, mas não foi possível ler os itens. Registre a compra manualmente.';

/** Mensagem enviada pelo SCRIPT_DE_EXTRACAO. Vem de uma página externa: tratar como não confiável. */
export function lerMensagem(texto: string): NotaBruta | 'sem-nota' | null {
  try {
    const mensagem = JSON.parse(texto) as { tipo?: unknown; nota?: NotaBruta };
    if (mensagem.tipo === 'sem-nota') return 'sem-nota';
    return mensagem.tipo === 'nota' && mensagem.nota ? mensagem.nota : null;
  } catch {
    return null;
  }
}

function abrir(urls: readonly string[], tentativa: number): EstadoDaLeitura {
  const url = urls[tentativa];
  return url
    ? { etapa: 'abrindo', url, tentativa }
    : { etapa: 'falhou', motivo: MOTIVO_SEM_RESPOSTA };
}

function aoReceberMensagem(estado: EstadoDaLeitura, texto: string): EstadoDaLeitura {
  const bruta = lerMensagem(texto);
  // Páginas intermediárias (redirecionamento, desafio anti-robô) não têm itens: segue esperando.
  if (bruta === null || bruta === 'sem-nota') return estado;
  const resultado = converterNota(bruta);
  return resultado.ok
    ? { etapa: 'lida', nota: resultado.valor }
    : { etapa: 'falhou', motivo: MOTIVO_NOTA_ILEGIVEL };
}

type Tratadores = {
  [T in EventoDaLeitura['tipo']]: (
    estado: EstadoDaLeitura,
    evento: Extract<EventoDaLeitura, { tipo: T }>,
    urls: readonly string[],
  ) => EstadoDaLeitura;
};

const TRATADORES: Tratadores = {
  'nao-importada': (_estado, _evento, urls) => abrir(urls, 0),
  'ja-importada': (_estado, { compraId }) => ({ etapa: 'duplicada', compraId }),
  navegar: (estado, { url }) => (estado.etapa === 'abrindo' ? { ...estado, url } : estado),
  mensagem: (estado, { texto }) =>
    estado.etapa === 'abrindo' ? aoReceberMensagem(estado, texto) : estado,
  'erro-de-carga': (estado, _evento, urls) =>
    estado.etapa === 'abrindo' ? abrir(urls, estado.tentativa + 1) : estado,
  'tempo-esgotado': (estado) =>
    estado.etapa === 'abrindo' ? { etapa: 'falhou', motivo: MOTIVO_SEM_RESPOSTA } : estado,
  'tentar-de-novo': (_estado, _evento, urls) => abrir(urls, 0),
};

export function proximoEstado(
  estado: EstadoDaLeitura,
  evento: EventoDaLeitura,
  urls: readonly string[],
): EstadoDaLeitura {
  const tratar = TRATADORES[evento.tipo] as (
    e: EstadoDaLeitura,
    ev: EventoDaLeitura,
    u: readonly string[],
  ) => EstadoDaLeitura;
  return tratar(estado, evento, urls);
}
