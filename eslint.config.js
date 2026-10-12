// Regras de lint e de arquitetura. As fronteiras entre camadas estão
// descritas em docs/arquitetura.md; aqui elas são verificadas por máquina.
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

const camadasDeTela = {
  group: ['@/app', '@/app/*'],
  message:
    'Só o Expo Router importa telas. Extraia o código compartilhado para src/ui ou src/data.',
};

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    ignores: ['dist/*', 'coverage/*', '.expo/*'],
  },
  {
    // Qualidade: limites objetivos para manter o código simples de ler e testar.
    // Se uma função estourar um limite, divida-a; não aumente o limite.
    rules: {
      complexity: ['error', { max: 6 }],
      'max-depth': ['error', 2],
      'max-params': ['error', 3],
      'max-lines-per-function': ['error', { max: 60, skipBlankLines: true, skipComments: true }],
      'max-lines': ['error', { max: 250, skipBlankLines: true, skipComments: true }],
      'max-nested-callbacks': ['error', 3],
      'no-else-return': ['error', { allowElseIf: false }],
      'no-nested-ternary': 'error',
      'no-param-reassign': 'error',
      'prefer-const': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
    },
  },
  {
    // Testes descrevem casos em blocos longos; os limites de tamanho não se aplicam.
    files: ['**/__tests__/**'],
    rules: {
      'max-lines-per-function': 'off',
      'max-nested-callbacks': 'off',
    },
  },
  {
    // domain: regras puras. Sem React, React Native, Expo ou banco.
    files: ['src/domain/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-native', 'react-native-*', 'expo', 'expo-*', '@expo/*'],
              message:
                'src/domain deve ser TypeScript puro (sem React/Expo). Veja docs/arquitetura.md.',
            },
            {
              group: ['@/data', '@/data/*', '@/ui', '@/ui/*'],
              message: 'src/domain não depende de nenhuma outra camada.',
            },
            camadasDeTela,
          ],
        },
      ],
    },
  },
  {
    // data: banco e consultas. Pode usar domain; não conhece interface.
    files: ['src/data/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-native',
              message: 'src/data não usa componentes de interface.',
            },
          ],
          patterns: [
            {
              group: ['@/ui', '@/ui/*'],
              message: 'src/data não depende de src/ui.',
            },
            camadasDeTela,
          ],
        },
      ],
    },
  },
  {
    // ui: componentes visuais reutilizáveis. Não acessam o banco.
    files: ['src/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/data', '@/data/*', 'expo-sqlite'],
              message: 'src/ui só recebe dados por props. Busque os dados na tela (src/app).',
            },
            camadasDeTela,
          ],
        },
      ],
    },
  },
  {
    // app (telas): acesso ao banco só pelos repositórios de src/data.
    files: ['src/app/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'expo-sqlite',
              importNames: ['openDatabaseAsync', 'openDatabaseSync'],
              message: 'Telas usam os repositórios de src/data, não o SQLite direto.',
            },
          ],
        },
      ],
    },
  },
]);
