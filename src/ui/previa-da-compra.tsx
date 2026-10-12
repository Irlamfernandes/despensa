import { View, StyleSheet } from 'react-native';

import { descontoDaCompra, type CompraValida } from '@/domain/compra';
import { formatarDataBR } from '@/domain/datas';
import { formatarDinheiro } from '@/domain/dinheiro';
import { formatarQuantidade } from '@/domain/quantidade';

import { Cartao, Secao, TextoSuave, Titulo } from './basicos';
import { Linha } from './listas';
import { espaco } from './tema';

/** Resumo de uma compra ainda não salva (lida da nota fiscal), para conferência. */
export function PreviaDaCompra({ compra }: { compra: CompraValida }) {
  const desconto = descontoDaCompra(compra);
  return (
    <View style={estilos.grupo}>
      <Cartao destaque>
        <Titulo>{compra.mercado}</Titulo>
        <TextoSuave>{formatarDataBR(compra.data)}</TextoSuave>
        <Titulo>{formatarDinheiro(compra.total)}</Titulo>
        {desconto > 0 ? <TextoSuave>Desconto de {formatarDinheiro(desconto)}</TextoSuave> : null}
      </Cartao>
      <Secao titulo={`${compra.itens.length} itens`}>
        {compra.itens.map((item, indice) => (
          <Linha
            key={`${item.produto}-${indice}`}
            titulo={item.produto}
            subtitulo={`${formatarQuantidade(item.quantidade, item.unidade)} × ${formatarDinheiro(item.precoUnitario)}`}
            valor={formatarDinheiro(item.total)}
          />
        ))}
      </Secao>
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: { gap: espaco.lg },
});
