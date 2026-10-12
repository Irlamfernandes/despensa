# Modelo de dados

Banco SQLite local (`despensa.db`), criado e atualizado por
`src/data/migracoes.ts`.

## Tabelas

```
mercados ─┐
          └──< compras ──< itens_compra >── produtos
```

| Tabela         | Campos principais                                                             | Observações                                                             |
| -------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `mercados`     | `nome`, `nome_normalizado`, `cnpj`                                            | Nome e CNPJ únicos entre os não excluídos                               |
| `produtos`     | `nome`, `nome_normalizado`, `unidade`                                         | Unidade padrão do produto: `un`, `kg`, `g`, `l`, `ml`                   |
| `compras`      | `mercado_id`, `data`, `total`, `origem`, `chave_nfce`                         | `origem`: `manual` ou `nfce`; `chave_nfce` única entre as não excluídas |
| `itens_compra` | `compra_id`, `produto_id`, `quantidade`, `unidade`, `preco_unitario`, `total` | Unidade do item pode diferir da do produto                              |

## Convenções

Pensadas para a sincronização futura com o Supabase (Postgres):

- **`id` TEXT com UUID v4** gerado no aparelho (`expo-crypto`). Dois celulares
  podem criar registros offline sem colisão.
- **`criado_em` / `atualizado_em`** em ISO 8601 (UTC). Toda alteração atualiza
  `atualizado_em`, que servirá para saber o que sincronizar.
- **Exclusão lógica (`excluido_em`)**: nada é apagado de verdade. Toda consulta
  filtra `excluido_em IS NULL`. Isso permite propagar exclusões entre aparelhos.
- **Dinheiro em centavos (`INTEGER`)**, nunca `REAL`.
- **Datas de compra em `AAAA-MM-DD` (`TEXT`)**: ordenam como texto e não têm
  problema de fuso horário.
- **Nomes normalizados** (`normalizarNome` em `src/domain/compra.ts`) evitam
  duplicar "Café Pilão" e "cafe pilao".
- `PRAGMA foreign_keys = ON` e `CHECK` nas colunas garantem integridade mesmo
  se um bug escapar da validação do domínio.

## Migrações

| Versão | O que muda                                                |
| ------ | --------------------------------------------------------- |
| 1      | Tabelas iniciais                                          |
| 2      | `compras.chave_nfce` e `mercados.cnpj` (leitura da NFC-e) |

- A versão do banco fica em `PRAGMA user_version`.
- `MIGRACOES` é uma lista; a posição `n` leva o banco da versão `n` para `n+1`.
- Cada migração roda numa transação junto com a atualização da versão.
- **Nunca edite uma migração existente** depois de publicada: acrescente uma nova.
- Toda migração nova precisa de teste em `src/data/__tests__/`.
