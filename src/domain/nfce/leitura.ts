import { type NotaBruta } from './nota';

/**
 * Lê a mensagem enviada pelo SCRIPT_DE_EXTRACAO (injetado na página da SEFAZ).
 * Vem de uma página externa: tratar como não confiável. Devolve a nota crua, o
 * marcador 'sem-nota' (páginas intermediárias) ou null (mensagem inesperada).
 */
export function lerMensagem(texto: string): NotaBruta | 'sem-nota' | null {
  try {
    const mensagem = JSON.parse(texto) as { tipo?: unknown; nota?: NotaBruta };
    if (mensagem.tipo === 'sem-nota') return 'sem-nota';
    return mensagem.tipo === 'nota' && mensagem.nota ? mensagem.nota : null;
  } catch {
    return null;
  }
}
