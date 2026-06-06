import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ApiError,
  apiFetch,
  resetUnauthorizedHandler,
  setUnauthorizedHandler,
} from "@/lib/api/client";
import { TOKEN_STORAGE_KEY, getToken, setToken } from "@/lib/auth/token";

function jsonResponse(
  body: unknown,
  init: ResponseInit & { status?: number } = {},
): Response {
  const status = init.status ?? 200;
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("apiFetch", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetUnauthorizedHandler();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetUnauthorizedHandler();
  });

  it("adjunta Authorization: Bearer <token> cuando hay token en localStorage", async () => {
    setToken("jwt-123");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ ok: true }));

    await apiFetch("/me");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(headers.get("Authorization")).toBe("Bearer jwt-123");
  });

  it("no manda el header Authorization cuando no hay token", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ ok: true }));

    await apiFetch("/public");

    const [, init] = fetchMock.mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(headers.has("Authorization")).toBe(false);
  });

  it("resuelve la URL contra la base configurada", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ ok: true }));

    await apiFetch("/auth/login");

    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:3000/auth/login");
  });

  it("serializa el body objeto a JSON con Content-Type", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ token: "t" }));

    await apiFetch("/auth/login", {
      method: "POST",
      body: { email: "a@b.com", password: "x" },
    });

    const [, init] = fetchMock.mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(init?.body).toBe(JSON.stringify({ email: "a@b.com", password: "x" }));
  });

  it("devuelve el JSON parseado en respuestas OK", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ token: "abc", user: { id: 1 } }),
    );

    const data = await apiFetch<{ token: string }>("/auth/login");

    expect(data.token).toBe("abc");
  });

  it("ante 401 limpia el token y dispara la redirección por defecto", async () => {
    setToken("expired");
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBe("expired");

    // `window.location.assign` no es configurable en jsdom, así que
    // reemplazamos `window.location` por un stub con un assign espiable.
    const assignSpy = vi.fn();
    const originalLocation = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: { ...originalLocation, assign: assignSpy },
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ message: "Invalid or expired token" }, { status: 401 }),
    );

    try {
      await expect(apiFetch("/me")).rejects.toBeInstanceOf(ApiError);

      // clearToken() se ejecutó: localStorage quedó sin token.
      expect(getToken()).toBeNull();
      // Se intentó redirigir a /login.
      expect(assignSpy).toHaveBeenCalledWith("/login");
    } finally {
      Object.defineProperty(window, "location", {
        configurable: true,
        writable: true,
        value: originalLocation,
      });
    }
  });

  it("ante 401 usa el handler inyectado en lugar del default", async () => {
    setToken("expired");
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ message: "nope" }, { status: 401 }),
    );

    await expect(apiFetch("/me")).rejects.toMatchObject({
      status: 401,
      isUnauthorized: true,
    });

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it("lanza ApiError con status y mensaje en errores no-401", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ message: "Bad payload" }, { status: 400 }),
    );

    await expect(apiFetch("/things")).rejects.toMatchObject({
      name: "ApiError",
      status: 400,
      message: "Bad payload",
    });
  });

  it("lanza ApiError con status 0 ante fallo de red", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("boom"));

    await expect(apiFetch("/things")).rejects.toMatchObject({
      name: "ApiError",
      status: 0,
    });
  });
});
