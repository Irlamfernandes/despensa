import {
  descreverSituacao,
  montarLista,
  situacaoDoItem,
  validarItemDaLista,
  type CompraDoItem,
  type ItemDaLista,
} from '../lista';

const suco: ItemDaLista = {
  id: 'l1',
  produtoId: 'p1',
  produto: 'Suco em pó',
  quantidade: 30,
  unidade: 'un',
};

function compra(quantidade: number, unidade: CompraDoItem['unidade'] = 'un'): CompraDoItem {
  return { itemId: 'l1', quantidade, unidade };
}

describe('situacaoDoItem', () => {
  it('desconta o que foi comprado', () => {
    expect(situacaoDoItem(suco, [compra(3)])).toMatchObject({ comprado: 3, falta: 27 });
  });

  it('soma várias compras e ignora as de outros itens', () => {
    const outra = { itemId: 'l2', quantidade: 10, unidade: 'un' as const };
    expect(situacaoDoItem(suco, [compra(3), compra(5), outra])).toMatchObject({ falta: 22 });
  });

  it('não fica negativo quando compra mais do que o previsto', () => {
    expect(situacaoDoItem(suco, [compra(40)])).toMatchObject({ comprado: 30, falta: 0 });
  });

  it('compra em outra unidade resolve o item', () => {
    expect(situacaoDoItem(suco, [compra(0.5, 'kg')])).toMatchObject({ falta: 0 });
  });

  it('arredonda quantidades fracionadas', () => {
    const queijo: ItemDaLista = { ...suco, quantidade: 1, unidade: 'kg' };
    const compras = [compra(0.1, 'kg'), compra(0.2, 'kg')];
    expect(situacaoDoItem(queijo, compras)).toMatchObject({ comprado: 0.3, falta: 0.7 });
  });
});

describe('montarLista', () => {
  it('separa pendentes e comprados', () => {
    const arroz: ItemDaLista = { ...suco, id: 'l2', produto: 'Arroz', quantidade: 1 };
    const lista = montarLista([suco, arroz], [{ itemId: 'l2', quantidade: 1, unidade: 'un' }]);
    expect(lista.pendentes.map((i) => i.produto)).toEqual(['Suco em pó']);
    expect(lista.comprados.map((i) => i.produto)).toEqual(['Arroz']);
  });
});

describe('descreverSituacao', () => {
  it('descreve cada estado', () => {
    expect(descreverSituacao(situacaoDoItem(suco, []))).toBeUndefined();
    expect(descreverSituacao(situacaoDoItem(suco, [compra(3)]))).toBe('Comprou 3 un de 30 un');
    expect(descreverSituacao(situacaoDoItem(suco, [compra(30)]))).toBe('Comprado');
  });
});

describe('validarItemDaLista', () => {
  it('aceita produto e quantidade', () => {
    expect(validarItemDaLista({ produto: ' Leite ', quantidade: '1,5', unidade: 'l' })).toEqual({
      ok: true,
      valor: { produto: 'Leite', quantidade: 1.5, unidade: 'l' },
    });
  });

  it('recusa produto vazio e quantidade inválida', () => {
    expect(validarItemDaLista({ produto: '', quantidade: '0', unidade: 'un' })).toEqual({
      ok: false,
      erros: ['Informe o produto.', 'Quantidade inválida.'],
    });
  });
});
