/** Estado de um dado carregado de forma assíncrona (banco, rede). */
export type Carga<T> =
  { status: 'carregando' } | { status: 'erro'; erro: unknown } | { status: 'pronto'; dados: T };
