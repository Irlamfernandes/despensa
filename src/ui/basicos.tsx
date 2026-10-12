import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cores, espaco, fonte, raio } from './tema';

interface ComFilhos {
  children: ReactNode;
}

/** Tela com fundo, rolagem e respeito às áreas seguras (status bar, gestos). */
export function Tela({ children }: ComFilhos) {
  return (
    <SafeAreaView style={estilos.tela} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Titulo({ children }: ComFilhos) {
  return <Text style={estilos.titulo}>{children}</Text>;
}

export function Secao({ titulo, children }: ComFilhos & { titulo: string }) {
  return (
    <View style={estilos.secao}>
      <Text style={estilos.tituloDaSecao}>{titulo}</Text>
      {children}
    </View>
  );
}

export function Cartao({ children, destaque = false }: ComFilhos & { destaque?: boolean }) {
  return <View style={[estilos.cartao, destaque && estilos.cartaoDestaque]}>{children}</View>;
}

export function TextoSuave({ children }: ComFilhos) {
  return <Text style={estilos.textoSuave}>{children}</Text>;
}

export function Vazio({ children }: ComFilhos) {
  return (
    <View style={estilos.vazio}>
      <Text style={estilos.textoSuave}>{children}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espaco.lg, gap: espaco.lg },
  titulo: { fontSize: fonte.grande, fontWeight: '700', color: cores.texto },
  secao: { gap: espaco.sm },
  tituloDaSecao: {
    fontSize: fonte.pequena,
    fontWeight: '700',
    color: cores.textoSuave,
    textTransform: 'uppercase',
  },
  cartao: {
    backgroundColor: cores.superficie,
    borderRadius: raio.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: cores.borda,
    padding: espaco.lg,
    gap: espaco.xs,
  },
  cartaoDestaque: { backgroundColor: cores.primariaSuave, borderColor: cores.primariaSuave },
  textoSuave: { fontSize: fonte.normal, color: cores.textoSuave },
  vazio: { paddingVertical: espaco.xl, alignItems: 'center' },
});
