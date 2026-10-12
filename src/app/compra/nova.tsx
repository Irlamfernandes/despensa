import { router } from 'expo-router';
import { useState } from 'react';

import type { Banco } from '@/data/banco';
import { listarMercados, listarProdutosDoCatalogo } from '@/data/catalogo';
import { salvarCompra } from '@/data/compras';
import { useBanco, useConsulta } from '@/data/hooks';
import { validarCompra, type ItemValido } from '@/domain/compra';
import { formatarDataBR, hojeISO } from '@/domain/datas';
import { formatarDinheiro } from '@/domain/dinheiro';
import { Erros, Secao, Tela, TextoSuave } from '@/ui/basicos';
import { Botao, Campo } from '@/ui/controles';
import {
  CampoComSugestoes,
  FormularioDeItem,
  ListaDeItens,
  type ProdutoConhecido,
} from '@/ui/formulario-de-compra';
import { Carregavel } from '@/ui/listas';

interface Catalogo {
  mercados: string[];
  produtos: ProdutoConhecido[];
}

async function carregarCatalogo(banco: Banco): Promise<Catalogo> {
  const [mercados, produtos] = await Promise.all([
    listarMercados(banco),
    listarProdutosDoCatalogo(banco),
  ]);
  return { mercados: mercados.map((m) => m.nome), produtos };
}

function FormularioDeCompra({ catalogo }: { catalogo: Catalogo }) {
  const banco = useBanco();
  const [mercado, setMercado] = useState('');
  const [data, setData] = useState(() => formatarDataBR(hojeISO()));
  const [itens, setItens] = useState<ItemValido[]>([]);
  const [erros, setErros] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);

  const total = itens.reduce((soma, item) => soma + item.total, 0);

  const salvar = async () => {
    const resultado = validarCompra({ mercado, data, itens });
    setErros(resultado.ok ? [] : resultado.erros);
    if (!resultado.ok) return;
    setSalvando(true);
    try {
      await salvarCompra(banco, resultado.valor);
      router.back();
    } catch {
      setErros(['Não foi possível salvar a compra. Tente de novo.']);
      setSalvando(false);
    }
  };

  return (
    <>
      <CampoComSugestoes
        rotulo="Mercado"
        valor={mercado}
        opcoes={catalogo.mercados}
        onChange={setMercado}
        placeholder="Onde foi a compra?"
      />
      <Campo rotulo="Data" value={data} onChangeText={setData} placeholder="DD/MM/AAAA" />
      <Secao titulo={`Itens · ${formatarDinheiro(total)}`}>
        <ListaDeItens itens={itens} onRemover={(i) => setItens(itens.filter((_, j) => j !== i))} />
        <FormularioDeItem
          produtos={catalogo.produtos}
          onAdicionar={(item) => setItens((atuais) => [...atuais, item])}
        />
      </Secao>
      <Erros erros={erros} />
      <Botao titulo="Salvar compra" onPress={salvar} desabilitado={salvando} />
      <TextoSuave>Mercados e produtos novos são cadastrados automaticamente.</TextoSuave>
    </>
  );
}

export default function TelaDeNovaCompra() {
  const carga = useConsulta(carregarCatalogo);
  return (
    <Tela>
      <Carregavel carga={carga}>
        {(catalogo) => <FormularioDeCompra catalogo={catalogo} />}
      </Carregavel>
    </Tela>
  );
}
