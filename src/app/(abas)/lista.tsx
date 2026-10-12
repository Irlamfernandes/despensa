import { router } from 'expo-router';

import { useBanco, useConsultaRecarregavel } from '@/data/hooks';
import { carregarLista, removerDaLista, responderEquivalencia } from '@/data/lista';
import {
  descreverSituacao,
  type Lista,
  type SituacaoDoItem,
  type SugestaoDeEquivalencia,
} from '@/domain/lista';
import { formatarQuantidade } from '@/domain/quantidade';
import { Secao, Tela, Titulo, Vazio } from '@/ui/basicos';
import { Botao } from '@/ui/controles';
import { Carregavel, Linha } from '@/ui/listas';
import { Pergunta } from '@/ui/pergunta';

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

interface PerguntasProps {
  sugestoes: readonly SugestaoDeEquivalencia[];
  recarregar: () => void;
}

/** "SUCO PO TANG 25G é o Suco em pó da lista?" — o sim vale para as próximas compras. */
function Perguntas({ sugestoes, recarregar }: PerguntasProps) {
  const banco = useBanco();
  const responder = async ({ item, compra }: SugestaoDeEquivalencia, equivale: boolean) => {
    await responderEquivalencia(banco, {
      produtoId: item.produtoId,
      equivalenteId: compra.produtoId,
      equivale,
    });
    recarregar();
  };
  if (sugestoes.length === 0) return null;
  return (
    <Secao titulo="É o mesmo produto?">
      {sugestoes.map((s) => (
        <Pergunta
          key={`${s.item.id}-${s.compra.produtoId}-${s.compra.unidade}`}
          pergunta={`"${s.compra.nome}" é "${s.item.produto}"?`}
          detalhe={`Você comprou ${formatarQuantidade(s.compra.quantidade, s.compra.unidade)}. Se for, sai da lista agora e nas próximas compras.`}
          onSim={() => responder(s, true)}
          onNao={() => responder(s, false)}
        />
      ))}
    </Secao>
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
      <Perguntas sugestoes={lista.sugestoes} recarregar={recarregar} />
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
