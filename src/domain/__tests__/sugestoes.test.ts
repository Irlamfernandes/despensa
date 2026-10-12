import { filtrarSugestoes } from '../sugestoes';

const produtos = [
  'Café Pilão',
  'Leite condensado',
  'Leite',
  'Pão de forma',
  'Açúcar',
  'Achocolatado',
];

describe('filtrarSugestoes', () => {
  it('encontra pelo meio do nome, ignorando acento e caixa', () => {
    expect(filtrarSugestoes(produtos, 'PILAO')).toEqual(['Café Pilão']);
  });

  it('coloca primeiro os que começam com o texto', () => {
    expect(filtrarSugestoes(produtos, 'a')).toEqual([
      'Açúcar',
      'Achocolatado',
      'Café Pilão',
      'Leite condensado',
      'Pão de forma',
    ]);
  });

  it('não sugere o nome já digitado por completo', () => {
    expect(filtrarSugestoes(produtos, 'leite')).toEqual(['Leite condensado']);
  });

  it('respeita o limite e ignora texto vazio', () => {
    expect(filtrarSugestoes(produtos, 'e', 2)).toHaveLength(2);
    expect(filtrarSugestoes(produtos, '  ')).toEqual([]);
  });
});
