// Tokens visuais do app. Componentes usam estes valores, nunca cores soltas.
export const cores = {
  fundo: '#F6F7F4',
  superficie: '#FFFFFF',
  borda: '#E2E5DE',
  texto: '#1F2A1F',
  textoSuave: '#5F6B5F',
  primaria: '#2E7D32',
  primariaSuave: '#E3F1E4',
  textoNaPrimaria: '#FFFFFF',
  alerta: '#B26A00',
  alertaSuave: '#FFF3DF',
  perigo: '#C62828',
} as const;

export const espaco = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;

export const raio = { sm: 8, md: 12, pilula: 999 } as const;

export const fonte = { pequena: 13, normal: 15, media: 17, grande: 22, destaque: 32 } as const;
