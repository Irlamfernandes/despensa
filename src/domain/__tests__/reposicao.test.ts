import { estaAcabando, preverReposicao } from '../reposicao';

describe('preverReposicao', () => {
  it('precisa de compras em pelo menos 3 dias diferentes', () => {
    expect(preverReposicao(['2026-09-01', '2026-09-15'], '2026-10-01')).toBeNull();
    expect(preverReposicao(['2026-09-01', '2026-09-01', '2026-09-15'], '2026-10-01')).toBeNull();
  });

  it('usa o intervalo médio entre as compras', () => {
    // intervalos: 14 e 16 dias → média 15; última em 30/09 → prevista para 15/10
    const previsao = preverReposicao(['2026-09-30', '2026-09-01', '2026-09-15'], '2026-10-12');
    expect(previsao).toEqual({
      ultimaCompra: '2026-09-30',
      intervaloMedio: 15,
      proximaCompraPrevista: '2026-10-15',
      diasDeAtraso: -3,
    });
  });
});

describe('estaAcabando', () => {
  const base = {
    ultimaCompra: '2026-09-30',
    intervaloMedio: 15,
    proximaCompraPrevista: '2026-10-15',
  };

  it('avisa quando faltam poucos dias ou já passou', () => {
    expect(estaAcabando({ ...base, diasDeAtraso: -3 })).toBe(false);
    expect(estaAcabando({ ...base, diasDeAtraso: -2 })).toBe(true);
    expect(estaAcabando({ ...base, diasDeAtraso: 5 })).toBe(true);
  });
});
