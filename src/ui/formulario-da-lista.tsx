import { useState } from 'react';

import {
  validarItemDaLista,
  type ItemDaListaRascunho,
  type ItemDaListaValido,
} from '@/domain/lista';
import { lerQuantidade, UNIDADES, type Unidade } from '@/domain/quantidade';

import { Cartao, Erros } from './basicos';
import { Botao, Campo, Chips } from './controles';
import { CampoComSugestoes, type ProdutoConhecido } from './formulario-de-compra';

interface FormularioDaListaProps {
  inicial: ItemDaListaRascunho;
  rotuloDoBotao: string;
  onSalvar: (item: ItemDaListaValido) => Promise<void>;
  /** Catálogo para sugerir o produto. Sem ele, o produto não pode ser trocado. */
  produtos?: readonly ProdutoConhecido[];
}

/** Produto, quantidade e unidade de um item da lista de compras. */
export function FormularioDaLista({
  inicial,
  rotuloDoBotao,
  onSalvar,
  produtos,
}: FormularioDaListaProps) {
  const [item, setItem] = useState(inicial);
  const [erros, setErros] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);
  const alterar = (parcial: Partial<ItemDaListaRascunho>) =>
    setItem((atual) => ({ ...atual, ...parcial }));

  const escolherProduto = (nome: string) => {
    const conhecido = produtos?.find((p) => p.nome === nome);
    alterar(conhecido ? { produto: nome, unidade: conhecido.unidade } : { produto: nome });
  };

  const salvar = async () => {
    const resultado = validarItemDaLista(item);
    setErros(resultado.ok ? [] : resultado.erros);
    if (!resultado.ok) return;
    setSalvando(true);
    await onSalvar(resultado.valor).catch(() => {
      setErros(['Não foi possível salvar. Tente de novo.']);
      setSalvando(false);
    });
  };

  return (
    <Cartao>
      {produtos ? (
        <CampoComSugestoes
          rotulo="Produto"
          valor={item.produto}
          opcoes={produtos.map((p) => p.nome)}
          onChange={escolherProduto}
          placeholder="Ex.: Suco em pó"
        />
      ) : null}
      <Campo
        rotulo="Quantidade"
        value={item.quantidade}
        onChangeText={(quantidade) => alterar({ quantidade })}
        keyboardType="decimal-pad"
      />
      <Chips
        opcoes={UNIDADES}
        selecionada={item.unidade}
        onEscolher={(unidade) => alterar({ unidade })}
      />
      <Erros erros={erros} />
      <Botao titulo={rotuloDoBotao} onPress={salvar} desabilitado={salvando} />
    </Cartao>
  );
}

interface FormularioDeDiminuirProps {
  unidade: Unidade;
  onDiminuir: (quantidade: number) => Promise<void>;
}

/** "Comprei 3": desconta da lista uma compra que não foi registrada no app. */
export function FormularioDeDiminuir({ unidade, onDiminuir }: FormularioDeDiminuirProps) {
  const [texto, setTexto] = useState('1');
  const [erros, setErros] = useState<string[]>([]);

  const diminuir = async () => {
    const quantidade = lerQuantidade(texto);
    setErros(quantidade === null ? ['Quantidade inválida.'] : []);
    if (quantidade === null) return;
    await onDiminuir(quantidade).catch(() => setErros(['Não foi possível salvar. Tente de novo.']));
  };

  return (
    <Cartao>
      <Campo
        rotulo={`Quanto você comprou (${unidade})`}
        value={texto}
        onChangeText={setTexto}
        keyboardType="decimal-pad"
      />
      <Erros erros={erros} />
      <Botao titulo="Diminuir da lista" variante="secundario" onPress={diminuir} />
    </Cartao>
  );
}
