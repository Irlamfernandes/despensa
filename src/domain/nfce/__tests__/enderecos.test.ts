import { corrigirParaHttps, suportaUF } from '../enderecos';

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

describe('suportaUF', () => {
  it('por enquanto só o Rio de Janeiro', () => {
    expect(suportaUF(CHAVE)).toBe(true);
    expect(suportaUF(`35${CHAVE.slice(2)}`)).toBe(false);
  });
});
