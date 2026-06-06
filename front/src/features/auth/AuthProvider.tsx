/**
 * `AuthProvider`: mantiene el estado de sesión y lo expone vía `AuthContext`.
 *
 * El token se inicializa leyendo de localStorage (helpers de IAN-8), de modo
 * que un refresh de página conserve la sesión. `login`/`logout` mantienen
 * sincronizados el estado en memoria y localStorage.
 */

import { useCallback, useMemo, useState, type ReactNode } from "react";

import {
  clearToken,
  getToken,
  isTokenExpired,
  setToken,
} from "@/lib/auth/token";
import {
  AuthContext,
  type AuthContextValue,
  type AuthUser,
} from "@/features/auth/auth-context";

/**
 * Lee el token de localStorage al inicializar, descartando los que ya vencieron.
 *
 * Un JWT con `exp` pasado no debe dejar "entrar" a rutas protegidas tras un
 * refresh: lo borramos de localStorage y arrancamos como no autenticado, de
 * modo que el guard redirija a `/login`. La verificación de firma es del
 * backend; acá solo parseamos el `exp` (ver `isTokenExpired`).
 */
function readInitialToken(): string | null {
  const stored = getToken();
  if (stored !== null && isTokenExpired(stored)) {
    clearToken();
    return null;
  }
  return stored;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Estado inicial derivado de localStorage para sobrevivir a un refresh.
  const [token, setTokenState] = useState<string | null>(readInitialToken);
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = useCallback((nextToken: string, nextUser?: AuthUser) => {
    setToken(nextToken);
    setTokenState(nextToken);
    setUser(nextUser ?? null);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated: token !== null,
      login,
      logout,
    }),
    [token, user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
