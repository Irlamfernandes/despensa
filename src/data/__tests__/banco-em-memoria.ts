// Implementação de `Banco` com better-sqlite3, para testar o SQL real no Node.
// Só é usada nos testes; o app usa o SQLiteDatabase do expo-sqlite.
import Database from 'better-sqlite3';

import type { Banco, Parametros } from '../banco';
import { migrar } from '../migracoes';

// O better-sqlite3 é nativo e carregado uma vez por processo: quando dois
// arquivos de teste rodam no mesmo worker do Jest, o erro do SQLite vem do
// contexto do primeiro arquivo e o `toThrow` do segundo não o reconhece.
// Recriar o erro aqui mantém o teste independente de como o Jest os distribui.
function noContextoDoTeste<T>(operacao: () => T): T {
  try {
    return operacao();
  } catch (erro) {
    throw new Error((erro as { message?: string }).message ?? String(erro));
  }
}

class BancoEmMemoria implements Banco {
  private readonly db = new Database(':memory:');

  async execAsync(sql: string): Promise<void> {
    noContextoDoTeste(() => this.db.exec(sql));
  }

  async runAsync(sql: string, parametros: Parametros): Promise<unknown> {
    return noContextoDoTeste(() => this.db.prepare(sql).run(...parametros));
  }

  async getFirstAsync<T>(sql: string, parametros: Parametros): Promise<T | null> {
    return noContextoDoTeste(
      () => (this.db.prepare(sql).get(...parametros) as T | undefined) ?? null,
    );
  }

  async getAllAsync<T>(sql: string, parametros: Parametros): Promise<T[]> {
    return noContextoDoTeste(() => this.db.prepare(sql).all(...parametros) as T[]);
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
