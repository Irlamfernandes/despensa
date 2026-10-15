// Endereços da consulta pública da NFC-e. Cada estado tem o seu portal; por
// enquanto só o Rio de Janeiro (UF 33) é suportado. Detalhes em docs/nfce.md.

export const UF_RIO_DE_JANEIRO = '33';

/**
 * Página da SEFAZ-RJ para consultar uma nota digitando a chave de acesso (com
 * captcha). A pessoa acessa o site por conta própria e o app só lê a nota quando
 * ela aparece. Ver docs/nfce.md.
 */
export const URL_CONSULTA_POR_CHAVE =
  'https://consultadfe.fazenda.rj.gov.br/consultaDFe/paginas/consultaChaveAcesso.faces';

// O portal da SEFAZ-RJ redireciona para http://consultadfe..., que não responde
// (só aceita https). O Android também bloqueia http em apps. Por isso toda
// navegação http para domínios da SEFAZ-RJ é trocada por https.
const DOMINIO_SEFAZ_RJ = /^http:\/\/([a-z0-9-]+\.)*fazenda\.rj\.gov\.br(\/|$)/i;

export function suportaUF(chave: string): boolean {
  return chave.startsWith(UF_RIO_DE_JANEIRO);
}

/** Versão https de uma URL http da SEFAZ-RJ; null se não precisar trocar. */
export function corrigirParaHttps(url: string): string | null {
  return DOMINIO_SEFAZ_RJ.test(url) ? url.replace(/^http:/i, 'https:') : null;
}
