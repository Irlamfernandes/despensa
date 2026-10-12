import { router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';

import type { Banco } from '@/data/banco';
import { useConsulta } from '@/data/hooks';
import { buscarProduto, type ProdutoDetalhado } from '@/data/produtos';
import { formatarDataBR, hojeISO } from '@/domain/datas';
import { formatarDinheiro } from '@/domain/dinheiro';
import { descreverPrevisao } from '@/domain/painel';
import { precoAtualPorMercado } from '@/domain/precos';
import { formatarQuantidade } from '@/domain/quantidade';
import { MINIMO_DE_COMPRAS, preverReposicao } from '@/domain/reposicao';
import { Cartao, Secao, Tela, TextoSuave, Titulo, Vazio } from '@/ui/basicos';
import { Botao } from '@/ui/controles';
import { Carregavel, Linha } from '@/ui/listas';

function Reposicao({ produto }: { produto: ProdutoDetalhado }) {
  const previsao = preverReposicao(
    produto.historico.map((r) => r.data),
    hojeISO(),
  );
  if (!previsao) {
    return (
      <TextoSuave>
        A previsão de reposição aparece depois de {MINIMO_DE_COMPRAS} compras em dias diferentes.
      </TextoSuave>
    );
  }
  return (
    <TextoSuave>
      Comprado a cada ~{previsao.intervaloMedio} dias · {descreverPrevisao(previsao)}
    </TextoSuave>
  );
}

function DetalheDoProduto({ produto }: { produto: ProdutoDetalhado }) {
  const porMercado = precoAtualPorMercado(produto.historico);
  return (
    <>
      <Cartao destaque>
        <Titulo>{produto.nome}</Titulo>
        <Reposicao produto={produto} />
      </Cartao>
      <Botao
        titulo="Adicionar à lista"
        variante="secundario"
        onPress={() => router.push({ pathname: '/lista/novo', params: { produto: produto.nome } })}
      />
      <Secao titulo="Preço atual por mercado">
        {porMercado.map((p) => (
          <Linha
            key={p.mercado}
            titulo={p.mercado}
            subtitulo={`em ${formatarDataBR(p.data)}`}
            valor={`${formatarDinheiro(p.precoUnitario)}/${produto.unidade}`}
          />
        ))}
      </Secao>
      <Secao titulo="Histórico">
        {produto.historico.map((r, indice) => (
          <Linha
            key={`${r.data}-${r.mercado}-${indice}`}
            titulo={formatarDataBR(r.data)}
            subtitulo={`${r.mercado} · ${formatarQuantidade(r.quantidade, r.unidade)}`}
            valor={formatarDinheiro(r.precoUnitario)}
          />
        ))}
      </Secao>
    </>
  );
}

export default function TelaDoProduto() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const consulta = useCallback((banco: Banco) => buscarProduto(banco, id), [id]);
  const carga = useConsulta(consulta);
  return (
    <Tela>
      <Carregavel carga={carga}>
        {(produto) =>
          produto ? <DetalheDoProduto produto={produto} /> : <Vazio>Produto não encontrado.</Vazio>
        }
      </Carregavel>
    </Tela>
  );
}
