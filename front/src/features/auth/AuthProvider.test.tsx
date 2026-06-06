import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AuthProvider } from "@/features/auth/AuthProvider";
import { useAuth } from "@/features/auth/auth-context";
import { TOKEN_STORAGE_KEY, getToken } from "@/lib/auth/token";

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
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

  it("useAuth lanza fuera de un AuthProvider", () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      /AuthProvider/,
    );
  });
});
