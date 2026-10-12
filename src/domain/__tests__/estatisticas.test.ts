import { compararComMedia, gastoPorMercado, totaisPorMes } from '../estatisticas';

const compras = [
  { data: '2026-07-05', total: 50000, mercado: 'A' },
  { data: '2026-08-10', total: 40000, mercado: 'A' },
  { data: '2026-08-20', total: 20000, mercado: 'B' },
  // setembro sem compras
  { data: '2026-10-01', total: 30000, mercado: 'B' },
  { data: '2026-10-03', total: 45000, mercado: 'A' },
  { data: '2026-10-09', total: 10000, mercado: 'B' },
];

describe('totaisPorMes', () => {
  it('soma as compras de cada mês', () => {
    expect(Object.fromEntries(totaisPorMes(compras))).toEqual({
      '2026-07': 50000,
      '2026-08': 60000,
      '2026-10': 85000,
    });
  });
});

describe('compararComMedia', () => {
  it('compara com a média dos meses anteriores que tiveram compras', () => {
    // média de julho (500) e agosto (600) = 550; outubro = 850
    expect(compararComMedia(compras, '2026-10')).toEqual({
      mes: '2026-10',
      total: 85000,
      media: 55000,
      variacao: 30000 / 55000,
      mesesConsiderados: 2,
    });
  });

  it('respeita a janela de meses', () => {
    // só setembro e agosto entram; setembro não teve compras
    expect(compararComMedia(compras, '2026-10', 2).media).toBe(60000);
  });

  it('sem histórico, não há média', () => {
    expect(compararComMedia(compras, '2026-07')).toEqual({
      mes: '2026-07',
      total: 50000,
      media: null,
      variacao: null,
      mesesConsiderados: 0,
    });
  });

  it('mês sem compras tem total zero', () => {
    expect(compararComMedia(compras, '2026-09').total).toBe(0);
  });
});

describe('gastoPorMercado', () => {
  it('agrupa o mês por mercado, do maior para o menor', () => {
    expect(gastoPorMercado(compras, '2026-10')).toEqual([
      { mercado: 'A', total: 45000 },
      { mercado: 'B', total: 40000 },
    ]);
  });
});
