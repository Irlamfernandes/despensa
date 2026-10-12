import { router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { Alert } from 'react-native';

import type { Banco } from '@/data/banco';
import { buscarCompra, excluirCompra, type CompraDetalhada } from '@/data/compras';
import { useBanco, useConsulta } from '@/data/hooks';
import { formatarDataBR } from '@/domain/datas';
import { formatarDinheiro } from '@/domain/dinheiro';
import { formatarQuantidade } from '@/domain/quantidade';
import { Cartao, Secao, Tela, TextoSuave, Titulo, Vazio } from '@/ui/basicos';
import { Botao } from '@/ui/controles';
import { Carregavel, Linha } from '@/ui/listas';

function DetalheDaCompra({ compra }: { compra: CompraDetalhada }) {
  const banco = useBanco();

  const confirmarExclusao = () =>
    Alert.alert('Excluir compra?', 'A compra sai do histórico e das estatísticas.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await excluirCompra(banco, compra.id);
          router.back();
        },
      },
    ]);

  return (
    <>
      <Cartao destaque>
        <Titulo>{compra.mercado}</Titulo>
        <TextoSuave>{formatarDataBR(compra.data)}</TextoSuave>
        <Titulo>{formatarDinheiro(compra.total)}</Titulo>
      </Cartao>
      <Secao titulo={`${compra.itens.length} itens`}>
        {compra.itens.map((item, indice) => (
          <Linha
            key={`${item.produtoId}-${indice}`}
            titulo={item.produto}
            subtitulo={`${formatarQuantidade(item.quantidade, item.unidade)} × ${formatarDinheiro(item.precoUnitario)}`}
            valor={formatarDinheiro(item.total)}
            onPress={() =>
              router.push({ pathname: '/produto/[id]', params: { id: item.produtoId } })
            }
          />
        ))}
      </Secao>
      <Botao titulo="Excluir compra" variante="perigo" onPress={confirmarExclusao} />
    </>
  );
}

export default function TelaDaCompra() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const consulta = useCallback((banco: Banco) => buscarCompra(banco, id), [id]);
  const carga = useConsulta(consulta);
  return (
    <Tela>
      <Carregavel carga={carga}>
        {(compra) =>
          compra ? <DetalheDaCompra compra={compra} /> : <Vazio>Compra não encontrada.</Vazio>
        }
      </Carregavel>
    </Tela>
  );
}
