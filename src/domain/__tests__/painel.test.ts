import { descreverPrevisao, descreverVariacao, montarPainel, produtosAcabando } from '../painel';

const base = {
  ultimaCompra: '2026-10-01',
  intervaloMedio: 10,
  proximaCompraPrevista: '2026-10-11',
};

describe('produtosAcabando', () => {
  it('mantém só os que estão perto ou passaram da data, os mais atrasados primeiro', () => {
    const resultado = produtosAcabando(
      [
        // a cada 10 dias, última em 01/10 → previsto 11/10 (1 dia de atraso em 12/10)
        { produtoId: 'cafe', nome: 'Café', datas: ['2026-09-11', '2026-09-21', '2026-10-01'] },
        // a cada 5 dias, última em 01/10 → previsto 06/10 (6 dias de atraso)
        { produtoId: 'pao', nome: 'Pão', datas: ['2026-09-21', '2026-09-26', '2026-10-01'] },
        // a cada 30 dias, última em 01/10 → ainda longe
        { produtoId: 'sabao', nome: 'Sabão', datas: ['2026-08-02', '2026-09-01', '2026-10-01'] },
        // só duas compras: sem previsão
        { produtoId: 'sal', nome: 'Sal', datas: ['2026-01-01', '2026-02-01'] },
      ],
      '2026-10-12',
    );
    expect(resultado.map((p) => [p.nome, p.previsao.diasDeAtraso])).toEqual([
      ['Pão', 6],
      ['Café', 1],
    ]);
  });
});

describe('montarPainel', () => {
  it('usa o mês de hoje para comparação e gasto por mercado', () => {
    const painel = montarPainel({
      compras: [
        { data: '2026-09-10', total: 1000, mercado: 'A' },
        { data: '2026-10-02', total: 1500, mercado: 'B' },
      ],
      datasPorProduto: [],
      hoje: '2026-10-12',
    });
    expect(painel.comparacao).toMatchObject({ mes: '2026-10', total: 1500, media: 1000 });
    expect(painel.porMercado).toEqual([{ mercado: 'B', total: 1500 }]);
    expect(painel.acabando).toEqual([]);
  });
});

describe('textos', () => {
  it.each([
    [0.18, '18% acima da média'],
    [-0.054, '5% abaixo da média'],
    [0.001, 'igual à média'],
  ])('descreve a variação %d', (variacao, esperado) => {
    expect(descreverVariacao(variacao)).toBe(esperado);
  });

  it.each([
    [0, 'deve acabar hoje'],
    [1, 'passou 1 dia do previsto'],
    [4, 'passou 4 dias do previsto'],
    [-2, 'deve acabar em 2 dias'],
  ])('descreve a previsão com %d dias de atraso', (diasDeAtraso, esperado) => {
    expect(descreverPrevisao({ ...base, diasDeAtraso })).toBe(esperado);
  });
});
