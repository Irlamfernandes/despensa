import { converterNota, formatarNomeDaNota, lerUnidadeDaNota, type NotaBruta } from '../nota';

const notaBase: NotaBruta = {
  mercado: ' MERCADO EXEMPLO ',
  cabecalho: 'MERCADO EXEMPLO CNPJ: 12.345.678/0001-95 RUA X',
  totais: 'Qtd. total de itens: 1 Valor a pagar R$: 1.234,50',
  informacoes: 'Número: 1 Série: 1 Emissão: 31/12/2026 23:59:00-03:00',
  chave: '3326 1012 3456 7800 0195 6500 1000 0123 4511 2345 6783',
  itens: [
    {
      nome: 'TV EXEMPLO',
      codigo: '(Código: ABC-1 )',
      quantidade: 'Qtde.:1',
      unidade: 'UN: UN',
      valorUnitario: 'Vl. Unit.: 1.234,5',
      valorTotal: '1.234,50',
    },
  ],
};

describe('converterNota', () => {
  it('lê valores com milhar, código alfanumérico e &nbsp;', () => {
    const resultado = converterNota(notaBase);
    expect(resultado).toMatchObject({
      ok: true,
      valor: {
        mercado: 'MERCADO EXEMPLO',
        data: '2026-12-31',
        total: 123450,
        itens: [{ codigo: 'ABC-1', valorUnitario: 123450, valorTotal: 123450 }],
      },
    });
  });

  it('sem CNPJ na página, a nota continua válida', () => {
    const resultado = converterNota({ ...notaBase, cabecalho: 'MERCADO EXEMPLO' });
    expect(resultado.ok && resultado.valor.cnpj).toBeNull();
  });

  it('falha se algum item não puder ser lido', () => {
    const itemRuim = { ...notaBase.itens[0]!, valorTotal: 'abc' };
    expect(converterNota({ ...notaBase, itens: [itemRuim] })).toEqual({
      ok: false,
      erros: ['Não foi possível ler os itens da nota.'],
    });
  });

  it('falha sem itens ou sem os dados do cabeçalho', () => {
    expect(converterNota({ ...notaBase, itens: [] }).ok).toBe(false);
    expect(converterNota({ ...notaBase, informacoes: 'sem data' })).toEqual({
      ok: false,
      erros: ['Não foi possível ler os dados da nota.'],
    });
  });
});

describe('lerUnidadeDaNota', () => {
  it.each([
    ['UN: KG', 'kg'],
    ['UN: G', 'g'],
    ['UN: LT', 'l'],
    ['UN: ML', 'ml'],
    ['UN: UN', 'un'],
    ['UN: PCT', 'un'],
    [null, 'un'],
  ])('"%s" → %s', (texto, esperado) => {
    expect(lerUnidadeDaNota(texto)).toBe(esperado);
  });
});

describe('formatarNomeDaNota', () => {
  it('deixa só a primeira letra de cada palavra maiúscula', () => {
    expect(formatarNomeDaNota('OLEO SOJA SOYA 900ML')).toBe('Oleo Soja Soya 900ml');
    expect(formatarNomeDaNota('AÇÚCAR UNIÃO 1KG')).toBe('Açúcar União 1kg');
  });
});
