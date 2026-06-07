/**
 * Helper de render para tests: monta el árbol con los providers comunes.
 *
 * Por defecto envuelve con un `QueryClientProvider` con un `QueryClient` fresco
 * (sin reintentos, sin caché entre tests) y, opcionalmente, con un
 * `MemoryRouter` para componentes que dependan del router.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactElement, ReactNode } from "react";

/** Crea un `QueryClient` aislado para un test (sin reintentos ni caché compartida). */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
  /** Si es `true`, además envuelve con `MemoryRouter`. */
  withRouter?: boolean;
  /** Permite inyectar un `QueryClient` propio (p.ej. para inspeccionarlo). */
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  { withRouter = false, queryClient, ...options }: RenderWithProvidersOptions = {},
) {
  const client = queryClient ?? createTestQueryClient();

  function Wrapper({ children }: { children: ReactNode }) {
    const tree = (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    return withRouter ? <MemoryRouter>{tree}</MemoryRouter> : tree;
  }

  return { client, ...render(ui, { wrapper: Wrapper, ...options }) };
}
