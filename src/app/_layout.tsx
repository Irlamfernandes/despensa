import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { Suspense } from 'react';
import { ActivityIndicator } from 'react-native';

import { migrar } from '@/data/migracoes';
import { NOME_DO_BANCO } from '@/data/banco';
import { cores } from '@/ui/tema';

export default function LayoutRaiz() {
  return (
    <Suspense fallback={<ActivityIndicator style={{ flex: 1 }} color={cores.primaria} />}>
      <SQLiteProvider databaseName={NOME_DO_BANCO} onInit={migrar} useSuspense>
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
