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

export interface MercadoDetalhado extends Mercado {
  cnpj: string | null;
}

export function buscarMercado(banco: Banco, id: string): Promise<MercadoDetalhado | null> {
  return banco.getFirstAsync<MercadoDetalhado>(
    'SELECT id, nome, cnpj FROM mercados WHERE id = ? AND excluido_em IS NULL',
    [id],
  );
}

export type ResultadoDaRenomeacao = { tipo: 'renomeado' } | { tipo: 'nome-em-uso'; outro: Mercado };

/**
 * Troca o nome do mercado (ex.: a razão social da nota por um nome curto). Se
 * outro mercado já usa esse nome, não altera nada e devolve o outro, para a
 * tela oferecer juntar os dois.
 */
export async function renomearMercado(
  banco: Banco,
  id: string,
  nome: string,
): Promise<ResultadoDaRenomeacao> {
  const outro = await banco.getFirstAsync<Mercado>(
    `SELECT id, nome FROM mercados
      WHERE nome_normalizado = ? AND id <> ? AND excluido_em IS NULL`,
    [normalizarNome(nome), id],
  );
  if (outro) return { tipo: 'nome-em-uso', outro };

  await banco.runAsync(
    'UPDATE mercados SET nome = ?, nome_normalizado = ?, atualizado_em = ? WHERE id = ?',
    [nome.trim(), normalizarNome(nome), agoraISO(), id],
  );
  return { tipo: 'renomeado' };
}

/**
 * Passa as compras de `origemId` para `destinoId` e exclui a origem. O destino
 * herda o CNPJ da origem se não tiver um, para as próximas notas desse
 * mercado caírem nele.
 */
export async function juntarMercados(
  banco: Banco,
  origemId: string,
  destinoId: string,
): Promise<void> {
  const agora = agoraISO();
  await banco.withTransactionAsync(async () => {
    await banco.runAsync(
      'UPDATE compras SET mercado_id = ?, atualizado_em = ? WHERE mercado_id = ?',
      [destinoId, agora, origemId],
    );
    await banco.runAsync('UPDATE mercados SET excluido_em = ?, atualizado_em = ? WHERE id = ?', [
      agora,
      agora,
      origemId,
    ]);
    await banco.runAsync(
      `UPDATE mercados SET cnpj = (SELECT cnpj FROM mercados WHERE id = ?), atualizado_em = ?
        WHERE id = ? AND cnpj IS NULL`,
      [origemId, agora, destinoId],
    );
  });
}
