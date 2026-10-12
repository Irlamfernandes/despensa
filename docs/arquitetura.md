# Arquitetura

## Visão geral

O app é dividido em quatro camadas, com dependências em um só sentido:

```
src/app (telas) ──► src/ui ──► src/domain
      │                            ▲
      └──────────► src/data ───────┘
```

| Camada   | Responsabilidade                                                                                  | Pode importar                                        | Não pode importar                              |
| -------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------- |
| `domain` | Regras de negócio puras: validação, cálculos, estatísticas, textos derivados                      | nada além de si mesma                                | React, React Native, Expo, `data`, `ui`, `app` |
| `data`   | SQLite: migrações, repositórios (SQL), hooks de consulta                                          | `domain`, `expo-sqlite`, `expo-router` (foco), React | `react-native`, `ui`, `app`                    |
| `ui`     | Componentes visuais reutilizáveis e tema                                                          | `domain`, React Native                               | `data`, `expo-sqlite`, `app`                   |
| `app`    | Telas e navegação (Expo Router): buscam dados em `data`, calculam com `domain`, desenham com `ui` | todas                                                | abrir o banco direto (`openDatabase*`)         |

Essas fronteiras são **verificadas pelo ESLint** (`eslint.config.js`, regra
`no-restricted-imports` por pasta). Se o lint reclamar de um import, a solução é
mover o código para a camada certa, não desligar a regra.

## Fluxo de dados

1. `src/app/_layout.tsx` abre o banco com `<SQLiteProvider>` e roda
   `migrar()` antes de mostrar qualquer tela.
2. Uma tela chama `useConsulta(funcaoDoRepositorio)`. O hook executa a consulta
   **sempre que a tela ganha foco**, então voltar de "Nova compra" já mostra os
   dados atualizados, sem estado global.
3. O resultado chega como `Carga<T>` (`carregando | erro | pronto`), e o
   componente `<Carregavel>` decide o que desenhar.
4. Cálculos (média do mês, previsão de reposição, preço por mercado) são feitos
   por funções de `domain`, que recebem os dados brutos dos repositórios.
5. Gravações (`salvarCompra`, `excluirCompra`) acontecem em transação.

## Por que assim

- **Domínio puro e testável:** a parte com mais regra (estatísticas, previsão,
  validação) roda e é testada no Node em milissegundos, sem celular.
- **Repositórios atrás de uma interface (`Banco`):** o app usa o
  `SQLiteDatabase` do `expo-sqlite`; os testes usam `better-sqlite3` com o
  **mesmo SQL**, então erros de SQL aparecem no `npm test`, não no celular.
- **Sem biblioteca de estado global:** o SQLite já é a fonte da verdade.
  Recarregar no foco é simples e suficiente para o volume de dados de uma casa.
- **Sem ORM:** poucas tabelas e consultas; SQL explícito é mais fácil de ler,
  otimizar e portar para o Postgres do Supabase.

## Navegação

- `src/app/_layout.tsx`: `Stack` raiz.
- `src/app/(abas)/_layout.tsx`: abas nativas (`expo-router/unstable-native-tabs`
  no SDK 57; vira `expo-router/native-tabs` no SDK 58).
- Telas empilhadas: `compra/nova`, `compra/[id]`, `produto/[id]`.
