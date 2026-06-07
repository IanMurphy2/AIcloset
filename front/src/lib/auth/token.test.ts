import { afterEach, describe, expect, it } from "vitest";

import {
  TOKEN_STORAGE_KEY,
  clearToken,
  getToken,
  setToken,
} from "@/lib/auth/token";

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
