# Modelo de dados

Banco SQLite local (`despensa.db`), criado e atualizado por
`src/data/migracoes.ts`.

## Tabelas

```
mercados ─┐
          └──< compras ──< itens_compra >── produtos ──< lista_de_compras
```

| Tabela             | Campos principais                                                             | Observações                                                             |
| ------------------ | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `mercados`         | `nome`, `nome_normalizado`, `cnpj`                                            | Nome e CNPJ únicos entre os não excluídos                               |
| `produtos`         | `nome`, `nome_normalizado`, `unidade`                                         | Unidade padrão do produto: `un`, `kg`, `g`, `l`, `ml`                   |
| `compras`          | `mercado_id`, `data`, `total`, `origem`, `chave_nfce`                         | `origem`: `manual` ou `nfce`; `chave_nfce` única entre as não excluídas |
| `itens_compra`     | `compra_id`, `produto_id`, `quantidade`, `unidade`, `preco_unitario`, `total` | Unidade do item pode diferir da do produto                              |
| `lista_de_compras` | `produto_id`, `quantidade`, `unidade`, `desde`                                | Um item por produto entre os não excluídos (ver abaixo)                 |
| `equivalencias`    | `produto_id`, `equivalente_id`, `equivale`                                    | Respostas a "é o mesmo produto?" da lista                               |

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

## Lista de compras

O saldo de cada item **não é gravado**: é calculado em `src/domain/lista.ts` a
partir dos itens de compra do mesmo produto cujas compras foram registradas
(`compras.criado_em`) depois de `lista_de_compras.desde`.

- Lista com 30, compra com 3 → faltam 27. Excluir a compra devolve os 3.
- Alterar a quantidade de um item atualiza `desde`: o novo número já é o que falta.
- Compra em outra unidade (lista em `un`, nota em `kg`) resolve o item, porque não
  dá para converter.
- O vínculo é pelo produto do catálogo. Para nomes diferentes ("Suco em pó" na
  lista, "SUCO PO TANG 25G" na nota), `src/domain/semelhanca.ts` compara as
  palavras (sem acento, medidas e preposições; abreviações a partir de 4 letras)
  e a aba Lista pergunta se é o mesmo produto. A resposta fica em
  `equivalencias` (`produto_id` = produto da lista, `equivalente_id` = produto
  comprado, `equivale` 1 ou 0): com sim, as compras do equivalente descontam o
  item agora e nas próximas listas; com não, a pergunta não volta.
- "Comprei sem registrar": diminui à mão (`diminuirNaLista`); se zerar, o item sai.

## Mercados

- Renomear mantém o CNPJ: as próximas notas do mercado continuam caindo nele.
- Renomear para o nome de outro mercado oferece **juntar**: as compras passam
  para o outro, a origem é excluída e o destino herda o CNPJ se não tiver um.

## Migrações

| Versão | O que muda                                                |
| ------ | --------------------------------------------------------- |
| 1      | Tabelas iniciais                                          |
| 2      | `compras.chave_nfce` e `mercados.cnpj` (leitura da NFC-e) |
| 3      | `lista_de_compras`                                        |
| 4      | `equivalencias` (nomes diferentes para o mesmo produto)   |

- A versão do banco fica em `PRAGMA user_version`.
- `MIGRACOES` é uma lista; a posição `n` leva o banco da versão `n` para `n+1`.
- Cada migração roda numa transação junto com a atualização da versão.
- **Nunca edite uma migração existente** depois de publicada: acrescente uma nova.
- Toda migração nova precisa de teste em `src/data/__tests__/`.
