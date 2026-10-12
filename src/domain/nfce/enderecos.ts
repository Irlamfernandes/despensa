// Endereços da consulta pública da NFC-e. Cada estado tem o seu portal; por
// enquanto só o Rio de Janeiro (UF 33) é suportado. Detalhes em docs/nfce.md.

export const UF_RIO_DE_JANEIRO = '33';

const CONSULTA_RJ = 'https://consultadfe.fazenda.rj.gov.br/consultaNFCe/QRCode';

// O portal da SEFAZ-RJ redireciona para http://consultadfe..., que não responde
// (só aceita https). O Android também bloqueia http em apps. Por isso toda
// navegação http para domínios da SEFAZ-RJ é trocada por https.
const DOMINIO_SEFAZ_RJ = /^http:\/\/([a-z0-9-]+\.)*fazenda\.rj\.gov\.br(\/|$)/i;

const SITE_DA_SEFAZ_RJ = /^https:\/\/([a-z0-9-]+\.)*fazenda\.rj\.gov\.br(\/|$)/i;

export type DecisaoDeNavegacao =
  { tipo: 'permitir' } | { tipo: 'bloquear' } | { tipo: 'trocar'; url: string };

/**
 * O que a WebView deve fazer ao navegar para `url`: seguir (sites da SEFAZ-RJ em
 * https), trocar http por https, ou bloquear (qualquer outro site).
 */
export function decidirNavegacao(url: string): DecisaoDeNavegacao {
  const https = corrigirParaHttps(url);
  if (https) return { tipo: 'trocar', url: https };
  return SITE_DA_SEFAZ_RJ.test(url) ? { tipo: 'permitir' } : { tipo: 'bloquear' };
}

export function suportaUF(chave: string): boolean {
  return chave.startsWith(UF_RIO_DE_JANEIRO);
}

/** Versão https de uma URL http da SEFAZ-RJ; null se não precisar trocar. */
export function corrigirParaHttps(url: string): string | null {
  return DOMINIO_SEFAZ_RJ.test(url) ? url.replace(/^http:/i, 'https:') : null;
}

/**
 * Endereços para tentar, em ordem: a consulta oficial montada a partir da chave
 * e, se ela falhar, o próprio link do QR Code em https. Testado num Android real
 * (out/2026): o https do www4 falha por certificado não confiável, então a
 * consulta oficial vem primeiro.
 */
export function enderecosDeConsulta(conteudoDoQr: string, chave: string): string[] {
  const doQr = /^https?:\/\//i.test(conteudoDoQr)
    ? (corrigirParaHttps(conteudoDoQr) ?? conteudoDoQr)
    : null;
  const oficial = `${CONSULTA_RJ}?p=${chave}|3|1`;
  return [...new Set([oficial, doQr].filter((url): url is string => url !== null))];
}
