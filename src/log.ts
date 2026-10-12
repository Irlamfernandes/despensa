// Log de diagnóstico. As mensagens aparecem no terminal do `npx expo start`
// (e no `adb logcat`), com prefixo por área: [despensa:banco], [despensa:nfce]...
// Único lugar do app que pode usar console.log (ver eslint.config.js).
// Nunca registre dados pessoais completos (chave da nota, CNPJ, itens comprados).

type Dados = Record<string, unknown>;

function hora(): string {
  return new Date().toISOString().slice(11, 23);
}

function descreverErro(erro: unknown): Dados {
  if (erro instanceof Error) {
    return { erro: erro.message, pilha: erro.stack?.split('\n').slice(0, 4).join(' | ') };
  }
  return { erro: String(erro) };
}

export function criarLog(area: string) {
  const prefixo = `[despensa:${area}]`;
  return {
    info(mensagem: string, dados?: Dados) {
      console.log(hora(), prefixo, mensagem, dados ?? '');
    },
    erro(mensagem: string, erro: unknown, dados?: Dados) {
      console.error(hora(), prefixo, mensagem, { ...dados, ...descreverErro(erro) });
    },
  };
}

/** Mostra só o começo e o fim de um identificador (ex.: chave da NFC-e). */
export function mascarar(texto: string): string {
  return texto.length > 10 ? `${texto.slice(0, 6)}…${texto.slice(-4)}` : texto;
}

/** URL com a chave da NFC-e (44 dígitos) mascarada. */
export function mascararUrl(url: string): string {
  return url.replace(/\d{44}/g, (chave) => mascarar(chave));
}

interface ManipuladorGlobal {
  getGlobalHandler(): (erro: unknown, fatal?: boolean) => void;
  setGlobalHandler(manipulador: (erro: unknown, fatal?: boolean) => void): void;
}

/** Registra no log os erros não tratados antes de repassá-los ao React Native. */
export function registrarErrosGlobais(): void {
  const utils = (globalThis as { ErrorUtils?: ManipuladorGlobal }).ErrorUtils;
  if (!utils) return;
  const anterior = utils.getGlobalHandler();
  const log = criarLog('global');
  utils.setGlobalHandler((erro, fatal) => {
    log.erro(fatal ? 'erro fatal não tratado' : 'erro não tratado', erro);
    anterior(erro, fatal);
  });
}
