/**
 * Tipos y contexto de autenticación.
 *
 * Separamos la *definición* del contexto y el hook de consumo del componente
 * `AuthProvider` para mantener `react-refresh/only-export-components` contento
 * (los archivos de componentes solo exportan componentes).
 */

import { createContext, useContext } from "react";

/** Datos mínimos del usuario autenticado (se ampliará en issues posteriores). */
export interface AuthUser {
  id?: string;
  email?: string;
  name?: string;
}

/** Estado y acciones de sesión expuestos por el `AuthContext`. */
export interface AuthContextValue {
  /** `true` mientras exista un token en memoria/localStorage. */
  isAuthenticated: boolean;
  /** JWT actual, o `null` si no hay sesión. */
  token: string | null;
  /** Usuario asociado a la sesión, si se proporcionó al hacer login. */
  user: AuthUser | null;
  /** Persiste el token (y opcionalmente el usuario) e inicia sesión. */
  login: (token: string, user?: AuthUser) => void;
  /** Limpia el token y cierra la sesión. */
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Hook de acceso al estado de sesión.
 *
 * @throws si se usa fuera de un `AuthProvider`.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth debe usarse dentro de un <AuthProvider>");
  }
  return context;
}
