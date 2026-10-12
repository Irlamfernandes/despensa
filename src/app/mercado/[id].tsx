import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import type { Banco } from '@/data/banco';
import {
  buscarMercado,
  juntarMercados,
  renomearMercado,
  type Mercado,
  type MercadoDetalhado,
} from '@/data/catalogo';
import { useBanco, useConsulta } from '@/data/hooks';
import { validarNomeDoMercado } from '@/domain/compra';
import { Erros, Tela, TextoSuave, Vazio } from '@/ui/basicos';
import { Botao, Campo } from '@/ui/controles';
import { Carregavel } from '@/ui/listas';

function EdicaoDoMercado({ mercado }: { mercado: MercadoDetalhado }) {
  const banco = useBanco();
  const [nome, setNome] = useState(mercado.nome);
  const [erros, setErros] = useState<string[]>([]);

  const oferecerJuntar = (outro: Mercado) =>
    Alert.alert(
      'Esse mercado já existe',
      `Juntar as compras de "${mercado.nome}" com "${outro.nome}"? Fica um mercado só.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Juntar',
          onPress: async () => {
            await juntarMercados(banco, mercado.id, outro.id);
            router.back();
          },
        },
      ],
    );

  const salvar = async () => {
    const resultado = validarNomeDoMercado(nome);
    setErros(resultado.ok ? [] : resultado.erros);
    if (!resultado.ok) return;
    const renomeacao = await renomearMercado(banco, mercado.id, resultado.valor);
    if (renomeacao.tipo === 'nome-em-uso') return oferecerJuntar(renomeacao.outro);
    router.back();
  };

  return (
    <>
      <Campo rotulo="Nome do mercado" value={nome} onChangeText={setNome} autoCapitalize="words" />
      <Erros erros={erros} />
      <Botao titulo="Salvar" onPress={salvar} />
      <TextoSuave>
        O nome muda em todas as compras deste mercado.
        {mercado.cnpj ? ' As próximas notas dele continuam vindo para cá (pelo CNPJ).' : ''}
      </TextoSuave>
    </>
  );
}

export default function TelaDoMercado() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const consulta = useCallback((banco: Banco) => buscarMercado(banco, id), [id]);
  const carga = useConsulta(consulta);
  return (
    <Tela>
      <Carregavel carga={carga}>
        {(mercado) =>
          mercado ? <EdicaoDoMercado mercado={mercado} /> : <Vazio>Mercado não encontrado.</Vazio>
        }
      </Carregavel>
    </Tela>
  );
}
