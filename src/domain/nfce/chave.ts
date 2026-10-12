// Chave de acesso da NFC-e: 44 dígitos que identificam a nota no país inteiro.
// Layout: UF(2) AAMM(4) CNPJ(14) modelo(2) série(3) número(9) tpEmis(1) código(8) DV(1).

const TAMANHO_DA_CHAVE = 44;
const MODELO_NFCE = '65';

export interface DadosDaChave {
  uf: string;
  anoMes: string;
  cnpj: string;
  modelo: string;
  serie: number;
  numero: number;
}

/** Dígito verificador (módulo 11, pesos 2 a 9 da direita para a esquerda). */
function digitoVerificador(base: string): number {
  const soma = [...base]
    .reverse()
    .reduce((total, digito, i) => total + Number(digito) * ((i % 8) + 2), 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function chaveValida(chave: string): boolean {
  if (!new RegExp(`^\\d{${TAMANHO_DA_CHAVE}}$`).test(chave)) return false;
  return digitoVerificador(chave.slice(0, -1)) === Number(chave.slice(-1));
}

/**
 * Extrai a chave do conteúdo lido no QR Code. Aceita a URL de consulta
 * (`...?p=CHAVE|versao|ambiente...`) ou a chave digitada (com ou sem espaços).
 * Só devolve chaves válidas de NFC-e (modelo 65).
 */
export function extrairChave(conteudo: string): string | null {
  const parametro = /[?&]p=([^&]+)/.exec(conteudo)?.[1];
  const candidata = (parametro ? decodeURIComponent(parametro).split('|')[0] : conteudo) ?? '';
  const chave = candidata.replace(/\s/g, '');
  return chaveValida(chave) && chave.slice(20, 22) === MODELO_NFCE ? chave : null;
}

export function descreverChave(chave: string): DadosDaChave {
  return {
    uf: chave.slice(0, 2),
    anoMes: `20${chave.slice(2, 4)}-${chave.slice(4, 6)}`,
    cnpj: chave.slice(6, 20),
    modelo: chave.slice(20, 22),
    serie: Number(chave.slice(22, 25)),
    numero: Number(chave.slice(25, 34)),
  };
}
