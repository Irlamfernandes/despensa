import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useReducer, useState, type Dispatch } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import WebView, { type WebViewNavigation } from 'react-native-webview';

import type { Banco } from '@/data/banco';
import { buscarCompraPorChave, salvarCompra } from '@/data/compras';
import { useBanco } from '@/data/hooks';
import { decidirNavegacao, enderecosDeConsulta } from '@/domain/nfce/enderecos';
import {
  ESTADO_INICIAL,
  proximoEstado,
  TEMPO_LIMITE_MS,
  type EstadoDaLeitura,
  type EventoDaLeitura,
} from '@/domain/nfce/leitura';
import { notaParaCompra, type NotaFiscal } from '@/domain/nfce/nota';
import { lerQrDaNota } from '@/domain/nfce/qr';
import { SCRIPT_DE_EXTRACAO } from '@/domain/nfce/script-de-extracao';
import { criarLog, mascarar, mascararUrl } from '@/log';
import { Cartao, Erros, Tela, TelaFixa, TextoSuave, Titulo, Vazio } from '@/ui/basicos';
import { Botao } from '@/ui/controles';
import { PreviaDaCompra } from '@/ui/previa-da-compra';
import { cores, raio } from '@/ui/tema';

type Despachar = Dispatch<EventoDaLeitura>;

const log = criarLog('nfce');

/** Resumo do evento para o log, sem o conteúdo da página. */
function resumirEvento(evento: EventoDaLeitura): Record<string, unknown> {
  if (evento.tipo === 'mensagem') return { tipo: evento.tipo, tamanho: evento.texto.length };
  if (evento.tipo === 'navegar') return { tipo: evento.tipo, url: mascararUrl(evento.url) };
  return { tipo: evento.tipo };
}

function reduzirComLog(
  atual: EstadoDaLeitura,
  evento: EventoDaLeitura,
  urls: readonly string[],
): EstadoDaLeitura {
  const proximo = proximoEstado(atual, evento, urls);
  log.info('evento', { ...resumirEvento(evento), de: atual.etapa, para: proximo.etapa });
  if (proximo.etapa === 'falhou') log.info('motivo da falha', { motivo: proximo.motivo });
  return proximo;
}

/** Antes de abrir a SEFAZ, confere se essa nota já foi importada. */
function useVerificarDuplicada(banco: Banco, chave: string, despachar: Despachar) {
  useEffect(() => {
    log.info('verificando se a nota já foi importada', { chave: mascarar(chave) });
    buscarCompraPorChave(banco, chave).then(
      (compraId) =>
        despachar(compraId ? { tipo: 'ja-importada', compraId } : { tipo: 'nao-importada' }),
      (erro: unknown) => {
        log.erro('falha ao verificar duplicada', erro);
        despachar({ tipo: 'nao-importada' });
      },
    );
  }, [banco, chave, despachar]);
}

/** Desiste se a página atual não mostrar a nota a tempo. */
function useTempoLimite(estado: EstadoDaLeitura, despachar: Despachar) {
  const url = estado.etapa === 'abrindo' ? estado.url : null;
  useEffect(() => {
    if (!url) return;
    const timer = setTimeout(() => despachar({ tipo: 'tempo-esgotado' }), TEMPO_LIMITE_MS);
    return () => clearTimeout(timer);
  }, [url, despachar]);
}

function PaginaDaSefaz({ url, despachar }: { url: string; despachar: Despachar }) {
  // Aplica a decisão do domínio: segue, bloqueia ou troca http por https.
  const navegar = (destino: string, seNaoTrocar: () => void) => {
    const decisao = decidirNavegacao(destino);
    log.info('navegação', { url: mascararUrl(destino), decisao: decisao.tipo });
    if (decisao.tipo === 'trocar') despachar({ tipo: 'navegar', url: decisao.url });
    else seNaoTrocar();
    return decisao.tipo === 'permitir';
  };

  return (
    <TelaFixa>
      <TextoSuave>Consultando a nota no site da SEFAZ-RJ. Isso leva alguns segundos.</TextoSuave>
      <View style={estilos.pagina}>
        <WebView
          source={{ uri: url }}
          injectedJavaScript={SCRIPT_DE_EXTRACAO}
          onMessage={(e) => despachar({ tipo: 'mensagem', texto: e.nativeEvent.data })}
          onShouldStartLoadWithRequest={(r: WebViewNavigation) => navegar(r.url, () => undefined)}
          onLoadStart={(e) =>
            log.info('carregando página', { url: mascararUrl(e.nativeEvent.url) })
          }
          onLoadEnd={(e) =>
            log.info('página carregada', {
              url: mascararUrl(e.nativeEvent.url),
              titulo: e.nativeEvent.title,
            })
          }
          onHttpError={(e) =>
            log.info('erro HTTP na página', {
              status: e.nativeEvent.statusCode,
              url: mascararUrl(e.nativeEvent.url),
            })
          }
          // No Android, um redirecionamento para http falha aqui (cleartext bloqueado).
          onError={(e) => {
            log.info('falha ao carregar', {
              descricao: e.nativeEvent.description,
              codigo: e.nativeEvent.code,
              url: mascararUrl(e.nativeEvent.url),
            });
            navegar(e.nativeEvent.url, () => despachar({ tipo: 'erro-de-carga' }));
          }}
        />
      </View>
    </TelaFixa>
  );
}

function NotaLida({ nota }: { nota: NotaFiscal }) {
  const banco = useBanco();
  const compra = useMemo(() => notaParaCompra(nota), [nota]);
  const [erros, setErros] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    setSalvando(true);
    try {
      const id = await salvarCompra(banco, compra, { chave: nota.chave, cnpj: nota.cnpj });
      router.replace({ pathname: '/compra/[id]', params: { id } });
    } catch (erro) {
      log.erro('falha ao salvar a compra da nota', erro);
      setErros(['Não foi possível salvar. Talvez essa nota já tenha sido importada.']);
      setSalvando(false);
    }
  };

  return (
    <Tela>
      <PreviaDaCompra compra={compra} />
      <Erros erros={erros} />
      <Botao titulo="Salvar compra" onPress={salvar} desabilitado={salvando} />
    </Tela>
  );
}

function Duplicada({ compraId }: { compraId: string }) {
  return (
    <Tela>
      <Vazio>Essa nota já foi importada.</Vazio>
      <Botao
        titulo="Ver a compra"
        onPress={() => router.replace({ pathname: '/compra/[id]', params: { id: compraId } })}
      />
    </Tela>
  );
}

function Falhou({ motivo, despachar }: { motivo: string; despachar: Despachar }) {
  return (
    <Tela>
      <Cartao>
        <Titulo>Não deu para ler a nota</Titulo>
        <TextoSuave>{motivo}</TextoSuave>
      </Cartao>
      <Botao titulo="Tentar de novo" onPress={() => despachar({ tipo: 'tentar-de-novo' })} />
      <Botao
        titulo="Registrar manualmente"
        variante="secundario"
        onPress={() => router.replace('/compra/nova')}
      />
    </Tela>
  );
}

function EtapaDaLeitura({ estado, despachar }: { estado: EstadoDaLeitura; despachar: Despachar }) {
  switch (estado.etapa) {
    case 'verificando':
      return <ActivityIndicator style={estilos.carregando} color={cores.primaria} />;
    case 'abrindo':
      return <PaginaDaSefaz url={estado.url} despachar={despachar} />;
    case 'lida':
      return <NotaLida nota={estado.nota} />;
    case 'duplicada':
      return <Duplicada compraId={estado.compraId} />;
    case 'falhou':
      return <Falhou motivo={estado.motivo} despachar={despachar} />;
  }
}

function LeitorDaNota({ qr, chave }: { qr: string; chave: string }) {
  const banco = useBanco();
  const urls = useMemo(() => enderecosDeConsulta(qr, chave), [qr, chave]);
  const [estado, despachar] = useReducer(
    (atual: EstadoDaLeitura, evento: EventoDaLeitura) => reduzirComLog(atual, evento, urls),
    ESTADO_INICIAL,
  );
  useVerificarDuplicada(banco, chave, despachar);
  useTempoLimite(estado, despachar);
  return <EtapaDaLeitura estado={estado} despachar={despachar} />;
}

export default function TelaDaNota() {
  const { qr = '' } = useLocalSearchParams<{ qr: string }>();
  const resultado = lerQrDaNota(qr);
  log.info('tela da nota', { valida: resultado.ok, qr: mascararUrl(qr) });
  if (!resultado.ok) {
    return (
      <Tela>
        <Vazio>{resultado.erros.join('\n')}</Vazio>
      </Tela>
    );
  }
  return <LeitorDaNota qr={qr} chave={resultado.valor} />;
}

const estilos = StyleSheet.create({
  pagina: { flex: 1, borderRadius: raio.md, overflow: 'hidden' },
  carregando: { flex: 1 },
});
