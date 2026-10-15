import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import WebView, { type WebViewNavigation } from 'react-native-webview';

import { buscarCompraPorChave, salvarCompra } from '@/data/compras';
import { useBanco } from '@/data/hooks';
import { corrigirParaHttps, URL_CONSULTA_POR_CHAVE } from '@/domain/nfce/enderecos';
import { lerMensagem } from '@/domain/nfce/leitura';
import { converterNota, notaParaCompra, type NotaFiscal } from '@/domain/nfce/nota';
import { lerQrDaNota } from '@/domain/nfce/qr';
import { SCRIPT_DE_EXTRACAO } from '@/domain/nfce/script-de-extracao';
import { Cartao, Erros, Tela, TelaFixa, TextoSuave, Titulo } from '@/ui/basicos';
import { Botao, Campo } from '@/ui/controles';
import { PreviaDaCompra } from '@/ui/previa-da-compra';
import { raio } from '@/ui/tema';

type Estado =
  | { fase: 'digitar' }
  | { fase: 'navegar'; chave: string }
  | { fase: 'lida'; nota: NotaFiscal }
  | { fase: 'duplicada'; id: string };

// Preenche, na página da SEFAZ, o campo cujo id/name tem "chave" — deixando só o
// captcha para a pessoa. Best-effort: se não encontrar, ela digita manualmente.
function scriptPreencher(chave: string): string {
  return `(function(){try{
    var cs=document.querySelectorAll('input,textarea');
    for(var i=0;i<cs.length;i++){var c=cs[i];var k=((c.id||'')+(c.name||'')).toLowerCase();
      if(k.indexOf('chave')>=0){c.value=${JSON.stringify(chave)};
        c.dispatchEvent(new Event('input',{bubbles:true}));
        c.dispatchEvent(new Event('change',{bubbles:true}));break;}}
  }catch(e){}})();`;
}

function CampoDaChave({ aoConfirmar }: { aoConfirmar: (chave: string) => void }) {
  const [texto, setTexto] = useState('');
  const [erros, setErros] = useState<string[]>([]);

  const confirmar = () => {
    const resultado = lerQrDaNota(texto.trim());
    setErros(resultado.ok ? [] : resultado.erros);
    if (resultado.ok) aoConfirmar(resultado.valor);
  };

  return (
    <Tela>
      <Titulo>Consultar pela chave</Titulo>
      <TextoSuave>
        Digite os 44 números da chave de acesso impressos no cupom (ou cole o link do QR Code).
      </TextoSuave>
      <Campo
        rotulo="Chave de acesso"
        value={texto}
        onChangeText={setTexto}
        placeholder="0000 0000 0000 ..."
        autoCapitalize="none"
        multiline
      />
      <Erros erros={erros} />
      <Botao titulo="Abrir consulta da SEFAZ" onPress={confirmar} />
    </Tela>
  );
}

function Navegador({ chave, aoLerNota }: { chave: string; aoLerNota: (nota: NotaFiscal) => void }) {
  const capturado = useRef(false);
  const [uri, setUri] = useState(URL_CONSULTA_POR_CHAVE);

  // A pessoa navega; o app só força https nos links http da SEFAZ-RJ (que o
  // Android bloqueia) e deixa o resto passar (inclusive o captcha).
  const aoNavegar = (requisicao: WebViewNavigation): boolean => {
    const https = corrigirParaHttps(requisicao.url);
    if (https && https !== uri) {
      setUri(https);
      return false;
    }
    return true;
  };

  const aoReceber = (texto: string) => {
    if (capturado.current) return;
    const bruta = lerMensagem(texto);
    if (bruta === null || bruta === 'sem-nota') return;
    const resultado = converterNota(bruta);
    if (!resultado.ok) return;
    capturado.current = true;
    aoLerNota(resultado.valor);
  };

  return (
    <TelaFixa>
      <TextoSuave>
        A chave é preenchida automaticamente; se não aparecer, digite-a. Resolva o captcha e toque
        em consultar. Quando a nota abrir, o app lê sozinho. Se bloquear, use os dados móveis (4G).
      </TextoSuave>
      <View style={estilos.pagina}>
        <WebView
          source={{ uri }}
          injectedJavaScript={`${scriptPreencher(chave)}\n${SCRIPT_DE_EXTRACAO}`}
          onMessage={(e) => aoReceber(e.nativeEvent.data)}
          onShouldStartLoadWithRequest={aoNavegar}
        />
      </View>
    </TelaFixa>
  );
}

function NotaLida({ nota }: { nota: NotaFiscal }) {
  const banco = useBanco();
  const compra = notaParaCompra(nota);
  const [erros, setErros] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    setSalvando(true);
    try {
      const id = await salvarCompra(banco, compra, { chave: nota.chave, cnpj: nota.cnpj });
      router.replace({ pathname: '/compra/[id]', params: { id } });
    } catch {
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

function Duplicada({ id }: { id: string }) {
  return (
    <Tela>
      <Cartao>
        <Titulo>Essa nota já foi importada</Titulo>
        <TextoSuave>Ela já está no seu histórico de compras.</TextoSuave>
      </Cartao>
      <Botao
        titulo="Ver a compra"
        onPress={() => router.replace({ pathname: '/compra/[id]', params: { id } })}
      />
    </Tela>
  );
}

export default function TelaDeConsultaPorChave() {
  const banco = useBanco();
  const [estado, setEstado] = useState<Estado>({ fase: 'digitar' });

  const aoLerNota = async (nota: NotaFiscal) => {
    const id = await buscarCompraPorChave(banco, nota.chave);
    setEstado(id ? { fase: 'duplicada', id } : { fase: 'lida', nota });
  };

  if (estado.fase === 'navegar') return <Navegador chave={estado.chave} aoLerNota={aoLerNota} />;
  if (estado.fase === 'lida') return <NotaLida nota={estado.nota} />;
  if (estado.fase === 'duplicada') return <Duplicada id={estado.id} />;
  return <CampoDaChave aoConfirmar={(chave) => setEstado({ fase: 'navegar', chave })} />;
}

const estilos = StyleSheet.create({
  pagina: { flex: 1, borderRadius: raio.md, overflow: 'hidden' },
});
