import { router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';

import type { Banco } from '@/data/banco';
import { useBanco, useConsulta } from '@/data/hooks';
import { alterarItemDaLista, carregarLista, diminuirNaLista, removerDaLista } from '@/data/lista';
import { descreverSituacao, type ItemDaListaValido, type SituacaoDoItem } from '@/domain/lista';
import { formatarNumero } from '@/domain/quantidade';
import { Cartao, Secao, Tela, TextoSuave, Titulo, Vazio } from '@/ui/basicos';
import { Botao } from '@/ui/controles';
import { FormularioDaLista, FormularioDeDiminuir } from '@/ui/formulario-da-lista';
import { Carregavel } from '@/ui/listas';

async function buscarItem(banco: Banco, id: string): Promise<SituacaoDoItem | null> {
  const { pendentes, comprados } = await carregarLista(banco);
  return [...pendentes, ...comprados].find((item) => item.id === id) ?? null;
}

function EdicaoDoItem({ item }: { item: SituacaoDoItem }) {
  const banco = useBanco();
  const salvar = async (valor: ItemDaListaValido) => {
    await alterarItemDaLista(banco, item.id, valor);
    router.back();
  };
  const diminuir = async (comprado: number) => {
    await diminuirNaLista(banco, item, comprado);
    router.back();
  };
  const remover = async () => {
    await removerDaLista(banco, [item.id]);
    router.back();
  };
  const quantidade = formatarNumero(item.falta > 0 ? item.falta : item.quantidade);

  return (
    <>
      <Cartao destaque>
        <Titulo>{item.produto}</Titulo>
        <TextoSuave>{descreverSituacao(item) ?? 'Ainda não comprado'}</TextoSuave>
      </Cartao>
      {item.falta > 0 ? (
        <Secao titulo="Comprei sem registrar no app">
          <FormularioDeDiminuir unidade={item.unidade} onDiminuir={diminuir} />
        </Secao>
      ) : null}
      <Secao titulo="Quanto falta comprar">
        <FormularioDaLista
          inicial={{ produto: item.produto, quantidade, unidade: item.unidade }}
          rotuloDoBotao="Salvar quantidade"
          onSalvar={salvar}
        />
      </Secao>
      <Botao
        titulo="Ver produto"
        variante="secundario"
        onPress={() => router.push({ pathname: '/produto/[id]', params: { id: item.produtoId } })}
      />
      <Botao titulo="Remover da lista" variante="perigo" onPress={remover} />
    </>
  );
}

export default function TelaDoItemDaLista() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const consulta = useCallback((banco: Banco) => buscarItem(banco, id), [id]);
  const carga = useConsulta(consulta);
  return (
    <Tela>
      <Carregavel carga={carga}>
        {(item) => (item ? <EdicaoDoItem item={item} /> : <Vazio>Item não está na lista.</Vazio>)}
      </Carregavel>
    </Tela>
  );
}
