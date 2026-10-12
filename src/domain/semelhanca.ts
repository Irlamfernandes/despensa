// Semelhança entre nomes de produto, sem IA: compara as palavras. Serve para
// perguntar se "SUCO PO TANG LARANJA 25G" (nome da nota) é o "Suco em pó" da
// lista. A decisão final é sempre de quem usa o app.
import { normalizarNome } from './compra';

const PALAVRAS_VAZIAS = new Set([
  'a',
  'o',
  'e',
  'de',
  'da',
  'do',
  'das',
  'dos',
  'em',
  'com',
  'para',
]);

// Abreviação só conta a partir deste tamanho ("deterg" → "detergente").
const PREFIXO_MINIMO = 4;

/** Fração mínima das palavras procuradas que precisam aparecer no outro nome. */
export const SEMELHANCA_MINIMA = 0.5;

function singular(palavra: string): string {
  return palavra.length > 3 && palavra.endsWith('s') ? palavra.slice(0, -1) : palavra;
}

/** Palavras que identificam o produto: sem acento, medidas (25G, 1KG) e preposições. */
export function palavrasDoNome(nome: string): string[] {
  return normalizarNome(nome)
    .split(/[^a-z0-9]+/)
    .filter((p) => p.length > 1 && !/\d/.test(p) && !PALAVRAS_VAZIAS.has(p))
    .map(singular);
}

function combinam(a: string, b: string): boolean {
  if (a === b) return true;
  const [curta, longa] = a.length <= b.length ? [a, b] : [b, a];
  return curta.length >= PREFIXO_MINIMO && longa.startsWith(curta);
}

/** Fração (0 a 1) das palavras de `procurado` que aparecem em `candidato`. */
export function semelhanca(procurado: string, candidato: string): number {
  const buscadas = palavrasDoNome(procurado);
  const encontradas = palavrasDoNome(candidato);
  if (buscadas.length === 0) return 0;
  const achadas = buscadas.filter((b) => encontradas.some((e) => combinam(b, e)));
  return achadas.length / buscadas.length;
}

export function saoSemelhantes(procurado: string, candidato: string): boolean {
  return semelhanca(procurado, candidato) >= SEMELHANCA_MINIMA;
}
