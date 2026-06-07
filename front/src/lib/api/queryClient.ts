/**
 * Instancia compartida de TanStack Query `QueryClient`.
 *
 * Defaults conservadores: pocos reintentos y un `staleTime` corto para no
 * machacar al backend pero mantener los datos razonablemente frescos.
 */

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
