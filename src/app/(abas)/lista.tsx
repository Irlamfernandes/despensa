import { router } from 'expo-router';

import { useBanco, useConsultaRecarregavel } from '@/data/hooks';
import { carregarLista, removerDaLista } from '@/data/lista';
import { descreverSituacao, type Lista, type SituacaoDoItem } from '@/domain/lista';
import { formatarQuantidade } from '@/domain/quantidade';
import { Secao, Tela, Titulo, Vazio } from '@/ui/basicos';
import { Botao } from '@/ui/controles';
import { Carregavel, Linha } from '@/ui/listas';

function LinhaDoItem({ item, valor }: { item: SituacaoDoItem; valor?: string }) {
  return (
    <Linha
      titulo={item.produto}
      subtitulo={descreverSituacao(item)}
      valor={valor}
      onPress={() => router.push({ pathname: '/lista/[id]', params: { id: item.id } })}
    />
  );
}

function ConteudoDaLista({ lista, recarregar }: { lista: Lista; recarregar: () => void }) {
  const banco = useBanco();
  const limparComprados = async () => {
    await removerDaLista(
      banco,
      lista.comprados.map((item) => item.id),
    );
    recarregar();
  };

  if (lista.pendentes.length === 0 && lista.comprados.length === 0) {
    return (
      <Vazio>
        Lista vazia. O que você comprar sai daqui sozinho quando a compra for registrada.
      </Vazio>
    );
  }
  return (
    <>
      <Secao titulo={`Falta comprar · ${lista.pendentes.length}`}>
        {lista.pendentes.map((item) => (
          <LinhaDoItem
            key={item.id}
            item={item}
            valor={formatarQuantidade(item.falta, item.unidade)}
          />
        ))}
      </Secao>
      {lista.comprados.length > 0 ? (
        <Secao titulo="Já comprados">
          {lista.comprados.map((item) => (
            <LinhaDoItem key={item.id} item={item} />
          ))}
          <Botao titulo="Limpar comprados" variante="secundario" onPress={limparComprados} />
        </Secao>
      ) : null}
    </>
  );
}

export default function TelaDaLista() {
  const [carga, recarregar] = useConsultaRecarregavel(carregarLista);
  return (
    <Tela semCabecalho>
      <Titulo>Lista de compras</Titulo>
      <Botao titulo="Adicionar item" onPress={() => router.push('/lista/novo')} />
      <Carregavel carga={carga}>
        {(lista) => <ConteudoDaLista lista={lista} recarregar={recarregar} />}
      </Carregavel>
    </Tela>
  );
}
