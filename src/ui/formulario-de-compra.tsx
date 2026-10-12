import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { validarItem, type ItemRascunho, type ItemValido } from '@/domain/compra';
import { formatarDinheiro } from '@/domain/dinheiro';
import { formatarQuantidade, UNIDADES, type Unidade } from '@/domain/quantidade';
import { filtrarSugestoes } from '@/domain/sugestoes';

import { Cartao } from './basicos';
import { Botao, Campo, Chips } from './controles';
import { Linha } from './listas';
import { cores, espaco, fonte } from './tema';

interface CampoComSugestoesProps {
  rotulo: string;
  valor: string;
  opcoes: readonly string[];
  onChange: (valor: string) => void;
  placeholder?: string;
}

/** Campo de texto que sugere nomes já cadastrados enquanto o usuário digita. */
export function CampoComSugestoes({ opcoes, valor, onChange, ...props }: CampoComSugestoesProps) {
  const sugestoes = filtrarSugestoes(opcoes, valor);
  return (
    <View style={estilos.grupo}>
      <Campo value={valor} onChangeText={onChange} autoCapitalize="sentences" {...props} />
      {sugestoes.length > 0 ? <Chips opcoes={sugestoes} onEscolher={onChange} /> : null}
    </View>
  );
}

export interface ProdutoConhecido {
  nome: string;
  unidade: Unidade;
}

const ITEM_VAZIO: ItemRascunho = { produto: '', quantidade: '1', unidade: 'un', precoUnitario: '' };

interface FormularioDeItemProps {
  produtos: readonly ProdutoConhecido[];
  onAdicionar: (item: ItemValido) => void;
}

/** Formulário de um item da compra. Ao escolher um produto conhecido, usa a unidade dele. */
export function FormularioDeItem({ produtos, onAdicionar }: FormularioDeItemProps) {
  const [item, setItem] = useState<ItemRascunho>(ITEM_VAZIO);
  const [erros, setErros] = useState<string[]>([]);
  const alterar = (parcial: Partial<ItemRascunho>) =>
    setItem((atual) => ({ ...atual, ...parcial }));

  const escolherProduto = (nome: string) => {
    const conhecido = produtos.find((p) => p.nome === nome);
    alterar(conhecido ? { produto: nome, unidade: conhecido.unidade } : { produto: nome });
  };

  const adicionar = () => {
    const resultado = validarItem(item);
    setErros(resultado.ok ? [] : resultado.erros);
    if (!resultado.ok) return;
    onAdicionar(resultado.valor);
    setItem(ITEM_VAZIO);
  };

  return (
    <Cartao>
      <CampoComSugestoes
        rotulo="Produto"
        valor={item.produto}
        opcoes={produtos.map((p) => p.nome)}
        onChange={escolherProduto}
        placeholder="Ex.: Arroz 5 kg"
      />
      <View style={estilos.linha}>
        <View style={estilos.metade}>
          <Campo
            rotulo="Quantidade"
            value={item.quantidade}
            onChangeText={(quantidade) => alterar({ quantidade })}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={estilos.metade}>
          <Campo
            rotulo="Preço unitário (R$)"
            value={item.precoUnitario}
            onChangeText={(precoUnitario) => alterar({ precoUnitario })}
            keyboardType="decimal-pad"
            placeholder="0,00"
          />
        </View>
      </View>
      <Chips
        opcoes={UNIDADES}
        selecionada={item.unidade}
        onEscolher={(unidade) => alterar({ unidade })}
      />
      <Erros erros={erros} />
      <Botao titulo="Adicionar item" variante="secundario" onPress={adicionar} />
    </Cartao>
  );
}

interface ListaDeItensProps {
  itens: readonly ItemValido[];
  onRemover: (indice: number) => void;
}

export function ListaDeItens({ itens, onRemover }: ListaDeItensProps) {
  return (
    <View style={estilos.grupo}>
      {itens.map((item, indice) => (
        <Linha
          key={`${item.produto}-${indice}`}
          titulo={item.produto}
          subtitulo={`${formatarQuantidade(item.quantidade, item.unidade)} × ${formatarDinheiro(item.precoUnitario)} · toque para remover`}
          valor={formatarDinheiro(item.total)}
          onPress={() => onRemover(indice)}
        />
      ))}
    </View>
  );
}

export function Erros({ erros }: { erros: readonly string[] }) {
  if (erros.length === 0) return null;
  return <Text style={estilos.erro}>{erros.join('\n')}</Text>;
}

const estilos = StyleSheet.create({
  grupo: { gap: espaco.sm },
  linha: { flexDirection: 'row', gap: espaco.md },
  metade: { flex: 1 },
  erro: { color: cores.perigo, fontSize: fonte.normal },
});
