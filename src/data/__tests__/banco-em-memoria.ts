// Implementação de `Banco` com better-sqlite3, para testar o SQL real no Node.
// Só é usada nos testes; o app usa o SQLiteDatabase do expo-sqlite.
import Database from 'better-sqlite3';

import type { Banco, Parametros } from '../banco';
import { migrar } from '../migracoes';

class BancoEmMemoria implements Banco {
  private readonly db = new Database(':memory:');

  async execAsync(sql: string): Promise<void> {
    this.db.exec(sql);
  }

  async runAsync(sql: string, parametros: Parametros): Promise<unknown> {
    return this.db.prepare(sql).run(...parametros);
  }

  async getFirstAsync<T>(sql: string, parametros: Parametros): Promise<T | null> {
    return (this.db.prepare(sql).get(...parametros) as T | undefined) ?? null;
  }

  async getAllAsync<T>(sql: string, parametros: Parametros): Promise<T[]> {
    return this.db.prepare(sql).all(...parametros) as T[];
  }

  async withTransactionAsync(tarefa: () => Promise<void>): Promise<void> {
    this.db.exec('BEGIN');
    try {
      await tarefa();
      this.db.exec('COMMIT');
    } catch (erro) {
      this.db.exec('ROLLBACK');
      throw erro;
    }
  }
}

/** Banco novo, vazio e já migrado. */
export async function criarBancoDeTeste(): Promise<Banco> {
  const banco = new BancoEmMemoria();
  await migrar(banco);
  return banco;
}
