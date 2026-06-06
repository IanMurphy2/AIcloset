import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/client";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { RegisterPage } from "@/features/auth/RegisterPage";
import { getToken } from "@/lib/auth/token";

vi.mock("@/features/auth/auth-api", () => ({
  login: vi.fn(),
  register: vi.fn(),
}));

import * as authApi from "@/features/auth/auth-api";

const registerMock = vi.mocked(authApi.register);

function renderRegisterFlow() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={["/register"]}>
          <Routes>
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<div>Home protegida</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe("RegisterPage", () => {
  beforeEach(() => {
    registerMock.mockReset();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("renderiza el formulario de registro con el campo nombre", () => {
    renderRegisterFlow();

    expect(
      screen.getByRole("heading", { name: "Crear cuenta" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
  });

  it("con datos válidos llama a /auth/register, autentica y navega a /", async () => {
    const user = userEvent.setup();
    registerMock.mockResolvedValue({
      token: "jwt.nuevo",
      user: { id: "u2", email: "nuevo@b.com", name: "Nico" },
    });

    renderRegisterFlow();

    await user.type(screen.getByLabelText("Nombre"), "Nico");
    await user.type(screen.getByLabelText("Email"), "nuevo@b.com");
    await user.type(screen.getByLabelText("Contraseña"), "secret123");
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() => {
      expect(screen.getByText("Home protegida")).toBeInTheDocument();
    });

    // `mutate` añade un segundo arg (contexto de la mutation); validamos el payload.
    expect(registerMock).toHaveBeenCalledTimes(1);
    expect(registerMock.mock.calls[0][0]).toEqual({
      email: "nuevo@b.com",
      password: "secret123",
      name: "Nico",
    });
    expect(getToken()).toBe("jwt.nuevo");
  });

  it("ante error del servidor (409) muestra el mensaje y NO navega", async () => {
    const user = userEvent.setup();
    registerMock.mockRejectedValue(new ApiError(409, "User already exists"));

    renderRegisterFlow();

    await user.type(screen.getByLabelText("Nombre"), "Nico");
    await user.type(screen.getByLabelText("Email"), "nuevo@b.com");
    await user.type(screen.getByLabelText("Contraseña"), "secret123");
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() => {
      expect(screen.getByText("User already exists")).toBeInTheDocument();
    });

    expect(screen.queryByText("Home protegida")).not.toBeInTheDocument();
    expect(getToken()).toBeNull();
  });

  it("no dispara el request si los campos están vacíos", async () => {
    const user = userEvent.setup();
    renderRegisterFlow();

    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(registerMock).not.toHaveBeenCalled();
    expect(screen.getByText("El nombre es obligatorio.")).toBeInTheDocument();
    expect(screen.getByText("El email es obligatorio.")).toBeInTheDocument();
    expect(
      screen.getByText("La contraseña es obligatoria."),
    ).toBeInTheDocument();
  });

  it("valida longitud mínima de password sin disparar el request", async () => {
    const user = userEvent.setup();
    renderRegisterFlow();

    await user.type(screen.getByLabelText("Nombre"), "Nico");
    await user.type(screen.getByLabelText("Email"), "nuevo@b.com");
    await user.type(screen.getByLabelText("Contraseña"), "short");
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(registerMock).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        "La contraseña debe tener al menos 8 caracteres.",
      ),
    ).toBeInTheDocument();
  });
});
