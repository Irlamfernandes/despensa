import { StyleSheet, Text, View } from 'react-native';

import { Cartao, TextoSuave } from './basicos';
import { Botao } from './controles';
import { cores, espaco, fonte } from './tema';

interface PerguntaProps {
  pergunta: string;
  detalhe: string;
  onSim: () => void;
  onNao: () => void;
}

/** Cartão com uma pergunta de sim ou não. */
export function Pergunta({ pergunta, detalhe, onSim, onNao }: PerguntaProps) {
  return (
    <Cartao>
      <Text style={estilos.pergunta}>{pergunta}</Text>
      <TextoSuave>{detalhe}</TextoSuave>
      <View style={estilos.botoes}>
        <View style={estilos.botao}>
          <Botao titulo="Não" variante="secundario" onPress={onNao} />
        </View>
        <View style={estilos.botao}>
          <Botao titulo="Sim" onPress={onSim} />
        </View>
      </View>
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  pergunta: { fontSize: fonte.media, fontWeight: '600', color: cores.texto },
  botoes: { flexDirection: 'row', gap: espaco.md, marginTop: espaco.sm },
  botao: { flex: 1 },
});
