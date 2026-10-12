// Script injetado na página da NFC-e (dentro da WebView). Ele só COPIA os textos
// dos elementos do layout nacional da NFC-e e envia ao app; toda a conversão
// (números, datas, unidades) acontece em ./nota.ts, que é testável.
//
// Precisa ser uma string: o app roda em bytecode Hermes, que não guarda o
// código-fonte das funções. Escrito em ES5 para funcionar em qualquer WebView.
// O mesmo texto é executado nos testes contra uma página de exemplo (jsdom).

export const SCRIPT_DE_EXTRACAO = `
(function () {
  function texto(raiz, seletor) {
    var el = raiz.querySelector(seletor);
    return el ? el.textContent : null;
  }
  function enviar(mensagem) {
    window.ReactNativeWebView.postMessage(JSON.stringify(mensagem));
  }
  var linhas = document.querySelectorAll('#tabResult tr');
  if (!linhas.length) {
    enviar({ tipo: 'sem-nota', titulo: document.title });
    return;
  }
  var itens = Array.prototype.map.call(linhas, function (linha) {
    return {
      nome: texto(linha, '.txtTit'),
      codigo: texto(linha, '.RCod'),
      quantidade: texto(linha, '.Rqtd'),
      unidade: texto(linha, '.RUN'),
      valorUnitario: texto(linha, '.RvlUnit'),
      valorTotal: texto(linha, '.valor')
    };
  });
  var cabecalho = document.querySelector('.txtCenter');
  enviar({
    tipo: 'nota',
    nota: {
      mercado: texto(document, '.txtTopo'),
      cabecalho: cabecalho ? cabecalho.textContent : '',
      totais: texto(document, '#totalNota'),
      informacoes: texto(document, '#infos'),
      chave: texto(document, '.chave'),
      itens: itens
    }
  });
})();
true;
`;
