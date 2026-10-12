import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';

import type { Carga } from '@/domain/carga';

import type { Banco } from './banco';

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
  return useConsultaRecarregavel(consulta)[0];
}

/** Como useConsulta, mais uma função para recarregar depois de gravar na própria tela. */
export function useConsultaRecarregavel<T>(consulta: Consulta<T>): [Carga<T>, () => void] {
  const banco = useBanco();
  const [carga, setCarga] = useState<Carga<T>>({ status: 'carregando' });

  // Usada no foco (com cancelamento ao sair da tela) e para recarregar à mão.
  const carregar = useCallback(() => {
    let ativa = true;
    consulta(banco).then(
      (dados) => ativa && setCarga({ status: 'pronto', dados }),
      (erro: unknown) => ativa && setCarga({ status: 'erro', erro }),
    );
    return () => {
      ativa = false;
    };
  }, [banco, consulta]);

  useFocusEffect(carregar);

  return [carga, carregar];
}
