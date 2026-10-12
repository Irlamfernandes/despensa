import { ERRO_QR_INVALIDO, ERRO_UF_NAO_SUPORTADA, lerQrDaNota } from '../qr';

const CHAVE_RJ = '33261012345678000195650010000123451123456783';

describe('lerQrDaNota', () => {
  it('aceita o QR Code de uma NFC-e do RJ', () => {
    expect(
      lerQrDaNota(`http://www4.fazenda.rj.gov.br/consultaNFCe/QRCode?p=${CHAVE_RJ}|3|1`),
    ).toEqual({ ok: true, valor: CHAVE_RJ });
  });

  it('recusa QR Codes que não são de nota', () => {
    expect(lerQrDaNota('https://exemplo.com')).toEqual({ ok: false, erros: [ERRO_QR_INVALIDO] });
  });

  it('recusa notas de outros estados', () => {
    // chave de SP (35) com dígito verificador recalculado
    expect(lerQrDaNota('35261012345678000195650010000123451123456788')).toEqual({
      ok: false,
      erros: [ERRO_UF_NAO_SUPORTADA],
    });
  });
});
