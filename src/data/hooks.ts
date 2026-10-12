import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';

import type { Carga } from '@/domain/carga';
import { criarLog } from '@/log';

import type { Banco } from './banco';

const log = criarLog('consulta');

export type Consulta<T> = (banco: Banco) => Promise<T>;

/** Banco do app, fornecido pelo <SQLiteProvider> do layout raiz. */
export function useBanco(): Banco {
  return useSQLiteContext();
}

/**
 * Executa a consulta sempre que a tela ganha foco, para refletir o que foi
 * gravado em outras telas. A consulta precisa ser estável: use uma função do
 * módulo ou envolva em useCallback quando depender de parâmetros da rota.
 */
export function useConsulta<T>(consulta: Consulta<T>): Carga<T> {
  const banco = useBanco();
  const [carga, setCarga] = useState<Carga<T>>({ status: 'carregando' });

  useFocusEffect(
    useCallback(() => {
      let ativa = true;
      const nome = consulta.name || 'anônima';
      const inicio = Date.now();
      log.info('consultando', { consulta: nome });
      consulta(banco).then(
        (dados) => {
          log.info('consulta pronta', { consulta: nome, ms: Date.now() - inicio });
          if (ativa) setCarga({ status: 'pronto', dados });
        },
        (erro: unknown) => {
          log.erro('consulta falhou', erro, { consulta: nome });
          if (ativa) setCarga({ status: 'erro', erro });
        },
      );
      return () => {
        ativa = false;
      };
    }, [banco, consulta]),
  );

  return carga;
}
