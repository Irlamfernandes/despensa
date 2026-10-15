import { lerMensagem } from '../leitura';
import type { NotaBruta } from '../nota';

const notaBruta: NotaBruta = {
  mercado: 'MERCADO',
  cabecalho: 'CNPJ: 12.345.678/0001-95',
  totais: 'Valor a pagar R$: 6,99',
  informacoes: 'Emissão: 12/10/2026 12:00:00',
  chave: '33261012345678000195650010000123451123456783',
  itens: [
    {
      nome: 'MORTADELA 180G',
      codigo: '(Código: 1)',
      quantidade: 'Qtde.:1',
      unidade: 'UN: UN',
      valorUnitario: 'Vl. Unit.: 6,99',
      valorTotal: '6,99',
    },
  ],
};

describe('lerMensagem', () => {
  it('só aceita mensagens no formato do script', () => {
    expect(lerMensagem(JSON.stringify({ tipo: 'nota', nota: notaBruta }))).toEqual(notaBruta);
    expect(lerMensagem(JSON.stringify({ tipo: 'sem-nota' }))).toBe('sem-nota');
    expect(lerMensagem(JSON.stringify({ tipo: 'outro' }))).toBeNull();
    expect(lerMensagem('{quebrado')).toBeNull();
  });
});
