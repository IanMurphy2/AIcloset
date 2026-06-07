/**
 * Cliente HTTP de AI Closet.
 *
 * `apiFetch` es un wrapper de `fetch` que:
 * - resuelve la URL contra la base configurable (`VITE_API_URL`),
 * - adjunta el header `Authorization: Bearer <token>` si hay JWT en localStorage,
 * - parsea la respuesta como JSON,
 * - ante un 401 limpia la sesión y redirige a `/login`,
 * - lanza un `ApiError` tipado para que el caller pueda distinguir status/mensaje.
 */

import { clearToken, getToken } from "@/lib/auth/token";

/** Base URL del backend. Configurable vía `VITE_API_URL`. */
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

/** Ruta a la que redirigimos cuando la sesión deja de ser válida (401). */
export const LOGIN_PATH = "/login";

/**
 * Error tipado de la capa de red/API.
 *
 * `status` es el código HTTP (0 si la request ni siquiera salió, p.ej. fallo de
 * red). `data` es el cuerpo parseado de la respuesta de error, si lo hubo.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /** `true` cuando el backend rechazó la sesión (token ausente/expirado). */
  get isUnauthorized(): boolean {
    return this.status === 401;
  }
}

export interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  /**
   * Cuerpo de la request. Si es un objeto plano (no string/FormData/Blob...) se
   * serializa a JSON y se setea `Content-Type: application/json`.
   */
  body?: BodyInit | Record<string, unknown> | unknown[] | null;
}

/**
 * Punto de extensión: handler que se ejecuta ante un 401. El default limpia el
 * token y redirige a `/login` (router-agnóstico hasta IAN-9). Inyectable para
 * tests y para refinar la redirección cuando exista React Router.
 */
export type UnauthorizedHandler = () => void;

function defaultOnUnauthorized(): void {
  clearToken();
  // Redirección router-agnóstica; IAN-9 la reemplazará por navegación del router.
  window.location.assign(LOGIN_PATH);
}

let onUnauthorized: UnauthorizedHandler = defaultOnUnauthorized;

/** Permite sobreescribir el comportamiento ante 401 (tests / IAN-9). */
export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {
  onUnauthorized = handler;
}

/** Restaura el handler de 401 por defecto. */
export function resetUnauthorizedHandler(): void {
  onUnauthorized = defaultOnUnauthorized;
}

function buildUrl(path: string): string {
  // Si ya es una URL absoluta, respetarla; si no, resolver contra la base.
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const base = API_BASE_URL.replace(/\/+$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

function isPlainBody(body: ApiFetchOptions["body"]): body is Record<string, unknown> | unknown[] {
  if (body === null || body === undefined) return false;
  if (typeof body === "string") return false;
  if (body instanceof FormData) return false;
  if (body instanceof Blob) return false;
  if (body instanceof ArrayBuffer) return false;
  if (body instanceof URLSearchParams) return false;
  if (typeof ReadableStream !== "undefined" && body instanceof ReadableStream) return false;
  return typeof body === "object";
}

async function parseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (response.status === 204 || response.status === 205) {
    return null;
  }
  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  const text = await response.text();
  return text.length > 0 ? text : null;
}

function extractMessage(data: unknown, fallback: string): string {
  if (data && typeof data === "object" && "message" in data) {
    const message = (data as { message?: unknown }).message;
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
  }
  return fallback;
}

/**
 * Ejecuta una request contra el backend.
 *
 * @typeParam T - tipo esperado del cuerpo de respuesta exitoso.
 * @throws {ApiError} si la respuesta no es OK o si falla la red.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { body, headers: optionHeaders, ...rest } = options;

  const headers = new Headers(optionHeaders);

  const token = getToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let requestBody: BodyInit | null | undefined;
  if (isPlainBody(body)) {
    requestBody = JSON.stringify(body);
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  } else {
    requestBody = body as BodyInit | null | undefined;
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path), {
      ...rest,
      headers,
      body: requestBody,
    });
  } catch (cause) {
    throw new ApiError(
      0,
      cause instanceof Error ? cause.message : "Network request failed",
    );
  }

  if (response.status === 401) {
    // Sesión inválida/expirada: limpiar y redirigir antes de devolver el error.
    onUnauthorized();
    const data = await parseBody(response);
    throw new ApiError(401, extractMessage(data, "Unauthorized"), data);
  }

  const data = await parseBody(response);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      extractMessage(data, response.statusText || "Request failed"),
      data,
    );
  }

  return data as T;
}
