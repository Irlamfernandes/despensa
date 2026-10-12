# Qualidade de código

Objetivo: código simples de ler, testar e mudar. Os limites abaixo são
**verificados por máquina** (`npm run check` localmente, no pre-commit e no CI).

## Limites (ESLint)

| Regra                      | Limite            | Por quê                                     |
| -------------------------- | ----------------- | ------------------------------------------- |
| `complexity` (ciclomática) | 6 por função      | Poucos caminhos = fácil de testar todos     |
| `max-depth`                | 2 níveis de bloco | Evita `if` dentro de `for` dentro de `if`   |
| `max-params`               | 3                 | Mais que isso: receba um objeto             |
| `max-lines-per-function`   | 60                | Funções e componentes pequenos              |
| `max-lines`                | 250 por arquivo   | Arquivos focados                            |
| `no-nested-ternary`        | proibido          | Legibilidade                                |
| `no-param-reassign`        | proibido          | Funções sem efeito colateral nos argumentos |

Ao estourar um limite, **divida** (extraia função ou componente). Não aumente o
limite nem use `eslint-disable`.

## Padrões

- **TypeScript estrito**, com `noUncheckedIndexedAccess`: acesso a array/mapa
  pode ser `undefined` e precisa ser tratado.
- **Funções puras no domínio:** recebem dados, devolvem dados. A data de "hoje"
  é passada como parâmetro, nunca lida dentro da regra (facilita teste).
- **Validação devolve `Resultado<T>`** (`{ ok: true, valor } | { ok: false, erros }`)
  em vez de lançar exceção para erro esperado do usuário.
- **Componentes de `ui` recebem tudo por props** e não buscam dados.
- **Nomes em português**, descritivos (`listarComprasResumidas`, não `getData`).
- Comentários explicam o **porquê**, não o que o código já diz.

## Testes

- `src/domain/__tests__/`: regras de negócio, casos de borda (datas inválidas,
  arredondamento, meses sem compra).
- `src/data/__tests__/`: repositórios e migrações com **SQLite real**
  (`better-sqlite3`) via a interface `Banco`.
- Todo bug corrigido ganha um teste que falharia sem a correção.

## Desempenho

- Consultas usam índices (`compras.data`, `itens_compra.compra_id/produto_id`).
- Agregações pesadas ficam no SQL (window functions, `GROUP BY`); o domínio
  trabalha com listas já reduzidas.
- Dados recarregam só quando a tela ganha foco, sem polling.
