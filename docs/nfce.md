# Leitura da NFC-e (cupom fiscal)

O app lê o QR Code do cupom, abre a consulta pública da SEFAZ numa WebView e
extrai os itens da página. Hoje só o **Rio de Janeiro (UF 33)** é suportado.

## Fluxo

```
câmera (expo-camera)
  └─ lerQrDaNota(conteúdo)            domain/nfce/qr.ts       → chave de acesso válida?
       └─ tela compra/nota
            ├─ buscarCompraPorChave()  data/compras.ts         → já importada? mostra a compra
            ├─ WebView abre enderecosDeConsulta(qr, chave)     → tenta cada URL em ordem
            │    ├─ decidirNavegacao(url)                      → segue / troca http→https / bloqueia
            │    └─ SCRIPT_DE_EXTRACAO (injetado)              → envia os textos crus da página
            ├─ proximoEstado(estado, evento)  domain/nfce/leitura.ts → máquina de estados
            ├─ converterNota(bruta)    domain/nfce/nota.ts     → números, datas, unidades
            └─ salvarCompra(compra, { chave, cnpj })           → grava com origem 'nfce'
```

## O que aprendemos sobre o portal da SEFAZ-RJ (out/2026)

- O QR Code aponta para `http://www4.fazenda.rj.gov.br/consultaNFCe/QRCode?p=CHAVE|versão|ambiente`.
- Esse endereço **redireciona para `http://consultadfe.fazenda.rj.gov.br/...`, que não
  responde** (o servidor só aceita https). Trocando para `https://` a página abre.
  O Android também bloqueia http em apps. Por isso `decidirNavegacao` troca todo
  http da SEFAZ-RJ por https, inclusive quando o erro chega pelo `onError`.
- O resultado fica em `resultadoQRCode2.faces?cid=N`. O `cid` é uma sessão no
  servidor e muda a cada consulta: **não dá para montar essa URL**, só seguir o fluxo.
- O site tem proteção anti-robô (F5) que exige executar JavaScript. Requisições
  diretas (curl, servidor) recebem só o desafio. **A WebView resolve sozinha.**
- O portal **bloqueia IPs listados em bases de abuso**, o que inclui IPs de data
  center e alguns IPs residenciais. No teste, o Wi-Fi de casa foi bloqueado e o
  4G funcionou. A mensagem de falha sugere usar os dados móveis.
- O certificado do `https://www4...` é incompleto: no Android dá "certificate
  authority is not trusted". Por isso a primeira URL é a consulta oficial em
  `consultadfe`; o `www4` fica como segunda tentativa.
- **Validado num Android real (out/2026), pelo 4G:** consultadfe → redireciona para
  `http://...resultadoQRCode2.faces` → o app troca para https → nota lida em ~4 s.
- Quando a página não tem `<title>`, a WebView usa a URL como título: mascare
  também o título nos logs (a URL tem a chave da nota).

## Layout da página (padrão nacional da NFC-e)

| Dado                   | Seletor                                                 |
| ---------------------- | ------------------------------------------------------- |
| Itens                  | `#tabResult tr`                                         |
| Nome / código          | `.txtTit` / `.RCod` ("(Código: 30002 )")                |
| Quantidade / unidade   | `.Rqtd` ("Qtde.:3") / `.RUN` ("UN: KG")                 |
| Valor unitário / total | `.RvlUnit` ("Vl. Unit.: 9,8") / `.valor`                |
| Mercado / CNPJ         | `.txtTopo` / texto "CNPJ: ..." no primeiro `.txtCenter` |
| Total pago             | `#totalNota` → "Valor a pagar R$: 22,04"                |
| Data                   | `#infos` → "Emissão: 12/10/2026 12:43:48-03:00"         |
| Chave                  | `.chave`                                                |

## Regras

- O `SCRIPT_DE_EXTRACAO` **só copia textos**. Toda interpretação fica em
  `converterNota`, que é testada. A mensagem vem de uma página externa: é dado
  não confiável e passa sempre por validação.
- O script é uma **string em ES5**: o app roda bytecode Hermes (não há código-fonte
  de funções para serializar) e a WebView pode ser antiga.
- A página de exemplo em `src/domain/nfce/__tests__/fixtures/nfce-rj.html` copia a
  estrutura real com **dados fictícios**. Se a SEFAZ mudar o layout, atualize a
  página de exemplo (nunca com dados reais) e os testes mostram o que quebrou.
- A mesma nota não pode ser importada duas vezes (índice único em `compras.chave_nfce`).
- O mercado é reconhecido pelo CNPJ, mesmo que o nome mude.

## Pendências

- Apelidos de produto: ligar "MORTADELA DEFUMADA SADIA 180G" (mercado + código) a
  um produto do catálogo com nome amigável, reconhecido automaticamente da
  segunda vez em diante.
- Editar o nome do mercado (a nota traz a razão social, ex.: "Fulano de Tal ME").
- Outros estados: cada SEFAZ tem um portal; o layout da página costuma ser o mesmo.
