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

/** Margen (en segundos) para considerar expirado un token que está por vencer. */
const EXPIRY_LEEWAY_SECONDS = 0;

/** Payload mínimo de un JWT que nos interesa: el claim estándar `exp`. */
interface JwtPayload {
  /** Expiración en segundos desde epoch (claim estándar `exp`). */
  exp?: number;
}

/**
 * Decodifica el payload (segunda parte) de un JWT **sin verificar la firma**.
 *
 * Solo parsea el base64url del payload; no valida nada criptográfico (eso es
 * responsabilidad del backend). Devuelve `null` si el string no tiene forma de
 * JWT o si el payload no es JSON válido.
 */
function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  try {
    // base64url -> base64 estándar antes de decodificar.
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    const payload = JSON.parse(json) as unknown;
    if (payload && typeof payload === "object") {
      return payload as JwtPayload;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Indica si un JWT ya venció según su claim `exp`.
 *
 * Solo parsea el payload base64 del token (no verifica firma): es un chequeo
 * de UX para no dejar "entrar" con un token vencido en localStorage; la
 * validación real la hace el backend (y el 401 cubre el vencimiento en uso).
 *
 * Decisión sobre tokens no parseables: si el string no es un JWT con tres
 * partes, o el payload no trae un `exp` numérico, lo tratamos como **NO
 * expirado** (`false`). Así no rompemos tokens opacos/no estándar; un token
 * realmente inválido lo terminará rechazando el backend con un 401.
 */
export function isTokenExpired(token: string | null | undefined): boolean {
  if (!token) {
    // Sin token no hay nada que pueda estar "vencido"; el guard ya lo trata
    // como no autenticado.
    return false;
  }

  const payload = decodeJwtPayload(token);
  if (payload === null || typeof payload.exp !== "number") {
    // Token opaco/no estándar: no lo tratamos como vencido.
    return false;
  }

  const nowSeconds = Date.now() / 1000;
  return payload.exp <= nowSeconds - EXPIRY_LEEWAY_SECONDS;
}
