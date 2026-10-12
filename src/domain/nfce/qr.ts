import type { Resultado } from '../compra';
import { extrairChave } from './chave';
import { suportaUF } from './enderecos';

export const ERRO_QR_INVALIDO = 'Esse QR Code não é de uma nota fiscal de consumidor (NFC-e).';
export const ERRO_UF_NAO_SUPORTADA = 'Por enquanto o app só lê notas do Rio de Janeiro.';

/** Valida o conteúdo lido pela câmera e devolve a chave de acesso da nota. */
export function lerQrDaNota(conteudo: string): Resultado<string> {
  const chave = extrairChave(conteudo);
  if (!chave) return { ok: false, erros: [ERRO_QR_INVALIDO] };
  if (!suportaUF(chave)) return { ok: false, erros: [ERRO_UF_NAO_SUPORTADA] };
  return { ok: true, valor: chave };
}
