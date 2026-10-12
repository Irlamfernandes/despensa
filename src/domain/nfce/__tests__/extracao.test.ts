/**
 * @jest-environment jsdom
 */
// Roda o SCRIPT_DE_EXTRACAO de verdade (como na WebView) contra a página de
// exemplo e confere a conversão completa. Se a SEFAZ mudar o layout, atualize a
// página em fixtures/ com a nova estrutura (sempre com dados fictícios).
import { readFileSync } from 'fs';
import { join } from 'path';

import { converterNota, type NotaBruta } from '../nota';
import { SCRIPT_DE_EXTRACAO } from '../script-de-extracao';

type Mensagem = { tipo: 'nota'; nota: NotaBruta } | { tipo: 'sem-nota'; titulo: string };

function executarScript(html: string): Mensagem {
  document.documentElement.innerHTML = html;
  const mensagens: string[] = [];
  Object.assign(window, { ReactNativeWebView: { postMessage: (m: string) => mensagens.push(m) } });
  new Function(SCRIPT_DE_EXTRACAO)();
  return JSON.parse(mensagens[0] ?? 'null') as Mensagem;
}

const pagina = readFileSync(join(__dirname, 'fixtures', 'nfce-rj.html'), 'utf-8');

describe('SCRIPT_DE_EXTRACAO + converterNota', () => {
  it('lê a nota completa da página da SEFAZ-RJ', () => {
    const mensagem = executarScript(pagina);
    expect(mensagem.tipo).toBe('nota');
    if (mensagem.tipo !== 'nota') return;

    expect(converterNota(mensagem.nota)).toEqual({
      ok: true,
      valor: {
        mercado: 'MERCADO EXEMPLO LTDA',
        cnpj: '12345678000195',
        data: '2026-10-05',
        chave: '33261012345678000195650010000123451123456783',
        total: 5071,
        itens: [
          {
            nome: 'ARROZ TIPO 1 EXEMPLO 5KG',
            codigo: '10001',
            quantidade: 1,
            unidade: 'un',
            valorUnitario: 2490,
            valorTotal: 2490,
          },
          {
            nome: 'SUCO EM PO EXEMPLO 18G',
            codigo: '20002',
            quantidade: 3,
            unidade: 'un',
            valorUnitario: 175,
            valorTotal: 525,
          },
          {
            nome: 'QUEIJO MUSSARELA FATIADO',
            codigo: '30003',
            quantidade: 0.412,
            unidade: 'kg',
            valorUnitario: 4990,
            valorTotal: 2056,
          },
        ],
      },
    });
  });

  it('avisa quando a página não é uma nota (erro, bloqueio, desafio anti-robô)', () => {
    const mensagem = executarScript('<title>Acesso bloqueado</title><p>Bloqueado</p>');
    expect(mensagem).toEqual({ tipo: 'sem-nota', titulo: 'Acesso bloqueado' });
  });
});
