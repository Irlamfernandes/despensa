// Datas de compra são guardadas como texto ISO "AAAA-MM-DD" (sem hora e sem
// fuso), que ordena corretamente como texto e é o formato do Postgres/Supabase.

export type DataISO = string;

const MS_POR_DIA = 24 * 60 * 60 * 1000;

function dois(n: number): string {
  return n.toString().padStart(2, '0');
}

/** Data local de hoje em ISO. */
export function hojeISO(agora: Date = new Date()): DataISO {
  return `${agora.getFullYear()}-${dois(agora.getMonth() + 1)}-${dois(agora.getDate())}`;
}

/** "25/12/2026" → "2026-12-25". Retorna null se a data não existir. */
export function lerDataBR(texto: string): DataISO | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(texto.trim());
  if (!m) return null;
  const [dia, mes, ano] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  if (
    data.getUTCFullYear() !== ano ||
    data.getUTCMonth() !== mes - 1 ||
    data.getUTCDate() !== dia
  ) {
    return null;
  }
  return `${ano}-${dois(mes)}-${dois(dia)}`;
}

/** "2026-12-25" → "25/12/2026". */
export function formatarDataBR(data: DataISO): string {
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

/** "2026-12-25" → "2026-12". */
export function chaveDoMes(data: DataISO): string {
  return data.slice(0, 7);
}

/** Mês anterior de uma chave "AAAA-MM". */
export function mesAnterior(chave: string): string {
  const [ano, mes] = chave.split('-').map(Number) as [number, number];
  return mes === 1 ? `${ano - 1}-12` : `${ano}-${dois(mes - 1)}`;
}

const NOMES_DOS_MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

/** "2026-03" → "março de 2026". */
export function nomeDoMes(chave: string): string {
  const [ano, mes] = chave.split('-').map(Number) as [number, number];
  return `${NOMES_DOS_MESES[mes - 1]} de ${ano}`;
}

function paraUTC(data: DataISO): number {
  const [ano, mes, dia] = data.split('-').map(Number) as [number, number, number];
  return Date.UTC(ano, mes - 1, dia);
}

/** Dias de `de` até `ate` (positivo se `ate` for depois). */
export function diasEntre(de: DataISO, ate: DataISO): number {
  return Math.round((paraUTC(ate) - paraUTC(de)) / MS_POR_DIA);
}

export function somarDias(data: DataISO, dias: number): DataISO {
  const d = new Date(paraUTC(data) + dias * MS_POR_DIA);
  return `${d.getUTCFullYear()}-${dois(d.getUTCMonth() + 1)}-${dois(d.getUTCDate())}`;
}
