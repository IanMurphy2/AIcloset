import { act, render, renderHook, screen } from "@testing-library/react";
import { MemoryRouter, Navigate, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { useAuth } from "@/features/auth/auth-context";
import { TOKEN_STORAGE_KEY, getToken } from "@/lib/auth/token";

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

/** JWT de mentira con el `exp` indicado (segundos desde epoch). */
function makeJwt(exp: number): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(JSON.stringify({ exp }));
  return `${header}.${payload}.signature`;
}

describe("useAuth / AuthProvider", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("arranca sin sesión cuando no hay token en localStorage", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it("inicializa la sesión leyendo el token de localStorage", () => {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, "jwt.persistido");

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.token).toBe("jwt.persistido");
  });

  it("login() deja isAuthenticated=true, guarda el usuario y persiste el token", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login("jwt.nuevo", { id: "u1", email: "a@b.com" });
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.token).toBe("jwt.nuevo");
    expect(result.current.user).toEqual({ id: "u1", email: "a@b.com" });
    // Persistencia real en localStorage vía helpers de IAN-8.
    expect(getToken()).toBe("jwt.nuevo");
  });

  it("logout() limpia el estado y borra el token de localStorage", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login("jwt.nuevo");
    });
    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(getToken()).toBeNull();
  });

  it("arranca como NO autenticado cuando el token de localStorage ya venció", () => {
    const expired = makeJwt(Math.floor(Date.now() / 1000) - 60);
    window.localStorage.setItem(TOKEN_STORAGE_KEY, expired);

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.token).toBeNull();
    // El token vencido se purga de localStorage para no reintentar con él.
    expect(getToken()).toBeNull();
  });

  it("mantiene la sesión cuando el token de localStorage aún no venció", () => {
    const valid = makeJwt(Math.floor(Date.now() / 1000) + 3600);
    window.localStorage.setItem(TOKEN_STORAGE_KEY, valid);

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.token).toBe(valid);
  });

  it("una ruta protegida redirige a /login con un token vencido en localStorage", () => {
    const expired = makeJwt(Math.floor(Date.now() / 1000) - 60);
    window.localStorage.setItem(TOKEN_STORAGE_KEY, expired);

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route index element={<p>Zona protegida</p>} />
            </Route>
            <Route path="/login" element={<p>Pantalla de login</p>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );

    expect(screen.getByText("Pantalla de login")).toBeInTheDocument();
    expect(screen.queryByText("Zona protegida")).not.toBeInTheDocument();
  });

  it("useAuth lanza fuera de un AuthProvider", () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      /AuthProvider/,
    );
  });
});
