import { palavrasDoNome, saoSemelhantes, semelhanca } from '../semelhanca';

describe('palavrasDoNome', () => {
  it('tira acento, medidas, preposições e plural', () => {
    expect(palavrasDoNome('Suco em pó')).toEqual(['suco', 'po']);
    expect(palavrasDoNome('BISCOITOS RECHEADOS 140G C/3')).toEqual(['biscoito', 'recheado']);
  });
});

describe('semelhanca', () => {
  it.each([
    ['Suco em pó', 'SUCO PO TANG LARANJA 25G', 1],
    ['Detergente', 'DETERG YPE NEUTRO 500ML', 1],
    ['Arroz', 'ARROZ TIO JOAO T1 5KG', 1],
    ['Suco em pó', 'SUCO DE UVA INTEGRAL 1L', 0.5],
    ['Suco em pó', 'REFRESCO TANG LARANJA', 0],
    ['Pão', 'PAPEL HIGIENICO', 0],
  ])('"%s" × "%s" = %d', (procurado, candidato, esperado) => {
    expect(semelhanca(procurado, candidato)).toBe(esperado);
  });

  it('nome sem palavras úteis não combina com nada', () => {
    expect(semelhanca('1kg', '1kg')).toBe(0);
  });
});

describe('saoSemelhantes', () => {
  it('pede pelo menos metade das palavras', () => {
    expect(saoSemelhantes('Leite integral', 'LEITE UHT DESNATADO')).toBe(true);
    expect(saoSemelhantes('Leite integral condensado', 'LEITE UHT DESNATADO')).toBe(false);
  });
});
