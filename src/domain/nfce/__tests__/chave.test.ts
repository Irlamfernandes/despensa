import { chaveValida, descreverChave, extrairChave } from '../chave';

// Chave fictícia com dígito verificador válido (mesma da página de exemplo).
const CHAVE = '33261012345678000195650010000123451123456783';

describe('chaveValida', () => {
  it('confere o dígito verificador', () => {
    expect(chaveValida(CHAVE)).toBe(true);
    expect(chaveValida(CHAVE.slice(0, -1) + '4')).toBe(false);
  });

  it('exige 44 dígitos', () => {
    expect(chaveValida(CHAVE.slice(1))).toBe(false);
    expect(chaveValida(`${CHAVE.slice(0, -1)}x`)).toBe(false);
  });
});

describe('extrairChave', () => {
  it.each([
    [`http://www4.fazenda.rj.gov.br/consultaNFCe/QRCode?p=${CHAVE}|3|1`],
    [`https://consultadfe.fazenda.rj.gov.br/consultaNFCe/QRCode?p=${CHAVE}%7C2%7C1%7C1%7CABC`],
    ['3326 1012 3456 7800 0195 6500 1000 0123 4511 2345 6783'],
  ])('lê a chave de "%s"', (conteudo) => {
    expect(extrairChave(conteudo)).toBe(CHAVE);
  });

  it('recusa QR Codes que não são de NFC-e', () => {
    expect(extrairChave('https://exemplo.com/?p=123')).toBeNull();
    expect(extrairChave('qualquer texto')).toBeNull();
  });

  it('recusa NF-e comum (modelo 55)', () => {
    // mesma chave com modelo 55 e dígito recalculado
    expect(extrairChave('33261012345678000195550010000123451123456780')).toBeNull();
  });
});

describe('descreverChave', () => {
  it('separa os campos', () => {
    expect(descreverChave(CHAVE)).toEqual({
      uf: '33',
      anoMes: '2026-10',
      cnpj: '12345678000195',
      modelo: '65',
      serie: 1,
      numero: 12345,
    });
  });
});
