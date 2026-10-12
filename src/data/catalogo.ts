import { normalizarNome } from '@/domain/compra';
import type { Unidade } from '@/domain/quantidade';

import { agoraISO, type Banco } from './banco';
import { novoId } from './ids';

export interface Mercado {
  id: string;
  nome: string;
}

export interface Produto {
  id: string;
  nome: string;
  unidade: Unidade;
}

async function buscarIdPorNome(
  banco: Banco,
  tabela: 'mercados' | 'produtos',
  nome: string,
): Promise<string | null> {
  const linha = await banco.getFirstAsync<{ id: string }>(
    `SELECT id FROM ${tabela} WHERE nome_normalizado = ? AND excluido_em IS NULL`,
    [normalizarNome(nome)],
  );
  return linha?.id ?? null;
}

export interface DadosDoMercado {
  nome: string;
  cnpj?: string | null;
}

async function buscarIdPorCnpj(banco: Banco, cnpj: string | null | undefined) {
  if (!cnpj) return null;
  const linha = await banco.getFirstAsync<{ id: string }>(
    'SELECT id FROM mercados WHERE cnpj = ? AND excluido_em IS NULL',
    [cnpj],
  );
  return linha?.id ?? null;
}

/**
 * Devolve o id do mercado, criando se não existir. Procura primeiro pelo CNPJ
 * (vindo da nota fiscal) e depois pelo nome, ignorando acento e caixa.
 */
export async function buscarOuCriarMercado(
  banco: Banco,
  { nome, cnpj = null }: DadosDoMercado,
): Promise<string> {
  const existente =
    (await buscarIdPorCnpj(banco, cnpj)) ?? (await buscarIdPorNome(banco, 'mercados', nome));
  if (existente) return existente;

  const id = novoId();
  const agora = agoraISO();
  await banco.runAsync(
    `INSERT INTO mercados (id, nome, nome_normalizado, cnpj, criado_em, atualizado_em)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, nome.trim(), normalizarNome(nome), cnpj, agora, agora],
  );
  return id;
}

/**
 * Devolve o id do produto com esse nome, criando se não existir. A unidade só é
 * usada na criação: um produto já cadastrado mantém a unidade original.
 */
export async function buscarOuCriarProduto(
  banco: Banco,
  produto: Omit<Produto, 'id'>,
): Promise<string> {
  const existente = await buscarIdPorNome(banco, 'produtos', produto.nome);
  if (existente) return existente;

  const id = novoId();
  const agora = agoraISO();
  await banco.runAsync(
    `INSERT INTO produtos (id, nome, nome_normalizado, unidade, criado_em, atualizado_em)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, produto.nome.trim(), normalizarNome(produto.nome), produto.unidade, agora, agora],
  );
  return id;
}

export function listarMercados(banco: Banco): Promise<Mercado[]> {
  return banco.getAllAsync<Mercado>(
    'SELECT id, nome FROM mercados WHERE excluido_em IS NULL ORDER BY nome_normalizado',
    [],
  );
}

export function listarProdutosDoCatalogo(banco: Banco): Promise<Produto[]> {
  return banco.getAllAsync<Produto>(
    'SELECT id, nome, unidade FROM produtos WHERE excluido_em IS NULL ORDER BY nome_normalizado',
    [],
  );
}
