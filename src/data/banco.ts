// Contrato mínimo com o SQLite. O SQLiteDatabase do expo-sqlite o satisfaz no
// app; nos testes, uma implementação com better-sqlite3 roda o mesmo SQL no Node.
// Repositórios dependem só desta interface, nunca do expo-sqlite direto.

export type ValorSQL = string | number | null;
export type Parametros = ValorSQL[];

export interface Banco {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, parametros: Parametros): Promise<unknown>;
  getFirstAsync<T>(sql: string, parametros: Parametros): Promise<T | null>;
  getAllAsync<T>(sql: string, parametros: Parametros): Promise<T[]>;
  withTransactionAsync(tarefa: () => Promise<void>): Promise<void>;
}

/** Instante atual em ISO 8601 (UTC), usado em criado_em/atualizado_em. */
export function agoraISO(): string {
  return new Date().toISOString();
}

/** Arquivo do banco no aparelho. */
export const NOME_DO_BANCO = 'despensa.db';
