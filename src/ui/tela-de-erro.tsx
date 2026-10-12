import { StyleSheet, Text, View } from 'react-native';

import { Cartao, TextoSuave, Titulo } from './basicos';
import { Botao } from './controles';
import { cores, espaco, fonte } from './tema';

interface TelaDeErroProps {
  erro: Error;
  onTentarDeNovo: () => void;
}

/** Mostrada no lugar da tela que quebrou, em vez de uma tela branca. */
export function TelaDeErro({ erro, onTentarDeNovo }: TelaDeErroProps) {
  return (
    <View style={estilos.tela}>
      <Cartao>
        <Titulo>Algo deu errado</Titulo>
        <TextoSuave>O erro também foi registrado no log do app.</TextoSuave>
        <Text style={estilos.mensagem} selectable>
          {erro.message}
        </Text>
      </Cartao>
      <Botao titulo="Tentar de novo" onPress={onTentarDeNovo} />
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: {
    flex: 1,
    justifyContent: 'center',
    padding: espaco.lg,
    gap: espaco.lg,
    backgroundColor: cores.fundo,
  },
  mensagem: { fontSize: fonte.normal, color: cores.perigo, fontFamily: 'monospace' },
});
