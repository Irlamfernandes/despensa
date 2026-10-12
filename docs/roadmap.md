# Roadmap

## Feito

- [x] Registro manual de compras (mercado, data, itens com quantidade, unidade e preço)
- [x] Catálogo automático de mercados e produtos, com sugestões ao digitar
- [x] Resumo: gasto do mês × média dos meses anteriores e gasto por mercado
- [x] Previsão de reposição ("pode estar acabando")
- [x] Produto: preço atual por mercado e histórico
- [x] Harness: lint com fronteiras de camadas e limites de complexidade, testes de
      domínio e de SQL, CI

## Próximos

### 1. APK para os dois celulares

- Configurar EAS Build (perfil `preview` gerando `.apk`) e EAS Update para
  atualizações sem reinstalar.

### 2. Leitura da NFC-e (cupom fiscal)

- Escanear o QR Code do cupom (`expo-camera`).
- Abrir a página da SEFAZ **numa WebView dentro do app** e extrair os itens da
  página carregada. Motivo: o portal da SEFAZ-RJ bloqueia IPs de data center
  (testado em out/2026), então a consulta precisa sair do celular, como um
  acesso normal pelo navegador. Se houver captcha, o usuário resolve na própria tela.
- Layout da página da NFC-e é padronizado nacionalmente (tabela de itens com
  nome, código, quantidade, unidade, valor unitário e total).
- Nova tabela `apelidos_de_produto` (mercado + código do item na nota → produto),
  para que "LTE COND MOCOCA 395G" seja reconhecido automaticamente da segunda vez
  em diante. Sugestão de produto por semelhança de texto, **sem IA**.
- Validar com um cupom real antes de implementar o parser.

### 3. Sincronização entre os dois celulares (Supabase)

- Auth com duas contas na mesma "casa"; RLS por casa.
- Sincronizar por `atualizado_em` (o modelo já usa UUID e exclusão lógica).
- O SQLite continua sendo a fonte local: o app funciona offline.

### Ideias

- Alerta de quantidade fora do comum ("você costuma levar 2 kg, levou 5").
- Lista de compras gerada a partir da previsão de reposição.
- Preço por kg/litro para comparar embalagens diferentes.
