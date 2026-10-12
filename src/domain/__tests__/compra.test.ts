import {
  descontoDaCompra,
  normalizarNome,
  validarCompra,
  validarItem,
  validarNomeDoMercado,
  type ItemValido,
} from '../compra';

describe('normalizarNome', () => {
  it('ignora acento, caixa e espaços extras', () => {
    expect(normalizarNome('  Café   PILÃO ')).toBe('cafe pilao');
  });
});

describe('validarItem', () => {
  it('calcula o total do item', () => {
    const resultado = validarItem({
      produto: ' Arroz ',
      quantidade: '2',
      unidade: 'un',
      precoUnitario: '24,90',
    });
    expect(resultado).toEqual({
      ok: true,
      valor: { produto: 'Arroz', quantidade: 2, unidade: 'un', precoUnitario: 2490, total: 4980 },
    });
  });

  it('lista todos os erros de uma vez', () => {
    const resultado = validarItem({
      produto: '',
      quantidade: '0',
      unidade: 'kg',
      precoUnitario: 'x',
    });
    expect(resultado).toEqual({
      ok: false,
      erros: ['Informe o produto.', 'Quantidade inválida.', 'Preço inválido.'],
    });
  });
});

describe('validarCompra', () => {
  const item: ItemValido = {
    produto: 'Leite',
    quantidade: 12,
    unidade: 'un',
    precoUnitario: 499,
    total: 5988,
  };

  it('soma o total dos itens e converte a data', () => {
    const resultado = validarCompra({
      mercado: 'Mercado A',
      data: '10/10/2026',
      itens: [item, item],
    });
    expect(resultado).toEqual({
      ok: true,
      valor: { mercado: 'Mercado A', data: '2026-10-10', itens: [item, item], total: 11976 },
    });
  });

  it('exige mercado, data válida e itens', () => {
    expect(validarCompra({ mercado: ' ', data: '32/10/2026', itens: [] })).toEqual({
      ok: false,
      erros: [
        'Informe o mercado.',
        'Data inválida. Use DD/MM/AAAA.',
        'Adicione pelo menos um item.',
      ],
    });
  });
});

describe('descontoDaCompra', () => {
  const item: ItemValido = {
    produto: 'X',
    quantidade: 1,
    unidade: 'un',
    precoUnitario: 1000,
    total: 1000,
  };

  it('é a diferença entre a soma dos itens e o total pago', () => {
    expect(
      descontoDaCompra({ mercado: 'A', data: '2026-10-01', itens: [item, item], total: 1850 }),
    ).toBe(150);
  });

  it('nunca é negativo', () => {
    expect(descontoDaCompra({ mercado: 'A', data: '2026-10-01', itens: [item], total: 1000 })).toBe(
      0,
    );
  });
});

describe('validarNomeDoMercado', () => {
  it('limpa espaços e recusa nome vazio', () => {
    expect(validarNomeDoMercado('  Mercado   do Bairro ')).toEqual({
      ok: true,
      valor: 'Mercado do Bairro',
    });
    expect(validarNomeDoMercado('   ')).toEqual({
      ok: false,
      erros: ['Informe o nome do mercado.'],
    });
  });
});
