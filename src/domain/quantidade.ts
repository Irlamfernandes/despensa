export const UNIDADES = ['un', 'kg', 'g', 'l', 'ml'] as const;

export type Unidade = (typeof UNIDADES)[number];

export function ehUnidade(valor: string): valor is Unidade {
  return (UNIDADES as readonly string[]).includes(valor);
}

/** "1,5" ou "1.5" → 1.5. Só aceita números maiores que zero. */
export function lerQuantidade(texto: string): number | null {
  const limpo = texto.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(limpo)) return null;
  const valor = Number(limpo);
  return valor > 0 ? valor : null;
}

/** 1.5 → "1,5"; 2 → "2". */
export function formatarQuantidade(valor: number, unidade: Unidade): string {
  const numero = Number.isInteger(valor) ? valor.toString() : valor.toString().replace('.', ',');
  return `${numero} ${unidade}`;
}
