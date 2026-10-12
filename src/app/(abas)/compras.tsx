import { router } from 'expo-router';

import { listarCompras } from '@/data/compras';
import { useConsulta } from '@/data/hooks';
import { formatarDataBR } from '@/domain/datas';
import { formatarDinheiro } from '@/domain/dinheiro';
import { Tela, Titulo, Vazio } from '@/ui/basicos';
import { Botao } from '@/ui/controles';
import { Carregavel, Linha } from '@/ui/listas';

function rotuloDeItens(quantidade: number): string {
  return quantidade === 1 ? '1 item' : `${quantidade} itens`;
}

export default function TelaDeCompras() {
  const carga = useConsulta(listarCompras);
  return (
    <Tela>
      <Titulo>Compras</Titulo>
      <Botao titulo="Escanear nota fiscal" onPress={() => router.push('/compra/escanear')} />
      <Botao
        titulo="Registrar manualmente"
        variante="secundario"
        onPress={() => router.push('/compra/nova')}
      />
      <Carregavel carga={carga}>
        {(compras) =>
          compras.length === 0 ? (
            <Vazio>Nenhuma compra registrada ainda.</Vazio>
          ) : (
            compras.map((c) => (
              <Linha
                key={c.id}
                titulo={c.mercado}
                subtitulo={`${formatarDataBR(c.data)} · ${rotuloDeItens(c.quantidadeDeItens)}`}
                valor={formatarDinheiro(c.total)}
                onPress={() => router.push({ pathname: '/compra/[id]', params: { id: c.id } })}
              />
            ))
          )
        }
      </Carregavel>
    </Tela>
  );
}
