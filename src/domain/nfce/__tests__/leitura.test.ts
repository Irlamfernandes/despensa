import {
  ESTADO_INICIAL,
  lerMensagem,
  MOTIVO_NOTA_ILEGIVEL,
  MOTIVO_SEM_RESPOSTA,
  proximoEstado,
  type EstadoDaLeitura,
  type EventoDaLeitura,
} from '../leitura';
import type { NotaBruta } from '../nota';

const URLS = ['https://a.fazenda.rj.gov.br/1', 'https://b.fazenda.rj.gov.br/2'];

function aplicar(eventos: EventoDaLeitura[], inicial: EstadoDaLeitura = ESTADO_INICIAL) {
  return eventos.reduce((estado, evento) => proximoEstado(estado, evento, URLS), inicial);
}

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

const mensagem = (conteudo: unknown): EventoDaLeitura => ({
  tipo: 'mensagem',
  texto: JSON.stringify(conteudo),
});

describe('proximoEstado', () => {
  it('abre a primeira URL quando a nota ainda não foi importada', () => {
    expect(aplicar([{ tipo: 'nao-importada' }])).toEqual({
      etapa: 'abrindo',
      url: URLS[0],
      tentativa: 0,
    });
  });

  it('não abre nada se a nota já foi importada', () => {
    expect(aplicar([{ tipo: 'ja-importada', compraId: 'c1' }])).toEqual({
      etapa: 'duplicada',
      compraId: 'c1',
    });
  });

  it('segue redirecionamentos e ignora páginas sem nota até a nota chegar', () => {
    const estado = aplicar([
      { tipo: 'nao-importada' },
      { tipo: 'navegar', url: 'https://a.fazenda.rj.gov.br/resultado?cid=4' },
      mensagem({ tipo: 'sem-nota', titulo: 'carregando' }),
      { tipo: 'mensagem', texto: 'não é json' },
      mensagem({ tipo: 'nota', nota: notaBruta }),
    ]);
    expect(estado).toMatchObject({ etapa: 'lida', nota: { mercado: 'MERCADO', total: 699 } });
  });

  it('tenta a próxima URL quando uma falha e desiste depois da última', () => {
    expect(aplicar([{ tipo: 'nao-importada' }, { tipo: 'erro-de-carga' }])).toEqual({
      etapa: 'abrindo',
      url: URLS[1],
      tentativa: 1,
    });
    expect(
      aplicar([{ tipo: 'nao-importada' }, { tipo: 'erro-de-carga' }, { tipo: 'erro-de-carga' }]),
    ).toEqual({ etapa: 'falhou', motivo: MOTIVO_SEM_RESPOSTA });
  });

  it('falha quando o tempo esgota ou a nota não pode ser lida', () => {
    expect(aplicar([{ tipo: 'nao-importada' }, { tipo: 'tempo-esgotado' }])).toEqual({
      etapa: 'falhou',
      motivo: MOTIVO_SEM_RESPOSTA,
    });
    expect(
      aplicar([
        { tipo: 'nao-importada' },
        mensagem({ tipo: 'nota', nota: { ...notaBruta, itens: [] } }),
      ]),
    ).toEqual({ etapa: 'falhou', motivo: MOTIVO_NOTA_ILEGIVEL });
  });

  it('eventos atrasados não mudam uma leitura já concluída', () => {
    const lida = aplicar([{ tipo: 'nao-importada' }, mensagem({ tipo: 'nota', nota: notaBruta })]);
    expect(proximoEstado(lida, { tipo: 'tempo-esgotado' }, URLS)).toBe(lida);
    expect(proximoEstado(lida, { tipo: 'erro-de-carga' }, URLS)).toBe(lida);
  });

  it('permite tentar de novo depois de falhar', () => {
    const falhou = aplicar([{ tipo: 'nao-importada' }, { tipo: 'tempo-esgotado' }]);
    expect(proximoEstado(falhou, { tipo: 'tentar-de-novo' }, URLS)).toMatchObject({
      etapa: 'abrindo',
      tentativa: 0,
    });
  });
});

describe('lerMensagem', () => {
  it('só aceita mensagens no formato do script', () => {
    expect(lerMensagem(JSON.stringify({ tipo: 'nota', nota: notaBruta }))).toEqual(notaBruta);
    expect(lerMensagem(JSON.stringify({ tipo: 'sem-nota' }))).toBe('sem-nota');
    expect(lerMensagem(JSON.stringify({ tipo: 'outro' }))).toBeNull();
    expect(lerMensagem('{quebrado')).toBeNull();
  });
});
