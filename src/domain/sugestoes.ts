import { normalizarNome } from './compra';

/**
 * Nomes já cadastrados que contêm o texto digitado (ignorando acento e caixa).
 * Os que começam com o texto vêm primeiro. Não sugere o que já foi digitado por inteiro.
 */
export function filtrarSugestoes(opcoes: readonly string[], texto: string, limite = 5): string[] {
  const busca = normalizarNome(texto);
  if (!busca) return [];

  const candidatas = opcoes
    .map((nome) => ({ nome, normalizado: normalizarNome(nome) }))
    .filter(({ normalizado }) => normalizado.includes(busca) && normalizado !== busca);

  const pontuar = (normalizado: string) => (normalizado.startsWith(busca) ? 0 : 1);
  return candidatas
    .sort((a, b) => pontuar(a.normalizado) - pontuar(b.normalizado))
    .slice(0, limite)
    .map(({ nome }) => nome);
}
