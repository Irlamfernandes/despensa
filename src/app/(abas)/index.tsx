import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { useConsulta } from '@/data/hooks';
import { listarComprasResumidas, listarDatasDeCompraPorProduto } from '@/data/resumo';
import type { Banco } from '@/data/banco';
import { hojeISO, nomeDoMes } from '@/domain/datas';
import { formatarDinheiro } from '@/domain/dinheiro';
import { descreverPrevisao, descreverVariacao, montarPainel, type Painel } from '@/domain/painel';
import { Cartao, Secao, Tela, TextoSuave, Titulo, Vazio } from '@/ui/basicos';
import { Botao } from '@/ui/controles';
import { Carregavel, Linha } from '@/ui/listas';
import { cores, fonte } from '@/ui/tema';

async function carregarPainel(banco: Banco): Promise<Painel> {
  const [compras, datasPorProduto] = await Promise.all([
    listarComprasResumidas(banco),
    listarDatasDeCompraPorProduto(banco),
  ]);
  return montarPainel({ compras, datasPorProduto, hoje: hojeISO() });
}

function GastoDoMes({ comparacao }: Pick<Painel, 'comparacao'>) {
  return (
    <Cartao destaque>
      <TextoSuave>Gasto em {nomeDoMes(comparacao.mes)}</TextoSuave>
      <Text style={estilos.destaque}>{formatarDinheiro(comparacao.total)}</Text>
      {comparacao.media === null || comparacao.variacao === null ? (
        <TextoSuave>A comparação aparece depois do primeiro mês de uso.</TextoSuave>
      ) : (
        <TextoSuave>
          {descreverVariacao(comparacao.variacao)} ({formatarDinheiro(comparacao.media)} nos últimos{' '}
          {comparacao.mesesConsiderados} meses)
        </TextoSuave>
      )}
    </Cartao>
  );
}

function ConteudoDoPainel({ painel }: { painel: Painel }) {
  return (
    <>
      <GastoDoMes comparacao={painel.comparacao} />
      <Secao titulo="Pode estar acabando">
        {painel.acabando.length === 0 ? (
          <Vazio>Nada por enquanto. A previsão usa produtos comprados 3 vezes ou mais.</Vazio>
        ) : (
          painel.acabando.map((p) => (
            <Linha
              key={p.produtoId}
              titulo={p.nome}
              subtitulo={descreverPrevisao(p.previsao)}
              onPress={() =>
                router.push({ pathname: '/produto/[id]', params: { id: p.produtoId } })
              }
            />
          ))
        )}
      </Secao>
      <Secao titulo="Gasto por mercado neste mês">
        {painel.porMercado.length === 0 ? (
          <Vazio>Nenhuma compra neste mês.</Vazio>
        ) : (
          painel.porMercado.map((m) => (
            <Linha key={m.mercado} titulo={m.mercado} valor={formatarDinheiro(m.total)} />
          ))
        )}
      </Secao>
    </>
  );
}

export default function TelaDeResumo() {
  const carga = useConsulta(carregarPainel);
  return (
    <Tela>
      <Titulo>Despensa</Titulo>
      <Botao titulo="Registrar compra" onPress={() => router.push('/compra/nova')} />
      <Carregavel carga={carga}>{(painel) => <ConteudoDoPainel painel={painel} />}</Carregavel>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  destaque: { fontSize: fonte.destaque, fontWeight: '700', color: cores.texto },
});
