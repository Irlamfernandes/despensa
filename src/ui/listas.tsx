import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Carga } from '@/domain/carga';

import { Vazio } from './basicos';
import { cores, espaco, fonte, raio } from './tema';

interface LinhaProps {
  titulo: string;
  subtitulo?: string;
  valor?: string;
  onPress?: () => void;
}

/** Linha de lista: título e subtítulo à esquerda, valor à direita. */
export function Linha({ titulo, subtitulo, valor, onPress }: LinhaProps) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [estilos.linha, pressed && estilos.pressionada]}
    >
      <View style={estilos.textos}>
        <Text style={estilos.titulo}>{titulo}</Text>
        {subtitulo ? <Text style={estilos.subtitulo}>{subtitulo}</Text> : null}
      </View>
      {valor ? <Text style={estilos.valor}>{valor}</Text> : null}
    </Pressable>
  );
}

interface CarregavelProps<T> {
  carga: Carga<T>;
  children: (dados: T) => ReactNode;
}

/** Mostra indicador enquanto carrega, mensagem em caso de erro e o conteúdo quando pronto. */
export function Carregavel<T>({ carga, children }: CarregavelProps<T>) {
  if (carga.status === 'carregando') {
    return <ActivityIndicator style={estilos.carregando} color={cores.primaria} />;
  }
  if (carga.status === 'erro') {
    return <Vazio>Não foi possível carregar os dados.</Vazio>;
  }
  return <>{children(carga.dados)}</>;
}

const estilos = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    backgroundColor: cores.superficie,
    borderRadius: raio.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: cores.borda,
    paddingHorizontal: espaco.lg,
    paddingVertical: espaco.md,
  },
  pressionada: { backgroundColor: cores.primariaSuave },
  textos: { flex: 1, gap: 2 },
  titulo: { fontSize: fonte.media, color: cores.texto },
  subtitulo: { fontSize: fonte.pequena, color: cores.textoSuave },
  valor: { flexShrink: 0, fontSize: fonte.media, fontWeight: '600', color: cores.texto },
  carregando: { paddingVertical: espaco.xl },
});
