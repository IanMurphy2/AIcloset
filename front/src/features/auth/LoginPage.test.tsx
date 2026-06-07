import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, API_BASE_URL } from "@/lib/api/client";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { LoginPage } from "@/features/auth/LoginPage";
import { getToken } from "@/lib/auth/token";

// Mock de la capa de red: controlamos las respuestas de los endpoints de auth.
vi.mock("@/features/auth/auth-api", () => ({
  login: vi.fn(),
  register: vi.fn(),
}));

import * as authApi from "@/features/auth/auth-api";

const loginMock = vi.mocked(authApi.login);

/**
 * Render del flujo real: arranca en `/login` y monta una ruta `/` "protegida"
 * de marcador para poder verificar la navegación post-login.
 */
function renderLoginFlow(initialEntry = "/login") {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<div>Home protegida</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    loginMock.mockReset();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("renderiza el formulario de login", () => {
    renderLoginFlow();

    expect(
      screen.getByRole("heading", { name: "Iniciar sesión" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Iniciar sesión" }),
    ).toBeInTheDocument();
  });

  it("con credenciales válidas llama al endpoint, guarda el token y navega a /", async () => {
    const user = userEvent.setup();
    loginMock.mockResolvedValue({
      token: "jwt.valido",
      user: { id: "u1", email: "a@b.com", name: "Ana" },
    });

    renderLoginFlow();

    await user.type(screen.getByLabelText("Email"), "a@b.com");
    await user.type(screen.getByLabelText("Contraseña"), "secret123");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    await waitFor(() => {
      expect(screen.getByText("Home protegida")).toBeInTheDocument();
    });

    // `mutate` añade un segundo arg (contexto de la mutation); validamos el payload.
    expect(loginMock).toHaveBeenCalledTimes(1);
    expect(loginMock.mock.calls[0][0]).toEqual({
      email: "a@b.com",
      password: "secret123",
    });
    expect(getToken()).toBe("jwt.valido");
  });

  it("con credenciales inválidas (401) muestra error y NO navega", async () => {
    const user = userEvent.setup();
    loginMock.mockRejectedValue(
      new ApiError(401, "Invalid email or password"),
    );

    renderLoginFlow();

    await user.type(screen.getByLabelText("Email"), "a@b.com");
    await user.type(screen.getByLabelText("Contraseña"), "wrongpass");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    await waitFor(() => {
      expect(
        screen.getByText("Invalid email or password"),
      ).toBeInTheDocument();
    });

    // No navegó a la home protegida y no guardó token.
    expect(screen.queryByText("Home protegida")).not.toBeInTheDocument();
    expect(getToken()).toBeNull();
  });

  it("no dispara el request si los campos están vacíos", async () => {
    const user = userEvent.setup();
    renderLoginFlow();

    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect(loginMock).not.toHaveBeenCalled();
    // Muestra errores de validación de requeridos.
    expect(screen.getByText("El email es obligatorio.")).toBeInTheDocument();
    expect(
      screen.getByText("La contraseña es obligatoria."),
    ).toBeInTheDocument();
  });

  it("el botón de Google apunta a ${API_BASE}/auth/google (navegación full-page)", () => {
    renderLoginFlow();

    const googleLink = screen.getByRole("link", { name: /Google/ });
    // Reutiliza la base configurable de IAN-8 (no hardcodea el host).
    expect(googleLink).toHaveAttribute(
      "href",
      `${API_BASE_URL}/auth/google`,
    );
  });

  it("con ?error=oauth muestra el mensaje de error de Google", () => {
    renderLoginFlow("/login?error=oauth");

    expect(
      screen.getByText("No se pudo iniciar sesión con Google."),
    ).toBeInTheDocument();
  });
});
