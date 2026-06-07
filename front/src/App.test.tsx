import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import { AuthProvider } from "@/features/auth/AuthProvider";
import { TOKEN_STORAGE_KEY } from "@/lib/auth/token";
import { AppRoutes } from "@/routes/AppRoutes";

function renderRoutesAt(initialPath: string) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <AppRoutes />
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("AppRoutes (guard de rutas)", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("redirige a /login al entrar a una ruta protegida sin token", () => {
    renderRoutesAt("/");

    // El placeholder de login se renderiza tras la redirección.
    expect(
      screen.getByRole("heading", { name: "Iniciar sesión" }),
    ).toBeInTheDocument();

    // El contenido protegido NO debe estar presente.
    expect(screen.queryByText("Mi armario")).not.toBeInTheDocument();
  });

  it("renderiza la ruta protegida (dentro del layout) cuando hay token", () => {
    // El AuthProvider lee el token de localStorage en su estado inicial.
    window.localStorage.setItem(TOKEN_STORAGE_KEY, "jwt.de.prueba");

    renderRoutesAt("/");

    // Contenido protegido visible.
    expect(
      screen.getByRole("heading", { name: "Mi armario" }),
    ).toBeInTheDocument();

    // La navegación del layout también está montada.
    expect(
      screen.getByRole("navigation", { name: "Navegación principal" }),
    ).toBeInTheDocument();

    // No estamos en el login.
    expect(
      screen.queryByRole("heading", { name: "Iniciar sesión" }),
    ).not.toBeInTheDocument();
  });

  it("/login es pública y accesible sin token", () => {
    renderRoutesAt("/login");

    expect(
      screen.getByRole("heading", { name: "Iniciar sesión" }),
    ).toBeInTheDocument();
  });
});
