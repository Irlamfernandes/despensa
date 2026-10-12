import { precoAtualPorMercado } from '../precos';

describe('precoAtualPorMercado', () => {
  it('usa o preço mais recente de cada mercado e ordena do mais barato', () => {
    expect(
      precoAtualPorMercado([
        { data: '2026-09-01', mercado: 'A', precoUnitario: 1500 },
        { data: '2026-10-01', mercado: 'A', precoUnitario: 1900 },
        { data: '2026-09-15', mercado: 'B', precoUnitario: 1700 },
      ]),
    ).toEqual([
      { data: '2026-09-15', mercado: 'B', precoUnitario: 1700 },
      { data: '2026-10-01', mercado: 'A', precoUnitario: 1900 },
    ]);
  });

  it('lista vazia não tem preços', () => {
    expect(precoAtualPorMercado([])).toEqual([]);
  });
});
