import { router } from 'expo-router';

import { useConsulta } from '@/data/hooks';
import { listarProdutos } from '@/data/produtos';
import { formatarDataBR } from '@/domain/datas';
import { formatarDinheiro } from '@/domain/dinheiro';
import { Tela, Titulo, Vazio } from '@/ui/basicos';
import { Carregavel, Linha } from '@/ui/listas';

export default function TelaDeProdutos() {
  const carga = useConsulta(listarProdutos);
  return (
    <Tela semCabecalho>
      <Titulo>Produtos</Titulo>
      <Carregavel carga={carga}>
        {(produtos) =>
          produtos.length === 0 ? (
            <Vazio>Os produtos aparecem aqui depois da primeira compra.</Vazio>
          ) : (
            produtos.map((p) => (
              <Linha
                key={p.id}
                titulo={p.nome}
                subtitulo={`Última compra em ${formatarDataBR(p.ultimaCompra)} · ${p.vezesComprado}×`}
                valor={`${formatarDinheiro(p.ultimoPreco)}/${p.unidade}`}
                onPress={() => router.push({ pathname: '/produto/[id]', params: { id: p.id } })}
              />
            ))
          )
        }
      </Carregavel>
    </Tela>
  );
}
