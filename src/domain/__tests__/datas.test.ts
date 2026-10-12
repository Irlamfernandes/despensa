import {
  chaveDoMes,
  diasEntre,
  formatarDataBR,
  hojeISO,
  lerDataBR,
  mesAnterior,
  nomeDoMes,
  somarDias,
} from '../datas';

describe('lerDataBR', () => {
  it('converte DD/MM/AAAA para ISO', () => {
    expect(lerDataBR('25/12/2026')).toBe('2026-12-25');
    expect(lerDataBR('1/2/2026')).toBe('2026-02-01');
  });

  it.each(['31/02/2026', '29/02/2025', '00/01/2026', '2026-12-25', '', '12/2026'])(
    'rejeita "%s"',
    (texto) => {
      expect(lerDataBR(texto)).toBeNull();
    },
  );

  it('aceita 29 de fevereiro em ano bissexto', () => {
    expect(lerDataBR('29/02/2028')).toBe('2028-02-29');
  });
});

describe('conversões', () => {
  it('formata ISO como DD/MM/AAAA', () => {
    expect(formatarDataBR('2026-03-07')).toBe('07/03/2026');
  });

  it('usa a data local para hoje', () => {
    expect(hojeISO(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });

  it('extrai e nomeia o mês', () => {
    expect(chaveDoMes('2026-03-07')).toBe('2026-03');
    expect(nomeDoMes('2026-03')).toBe('março de 2026');
  });

  it('volta um mês, virando o ano', () => {
    expect(mesAnterior('2026-03')).toBe('2026-02');
    expect(mesAnterior('2026-01')).toBe('2025-12');
  });
});

describe('aritmética de dias', () => {
  it('conta dias entre datas, inclusive atravessando meses', () => {
    expect(diasEntre('2026-01-30', '2026-02-02')).toBe(3);
    expect(diasEntre('2026-02-02', '2026-01-30')).toBe(-3);
  });

  it('soma dias', () => {
    expect(somarDias('2026-12-30', 3)).toBe('2027-01-02');
  });
});
