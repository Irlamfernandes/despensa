# Roadmap

## Feito

- [x] Registro manual de compras (mercado, data, itens com quantidade, unidade e preço)
- [x] Catálogo automático de mercados e produtos, com sugestões ao digitar
- [x] Resumo: gasto do mês × média dos meses anteriores e gasto por mercado
- [x] Previsão de reposição ("pode estar acabando")
- [x] Produto: preço atual por mercado e histórico
- [x] Leitura da NFC-e do RJ pelo QR Code (WebView), sem importar a mesma nota duas vezes
- [x] Lista de compras que desconta sozinha o que foi comprado
- [x] Editar o nome do mercado e juntar mercados duplicados
- [x] Harness: lint com fronteiras de camadas e limites de complexidade, testes de
      domínio e de SQL, CI

## Próximos

### 1. APK para os dois celulares

- Configurar EAS Build (perfil `preview` gerando `.apk`) e EAS Update para
  atualizações sem reinstalar.

### 2. Melhorias da NFC-e

- Testar no celular com notas de outros mercados (ver docs/nfce.md).
- Apelidos de produto: ligar o nome da nota a um produto do catálogo, sem IA.

### 3. Sincronização entre os dois celulares (Supabase)

- Auth com duas contas na mesma "casa"; RLS por casa.
- Sincronizar por `atualizado_em` (o modelo já usa UUID e exclusão lógica).
- O SQLite continua sendo a fonte local: o app funciona offline.

### Ideias

- Alerta de quantidade fora do comum ("você costuma levar 2 kg, levou 5").
- Botão para pôr na lista tudo o que "pode estar acabando".
- Preço por kg/litro para comparar embalagens diferentes.
