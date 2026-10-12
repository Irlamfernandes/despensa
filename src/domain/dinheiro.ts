// Valores monetários são sempre inteiros em centavos, para evitar erro de
// arredondamento de ponto flutuante (0,1 + 0,2 !== 0,3).

export type Centavos = number;

/** Converte o que o usuário digitou ("12,90", "1.234,5", "R$ 3") em centavos. */
export function lerDinheiro(texto: string): Centavos | null {
  const limpo = texto.replace(/R\$/i, '').replace(/\s/g, '');
  if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/.test(limpo)) {
    return null;
  }
  const [inteiros = '0', decimais = ''] = limpo.replace(/\./g, '').split(',');
  return Number(inteiros) * 100 + Number(decimais.padEnd(2, '0'));
}

/** Formata centavos como "R$ 1.234,56". */
export function formatarDinheiro(valor: Centavos): string {
  const sinal = valor < 0 ? '-' : '';
  const absoluto = Math.abs(Math.round(valor));
  const reais = Math.floor(absoluto / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const centavos = (absoluto % 100).toString().padStart(2, '0');
  return `${sinal}R$ ${reais},${centavos}`;
}

/** Total de um item: quantidade × preço unitário, arredondado ao centavo. */
export function totalDoItem(quantidade: number, precoUnitario: Centavos): Centavos {
  return Math.round(quantidade * precoUnitario);
}
