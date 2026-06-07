/**
 * Helpers para leer/escribir/borrar el JWT en localStorage.
 *
 * El token se guarda bajo una única clave (`auth_token`) y todo el acceso a
 * localStorage para auth pasa por acá, de modo que el resto de la app no
 * dependa del detalle de almacenamiento.
 */

export const TOKEN_STORAGE_KEY = "auth_token";

/**
 * Devuelve el JWT almacenado, o `null` si no hay token o si localStorage no
 * está disponible (p.ej. SSR o modo restringido del navegador).
 */
export function getToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Persiste el JWT en localStorage. */
export function setToken(token: string): void {
  try {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // localStorage no disponible: no-op para no romper la app.
  }
}

/** Borra el JWT de localStorage (cierre de sesión). */
export function clearToken(): void {
  try {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // localStorage no disponible: no-op.
  }
}
