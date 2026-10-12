import { router, useLocalSearchParams } from 'expo-router';

import { listarProdutosDoCatalogo, type Produto } from '@/data/catalogo';
import { useBanco, useConsulta } from '@/data/hooks';
import { adicionarNaLista } from '@/data/lista';
import type { ItemDaListaValido } from '@/domain/lista';
import { Tela, TextoSuave } from '@/ui/basicos';
import { FormularioDaLista } from '@/ui/formulario-da-lista';
import { Carregavel } from '@/ui/listas';

function NovoItem({ produtos, produto }: { produtos: Produto[]; produto: string }) {
  const banco = useBanco();
  const unidade = produtos.find((p) => p.nome === produto)?.unidade ?? 'un';
  const salvar = async (item: ItemDaListaValido) => {
    await adicionarNaLista(banco, item);
    router.back();
  };
  return (
    <FormularioDaLista
      produtos={produtos}
      inicial={{ produto, quantidade: '1', unidade }}
      rotuloDoBotao="Adicionar à lista"
      onSalvar={salvar}
    />
  );
}

export default function TelaDeNovoItemDaLista() {
  const { produto = '' } = useLocalSearchParams<{ produto?: string }>();
  const carga = useConsulta(listarProdutosDoCatalogo);
  return (
    <Tela>
      <Carregavel carga={carga}>
        {(produtos) => <NovoItem produtos={produtos} produto={produto} />}
      </Carregavel>
      <TextoSuave>
        Escolha o produto com o mesmo nome que aparece nas compras: é por ele que a quantidade
        comprada sai da lista.
      </TextoSuave>
    </Tela>
  );
}
