import { afterEach, describe, expect, it } from "vitest";

import {
  TOKEN_STORAGE_KEY,
  clearToken,
  getToken,
  isTokenExpired,
  setToken,
} from "@/lib/auth/token";

/**
 * Construye un JWT de mentira con el `exp` dado. La firma es un placeholder:
 * `isTokenExpired` solo parsea el payload base64, no verifica firma.
 */
function makeJwt(exp: number): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(JSON.stringify({ exp }));
  return `${header}.${payload}.signature`;
}

describe("token helpers", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("getToken devuelve null cuando no hay token", () => {
    expect(getToken()).toBeNull();
  });

  it("setToken persiste el token bajo la clave esperada", () => {
    setToken("abc.123");

    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBe("abc.123");
    expect(getToken()).toBe("abc.123");
  });

  it("clearToken borra el token de localStorage", () => {
    setToken("abc.123");
    clearToken();

    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    expect(getToken()).toBeNull();
  });
});

describe("isTokenExpired", () => {
  const nowSeconds = Math.floor(Date.now() / 1000);

  it("devuelve true para un token cuyo exp ya venció", () => {
    expect(isTokenExpired(makeJwt(nowSeconds - 60))).toBe(true);
  });

  it("devuelve false para un token con exp en el futuro", () => {
    expect(isTokenExpired(makeJwt(nowSeconds + 3600))).toBe(false);
  });

  it("trata un string no-JWT como NO expirado (token opaco)", () => {
    // Decisión documentada: si no podemos parsear el exp, no lo marcamos vencido.
    expect(isTokenExpired("no-es-un-jwt")).toBe(false);
  });

  it("trata un JWT sin claim exp como NO expirado", () => {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(JSON.stringify({ sub: "u1" }));
    expect(isTokenExpired(`${header}.${payload}.sig`)).toBe(false);
  });

  it("devuelve false cuando no hay token", () => {
    expect(isTokenExpired(null)).toBe(false);
    expect(isTokenExpired(undefined)).toBe(false);
    expect(isTokenExpired("")).toBe(false);
  });
});
