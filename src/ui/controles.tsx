import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { cores, espaco, fonte, raio } from './tema';

type VarianteDoBotao = 'primario' | 'secundario' | 'perigo';

interface BotaoProps {
  titulo: string;
  onPress: () => void;
  variante?: VarianteDoBotao;
  desabilitado?: boolean;
}

export function Botao({
  titulo,
  onPress,
  variante = 'primario',
  desabilitado = false,
}: BotaoProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={desabilitado}
      style={({ pressed }) => [
        estilos.botao,
        estilos[variante],
        (pressed || desabilitado) && estilos.apagado,
      ]}
    >
      <Text style={[estilos.textoDoBotao, variante !== 'primario' && estilos.textoEscuro]}>
        {titulo}
      </Text>
    </Pressable>
  );
}

interface CampoProps extends Omit<TextInputProps, 'style' | 'onChange'> {
  rotulo: string;
}

export function Campo({ rotulo, ...props }: CampoProps) {
  return (
    <View style={estilos.campo}>
      <Text style={estilos.rotulo}>{rotulo}</Text>
      <TextInput
        style={estilos.entrada}
        placeholderTextColor={cores.textoSuave}
        accessibilityLabel={rotulo}
        {...props}
      />
    </View>
  );
}

interface ChipsProps<T extends string> {
  opcoes: readonly T[];
  selecionada?: T;
  onEscolher: (opcao: T) => void;
}

/** Linha de opções tocáveis (unidades, sugestões). */
export function Chips<T extends string>({ opcoes, selecionada, onEscolher }: ChipsProps<T>) {
  return (
    <View style={estilos.chips}>
      {opcoes.map((opcao) => (
        <Pressable
          key={opcao}
          accessibilityRole="button"
          accessibilityState={{ selected: opcao === selecionada }}
          onPress={() => onEscolher(opcao)}
          style={[estilos.chip, opcao === selecionada && estilos.chipSelecionado]}
        >
          <Text style={[estilos.textoDoChip, opcao === selecionada && estilos.textoNaPrimaria]}>
            {opcao}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  botao: {
    borderRadius: raio.md,
    paddingVertical: espaco.md,
    paddingHorizontal: espaco.lg,
    alignItems: 'center',
  },
  primario: { backgroundColor: cores.primaria },
  secundario: { backgroundColor: cores.superficie, borderWidth: 1, borderColor: cores.borda },
  perigo: { backgroundColor: cores.superficie, borderWidth: 1, borderColor: cores.perigo },
  apagado: { opacity: 0.6 },
  textoDoBotao: { fontSize: fonte.media, fontWeight: '600', color: cores.textoNaPrimaria },
  textoEscuro: { color: cores.texto },
  campo: { gap: espaco.xs },
  rotulo: { fontSize: fonte.pequena, fontWeight: '600', color: cores.textoSuave },
  entrada: {
    backgroundColor: cores.superficie,
    borderRadius: raio.sm,
    borderWidth: 1,
    borderColor: cores.borda,
    paddingHorizontal: espaco.md,
    paddingVertical: espaco.sm,
    fontSize: fonte.media,
    color: cores.texto,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm },
  chip: {
    borderRadius: raio.pilula,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.superficie,
    paddingHorizontal: espaco.md,
    paddingVertical: espaco.xs + 2,
  },
  chipSelecionado: { backgroundColor: cores.primaria, borderColor: cores.primaria },
  textoDoChip: { fontSize: fonte.normal, color: cores.texto },
  textoNaPrimaria: { color: cores.textoNaPrimaria },
});
