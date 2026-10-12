# Despensa — guia para agentes

App Android (Expo + React Native) para registrar compras de mercado e acompanhar
gastos, preços e reposição de produtos. Uso pessoal de um casal; dados locais em
SQLite (sincronização com Supabase planejada).

Este arquivo é um **mapa**. Os detalhes estão em `docs/` — leia o documento da
área antes de mexer nela.

| Assunto                                            | Documento                                          |
| -------------------------------------------------- | -------------------------------------------------- |
| Camadas, fronteiras e fluxo de dados               | [docs/arquitetura.md](docs/arquitetura.md)         |
| Tabelas, migrações e convenções do banco           | [docs/modelo-de-dados.md](docs/modelo-de-dados.md) |
| Leitura da nota fiscal (NFC-e) e o portal da SEFAZ | [docs/nfce.md](docs/nfce.md)                       |
| Padrões de código e limites de qualidade           | [docs/qualidade.md](docs/qualidade.md)             |
| Próximas etapas (NFC-e, Supabase, APK)             | [docs/roadmap.md](docs/roadmap.md)                 |

## Comandos

```bash
npm run check        # typecheck + lint + testes — rode antes de dizer que terminou
npm test             # só os testes (jest)
npm run format       # prettier
npm run doctor       # expo-doctor: dependências e configuração
npx expo start       # servidor de desenvolvimento
npx expo install <p> # SEMPRE use para instalar pacotes (resolve versões do SDK)
```

Uma tarefa só está pronta quando `npm run check` passa sem erros nem avisos.

## Regras que valem sempre

1. **Expo muda a cada SDK.** Antes de usar qualquer API do Expo/React Native,
   confira a versão em `package.json` (hoje SDK 57) e leia
   `https://docs.expo.dev/versions/v57.0.0/`. Para o resto, comece por
   `https://docs.expo.dev/llms.txt`. Não confie na memória.
2. **Só Android.** Não adicione código, config ou dependências de iOS/web.
3. **Camadas** (verificadas pelo ESLint): `domain` é TypeScript puro;
   `data` acessa o banco; `ui` só recebe props; telas em `src/app` juntam tudo.
4. **Regra de negócio vai para `src/domain`, com teste.** Telas não calculam.
5. **Dinheiro em centavos** (inteiro). **Datas de compra em `AAAA-MM-DD`.**
6. **Banco:** só por repositórios de `src/data`, sempre com parâmetros (`?`),
   nunca concatenando valores no SQL. Mudou o esquema? Nova migração no fim de
   `src/data/migracoes.ts` — nunca edite uma existente.
7. **Limites de qualidade não se negociam:** se o lint acusar complexidade ou
   tamanho, divida a função. Não aumente limites nem use `eslint-disable`.
8. **Nunca** versione `.env`, chaves, bancos `.db` ou dados reais de compras.
   O repositório é público.
9. **Teste comandos do jeito que o CI roda:** sempre `npm run <script>`, nunca
   só `npx <ferramenta>`. Um script que chama um binário não instalado no
   projeto funciona na sua máquina (pelo cache do npx) e quebra no CI.
10. Pastas `android/` e `ios/` são geradas (CNG). Não crie nem edite; configure
    pelo `app.json` e config plugins.

## Onde fica cada coisa

```
src/
  app/        telas (Expo Router): (abas)/ = Resumo, Compras, Produtos
  domain/     regras puras + testes em __tests__/ (nfce/ = leitura da nota)
  data/       SQLite: migrações, repositórios, hooks; testes com SQLite real
  ui/         componentes visuais e tema
docs/         documentação (fonte da verdade)
```

## Idioma

Código, comentários, commits e documentação em **português do Brasil**.
Commits seguem Conventional Commits (`feat:`, `fix:`, `docs:`...), checado pelo commitlint.

## Quando errar

Se você (agente) cometer um erro que poderia se repetir, não corrija só o caso:
acrescente a proteção — uma regra de lint, um teste ou uma linha neste arquivo
ou em `docs/`. É assim que o harness melhora.
