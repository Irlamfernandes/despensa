import { notaParaCompra, type NotaFiscal } from '@/domain/nfce/nota';

import type { Banco } from '../banco';
import { listarMercados } from '../catalogo';
import { buscarCompra, buscarCompraPorChave, excluirCompra, salvarCompra } from '../compras';
import { criarBancoDeTeste } from './banco-em-memoria';

jest.mock('expo-crypto', () => ({ randomUUID: () => jest.requireActual('crypto').randomUUID() }));

const CHAVE = '33261012345678000195650010000123451123456783';

const nota: NotaFiscal = {
  mercado: 'MERCADO EXEMPLO LTDA',
  cnpj: '12345678000195',
  data: '2026-10-05',
  chave: CHAVE,
  total: 2900,
  itens: [
    {
      nome: 'OLEO SOJA EXEMPLO 900ML',
      codigo: '10001',
      quantidade: 2,
      unidade: 'un',
      valorUnitario: 980,
      valorTotal: 1960,
    },
    {
      nome: 'QUEIJO MUSSARELA',
      codigo: '30003',
      quantidade: 0.2,
      unidade: 'kg',
      valorUnitario: 4990,
      valorTotal: 998,
    },
  ],
};

function importar(banco: Banco, n: NotaFiscal = nota) {
  return salvarCompra(banco, notaParaCompra(n), { chave: n.chave, cnpj: n.cnpj });
}

let banco: Banco;

beforeEach(async () => {
  banco = await criarBancoDeTeste();
});

describe('importação de NFC-e', () => {
  it('grava a compra com nomes formatados e o total pago (com desconto)', async () => {
    const id = await importar(banco);
    expect(await buscarCompra(banco, id)).toMatchObject({
      mercado: 'Mercado Exemplo Ltda',
      data: '2026-10-05',
      total: 2900, // a soma dos itens é 29,58: houve desconto de 0,58
      itens: [
        { produto: 'Oleo Soja Exemplo 900ml', quantidade: 2, unidade: 'un', total: 1960 },
        { produto: 'Queijo Mussarela', quantidade: 0.2, unidade: 'kg', total: 998 },
      ],
    });
    expect(await buscarCompraPorChave(banco, CHAVE)).toBe(id);
  });

  it('não deixa importar a mesma nota duas vezes', async () => {
    await importar(banco);
    await expect(importar(banco)).rejects.toThrow(/UNIQUE/);
  });

  it('depois de excluída, a nota pode ser importada de novo', async () => {
    const id = await importar(banco);
    await excluirCompra(banco, id);
    expect(await buscarCompraPorChave(banco, CHAVE)).toBeNull();
    await expect(importar(banco)).resolves.toEqual(expect.any(String));
  });

  it('reconhece o mercado pelo CNPJ, mesmo com outro nome', async () => {
    await importar(banco);
    const outraChave = '33261012345678000195650010000123461123456789';
    await importar(banco, { ...nota, chave: outraChave, mercado: 'MERCADO EXEMPLO FILIAL' });
    expect(await listarMercados(banco)).toEqual([
      expect.objectContaining({ nome: 'Mercado Exemplo Ltda' }),
    ]);
  });
});
