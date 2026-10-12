import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { Suspense } from 'react';
import { ActivityIndicator } from 'react-native';

import { NOME_DO_BANCO } from '@/data/banco';
import { migrar } from '@/data/migracoes';
import { criarLog, registrarErrosGlobais } from '@/log';
import { TelaDeErro } from '@/ui/tela-de-erro';
import { cores } from '@/ui/tema';

const log = criarLog('app');

registrarErrosGlobais();
log.info('app iniciando');

async function iniciarBanco(banco: SQLiteDatabase): Promise<void> {
  log.info('abrindo banco', { arquivo: NOME_DO_BANCO });
  try {
    await migrar(banco);
    log.info('banco pronto');
  } catch (erro) {
    log.erro('falha ao preparar o banco', erro);
    throw erro;
  }
}

function ErroDeTela({ error, retry }: ErrorBoundaryProps) {
  log.erro('erro ao desenhar a tela', error);
  return <TelaDeErro erro={error} onTentarDeNovo={retry} />;
}

// Erro numa tela: mostra a mensagem mantendo a navegação montada.
export const unstable_settings = { screenErrorBoundary: ErroDeTela };

// Erro no próprio layout (ex.: banco não abriu): mostra a mensagem no lugar de tudo.
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErroDeTela {...props} />;
}

export default function LayoutRaiz() {
  return (
    <Suspense fallback={<ActivityIndicator style={{ flex: 1 }} color={cores.primaria} />}>
      <SQLiteProvider databaseName={NOME_DO_BANCO} onInit={iniciarBanco} useSuspense>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: cores.fundo },
            headerTintColor: cores.texto,
            contentStyle: { backgroundColor: cores.fundo },
          }}
        >
          <Stack.Screen name="(abas)" options={{ headerShown: false }} />
          <Stack.Screen name="compra/nova" options={{ title: 'Nova compra' }} />
          <Stack.Screen name="compra/escanear" options={{ title: 'Escanear nota fiscal' }} />
          <Stack.Screen name="compra/nota" options={{ title: 'Nota fiscal' }} />
          <Stack.Screen name="compra/[id]" options={{ title: 'Compra' }} />
          <Stack.Screen name="produto/[id]" options={{ title: 'Produto' }} />
        </Stack>
      </SQLiteProvider>
    </Suspense>
  );
}
