import { corrigirParaHttps, decidirNavegacao, enderecosDeConsulta, suportaUF } from '../enderecos';

const CHAVE = '33261012345678000195650010000123451123456783';

describe('corrigirParaHttps', () => {
  it('troca http por https nos domínios da SEFAZ-RJ (o redirecionamento quebrado do portal)', () => {
    expect(
      corrigirParaHttps(
        'http://consultadfe.fazenda.rj.gov.br/consultaNFCe/paginas/resultadoQRCode2.faces?cid=4',
      ),
    ).toBe(
      'https://consultadfe.fazenda.rj.gov.br/consultaNFCe/paginas/resultadoQRCode2.faces?cid=4',
    );
  });

  it('não mexe em https nem em outros domínios', () => {
    expect(corrigirParaHttps('https://consultadfe.fazenda.rj.gov.br/x')).toBeNull();
    expect(corrigirParaHttps('http://fazenda.rj.gov.br.exemplo.com/x')).toBeNull();
    expect(corrigirParaHttps('http://exemplo.com/fazenda.rj.gov.br')).toBeNull();
  });
});

describe('enderecosDeConsulta', () => {
  it('tenta primeiro o link do QR Code em https e depois a consulta oficial', () => {
    expect(
      enderecosDeConsulta(
        `http://www4.fazenda.rj.gov.br/consultaNFCe/QRCode?p=${CHAVE}|3|1`,
        CHAVE,
      ),
    ).toEqual([
      `https://www4.fazenda.rj.gov.br/consultaNFCe/QRCode?p=${CHAVE}|3|1`,
      `https://consultadfe.fazenda.rj.gov.br/consultaNFCe/QRCode?p=${CHAVE}|3|1`,
    ]);
  });

  it('com a chave digitada, usa só a consulta oficial', () => {
    expect(enderecosDeConsulta(CHAVE, CHAVE)).toEqual([
      `https://consultadfe.fazenda.rj.gov.br/consultaNFCe/QRCode?p=${CHAVE}|3|1`,
    ]);
  });
});

describe('suportaUF', () => {
  it('por enquanto só o Rio de Janeiro', () => {
    expect(suportaUF(CHAVE)).toBe(true);
    expect(suportaUF(`35${CHAVE.slice(2)}`)).toBe(false);
  });
});

describe('decidirNavegacao', () => {
  it('permite os sites da SEFAZ-RJ em https', () => {
    expect(decidirNavegacao('https://consultadfe.fazenda.rj.gov.br/x')).toEqual({
      tipo: 'permitir',
    });
  });

  it('troca http por https', () => {
    expect(decidirNavegacao('http://consultadfe.fazenda.rj.gov.br/x')).toEqual({
      tipo: 'trocar',
      url: 'https://consultadfe.fazenda.rj.gov.br/x',
    });
  });

  it('bloqueia qualquer outro site', () => {
    expect(decidirNavegacao('https://exemplo.com/')).toEqual({ tipo: 'bloquear' });
    expect(decidirNavegacao('https://fazenda.rj.gov.br.exemplo.com/')).toEqual({
      tipo: 'bloquear',
    });
  });
});
