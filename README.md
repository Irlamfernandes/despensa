# Despensa

App Android para registrar as compras de mercado e entender os hábitos da casa:
quanto se gasta por mês em comparação com o normal, quanto cada produto custa em
cada mercado e o que provavelmente está acabando.

Feito para uso pessoal, para mim e minha esposa, com os dados no próprio aparelho.

## Funcionalidades

- **Escanear a nota fiscal**: lê o QR Code do cupom (NFC-e do RJ), consulta a
  SEFAZ e importa mercado, data e todos os itens com preço. A mesma nota não
  entra duas vezes.
- **Registrar compras manualmente**: mercado, data e itens (quantidade, unidade e preço).
  Mercados e produtos novos entram no catálogo automaticamente, com sugestões
  enquanto você digita.
- **Resumo do mês**: quanto foi gasto, comparado com a média dos meses anteriores
  ("18% acima da média"), e o gasto por mercado.
- **Pode estar acabando**: a partir do intervalo entre as compras de cada produto,
  o app prevê quando ele deve ser comprado de novo.
- **Produtos**: preço mais recente em cada mercado (do mais barato ao mais caro)
  e o histórico de preços.

Próximas etapas: sincronização entre os dois celulares e apelidos de produto. Veja o [roadmap](docs/roadmap.md).

## Tecnologias

- React Native 0.86 + Expo SDK 57, Expo Router (abas nativas)
- TypeScript (estrito)
- SQLite (`expo-sqlite`)
- Jest (`jest-expo`), com testes de SQL usando `better-sqlite3`
- ESLint + Prettier, GitHub Actions

## Arquitetura e harness

O projeto foi estruturado para desenvolvimento com agentes de IA
(_harness engineering_): o [`AGENTS.md`](AGENTS.md) é um mapa curto do projeto, a
pasta [`docs/`](docs/) é a fonte da verdade, e as regras são **verificadas por
máquina**, não só documentadas:

- fronteiras entre camadas (`domain` → `data` → `ui` → telas) checadas pelo ESLint;
- limites de complexidade ciclomática, tamanho de função e de arquivo;
- regras de negócio puras e testadas, e o SQL testado contra um SQLite real;
- `npm run check` no pre-commit e no CI, além de varredura de segredos (gitleaks).

Detalhes em [docs/arquitetura.md](docs/arquitetura.md) e [docs/qualidade.md](docs/qualidade.md).

## Como rodar

Pré-requisitos: Node.js 20+ e um celular Android com o app
[Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent), ou um emulador.

```bash
git clone https://github.com/Irlamfernandes/despensa.git
cd despensa
npm install
npx expo start
```

Escaneie o QR Code com o Expo Go.

```bash
npm run check   # tipos, lint e testes
npm test        # só os testes
```

## Licença

MIT. Veja [LICENSE](LICENSE).
