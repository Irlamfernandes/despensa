// Os testes não precisam do log de diagnóstico (src/log.ts) poluindo a saída.
jest.spyOn(console, 'log').mockImplementation(() => undefined);
