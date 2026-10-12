import { formatarDinheiro, lerDinheiro, totalDoItem } from '../dinheiro';

describe('lerDinheiro', () => {
  it.each([
    ['12,90', 1290],
    ['12,9', 1290],
    ['12', 1200],
    ['0,99', 99],
    ['1.234,56', 123456],
    ['R$ 3,50', 350],
    [' 7 ', 700],
  ])('lê "%s" como %d centavos', (texto, esperado) => {
    expect(lerDinheiro(texto)).toBe(esperado);
  });

  it.each(['', 'abc', '12,345', '1,2,3', '-5', '12.5'])('rejeita "%s"', (texto) => {
    expect(lerDinheiro(texto)).toBeNull();
  });
});

describe('formatarDinheiro', () => {
  it.each([
    [0, 'R$ 0,00'],
    [5, 'R$ 0,05'],
    [1290, 'R$ 12,90'],
    [123456, 'R$ 1.234,56'],
    [100000000, 'R$ 1.000.000,00'],
    [-350, '-R$ 3,50'],
  ])('formata %d como "%s"', (valor, esperado) => {
    expect(formatarDinheiro(valor)).toBe(esperado);
  });
});

describe('totalDoItem', () => {
  it('multiplica e arredonda ao centavo', () => {
    expect(totalDoItem(2, 450)).toBe(900);
    expect(totalDoItem(0.755, 3990)).toBe(3012); // 30,1245 → R$ 30,12
  });
});
