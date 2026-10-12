import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { lerQrDaNota } from '@/domain/nfce/qr';
import { Cartao, Erros, Tela, TelaFixa, TextoSuave, Titulo } from '@/ui/basicos';
import { Botao } from '@/ui/controles';
import { raio } from '@/ui/tema';

function LeitorDeQr() {
  const jaLeu = useRef(false);
  const [erros, setErros] = useState<string[]>([]);

  const aoLer = ({ data }: BarcodeScanningResult) => {
    if (jaLeu.current) return;
    const resultado = lerQrDaNota(data);
    if (!resultado.ok) {
      setErros(resultado.erros);
      return;
    }
    jaLeu.current = true;
    router.replace({ pathname: '/compra/nota', params: { qr: data } });
  };

  return (
    <TelaFixa>
      <TextoSuave>Aponte para o QR Code no fim do cupom fiscal.</TextoSuave>
      <View style={estilos.moldura}>
        <CameraView
          style={estilos.camera}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={aoLer}
        />
      </View>
      <Erros erros={erros} />
      <Botao
        titulo="Registrar manualmente"
        variante="secundario"
        onPress={() => router.replace('/compra/nova')}
      />
    </TelaFixa>
  );
}

export default function TelaDeEscanear() {
  const [permissao, pedirPermissao] = useCameraPermissions();
  if (!permissao) return null;
  if (permissao.granted) return <LeitorDeQr />;
  return (
    <Tela>
      <Cartao>
        <Titulo>Câmera</Titulo>
        <TextoSuave>
          O app usa a câmera só para ler o QR Code da nota fiscal. Nenhuma foto é guardada.
        </TextoSuave>
      </Cartao>
      <Botao titulo="Permitir câmera" onPress={pedirPermissao} />
    </Tela>
  );
}

const estilos = StyleSheet.create({
  moldura: { flex: 1, borderRadius: raio.md, overflow: 'hidden' },
  camera: { flex: 1 },
});
