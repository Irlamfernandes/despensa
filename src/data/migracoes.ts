import type { Banco } from './banco';

// Cada posição da lista é uma versão do banco (PRAGMA user_version).
// Nunca altere uma migração já publicada: acrescente uma nova no fim.
// Convenções (pensadas para a sincronização futura com o Supabase):
// - id TEXT com UUID, gerado no app;
// - criado_em / atualizado_em em ISO 8601;
// - excluido_em para exclusão lógica (a linha some das telas, mas não do banco).
const MIGRACOES: readonly string[] = [
  `
  CREATE TABLE mercados (
    id TEXT PRIMARY KEY NOT NULL,
    nome TEXT NOT NULL,
    nome_normalizado TEXT NOT NULL,
    criado_em TEXT NOT NULL,
    atualizado_em TEXT NOT NULL,
    excluido_em TEXT
  );
  CREATE UNIQUE INDEX mercados_nome_unico ON mercados (nome_normalizado) WHERE excluido_em IS NULL;

  CREATE TABLE produtos (
    id TEXT PRIMARY KEY NOT NULL,
    nome TEXT NOT NULL,
    nome_normalizado TEXT NOT NULL,
    unidade TEXT NOT NULL CHECK (unidade IN ('un', 'kg', 'g', 'l', 'ml')),
    criado_em TEXT NOT NULL,
    atualizado_em TEXT NOT NULL,
    excluido_em TEXT
  );
  CREATE UNIQUE INDEX produtos_nome_unico ON produtos (nome_normalizado) WHERE excluido_em IS NULL;

  CREATE TABLE compras (
    id TEXT PRIMARY KEY NOT NULL,
    mercado_id TEXT NOT NULL REFERENCES mercados (id),
    data TEXT NOT NULL,
    total INTEGER NOT NULL,
    origem TEXT NOT NULL CHECK (origem IN ('manual', 'nfce')),
    criado_em TEXT NOT NULL,
    atualizado_em TEXT NOT NULL,
    excluido_em TEXT
  );
  CREATE INDEX compras_data ON compras (data);

  CREATE TABLE itens_compra (
    id TEXT PRIMARY KEY NOT NULL,
    compra_id TEXT NOT NULL REFERENCES compras (id),
    produto_id TEXT NOT NULL REFERENCES produtos (id),
    quantidade REAL NOT NULL CHECK (quantidade > 0),
    unidade TEXT NOT NULL CHECK (unidade IN ('un', 'kg', 'g', 'l', 'ml')),
    preco_unitario INTEGER NOT NULL CHECK (preco_unitario >= 0),
    total INTEGER NOT NULL CHECK (total >= 0),
    criado_em TEXT NOT NULL,
    atualizado_em TEXT NOT NULL,
    excluido_em TEXT
  );
  CREATE INDEX itens_compra_compra ON itens_compra (compra_id);
  CREATE INDEX itens_compra_produto ON itens_compra (produto_id);
  `,
  // 2: leitura da NFC-e. A chave impede importar o mesmo cupom duas vezes; o CNPJ
  // identifica o mercado mesmo que o nome seja editado depois.
  `
  ALTER TABLE compras ADD COLUMN chave_nfce TEXT;
  CREATE UNIQUE INDEX compras_chave_nfce_unica ON compras (chave_nfce)
    WHERE chave_nfce IS NOT NULL AND excluido_em IS NULL;

  ALTER TABLE mercados ADD COLUMN cnpj TEXT;
  CREATE UNIQUE INDEX mercados_cnpj_unico ON mercados (cnpj)
    WHERE cnpj IS NOT NULL AND excluido_em IS NULL;
  `,
];

export const VERSAO_ATUAL = MIGRACOES.length;

/** Aplica, em ordem, as migrações que o banco ainda não tem. */
export async function migrar(banco: Banco): Promise<void> {
  await banco.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const linha = await banco.getFirstAsync<{ user_version: number }>('PRAGMA user_version', []);
  const versao = linha?.user_version ?? 0;

  for (const [indice, sql] of MIGRACOES.slice(versao).entries()) {
    await banco.withTransactionAsync(async () => {
      await banco.execAsync(sql);
      await banco.execAsync(`PRAGMA user_version = ${versao + indice + 1}`);
    });
  }
}
