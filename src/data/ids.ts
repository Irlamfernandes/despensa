import { randomUUID } from 'expo-crypto';

/** UUID v4 gerado no aparelho, para que os registros possam ser sincronizados depois. */
export function novoId(): string {
  return randomUUID();
}
