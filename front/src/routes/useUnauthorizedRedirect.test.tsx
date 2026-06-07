import { act, render, screen } from "@testing-library/react";
import { MemoryRouter, Navigate, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { apiFetch, resetUnauthorizedHandler } from "@/lib/api/client";
import { TOKEN_STORAGE_KEY } from "@/lib/auth/token";
import { useUnauthorizedRedirect } from "@/routes/useUnauthorizedRedirect";

function Harness({ onReady }: { onReady: () => void }) {
  useUnauthorizedRedirect();
  // Señala que el effect ya corrió (el handler está registrado).
  queueMicrotask(onReady);
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route index element={<p>Zona protegida</p>} />
      </Route>
      <Route path="/login" element={<p>Pantalla de login</p>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

describe("useUnauthorizedRedirect (refinamiento del 401)", () => {
  afterEach(() => {
    window.localStorage.clear();
    resetUnauthorizedHandler();
  });

  it("ante un 401, cierra sesión y navega a /login con el router", async () => {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, "jwt.valido");

    let ready = false;
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/"]}>
          <Harness
            onReady={() => {
              ready = true;
            }}
          />
        </MemoryRouter>
      </AuthProvider>,
    );

    // Estado inicial: token presente -> zona protegida visible.
    expect(screen.getByText("Zona protegida")).toBeInTheDocument();

    // Esperamos a que el effect registre el handler.
    await new Promise<void>((resolve) => {
      const check = () => (ready ? resolve() : queueMicrotask(check));
      check();
    });

    // Simulamos un 401: parcheamos fetch para devolver 401 y llamamos apiFetch.
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      })) as typeof fetch;

    try {
      // El handler de 401 hace logout + navigate => state updates en React.
      await act(async () => {
        await expect(apiFetch("/whatever")).rejects.toMatchObject({
          status: 401,
        });
      });
    } finally {
      globalThis.fetch = originalFetch;
    }

    // El handler refinado debe haber cerrado sesión (token borrado) y navegado.
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    expect(await screen.findByText("Pantalla de login")).toBeInTheDocument();
    expect(screen.queryByText("Zona protegida")).not.toBeInTheDocument();
  });
});
