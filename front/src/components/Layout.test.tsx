import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import { Layout } from "@/components/Layout";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { TOKEN_STORAGE_KEY } from "@/lib/auth/token";

/**
 * Monta el `Layout` dentro de `AuthProvider` + `MemoryRouter`, con una ruta
 * `/login` hermana para poder observar la navegación tras el logout.
 */
function renderLayout() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<p>Contenido de la página</p>} />
          </Route>
          <Route path="/login" element={<p>Pantalla de login</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("Layout", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("renderiza la navegación principal", () => {
    renderLayout();

    const nav = screen.getByRole("navigation", {
      name: "Navegación principal",
    });
    expect(nav).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Mi armario" }),
    ).toBeInTheDocument();
  });

  it("renderiza el contenido hijo en el Outlet", () => {
    renderLayout();

    expect(screen.getByText("Contenido de la página")).toBeInTheDocument();
  });

  it("no muestra el botón de logout cuando no hay sesión", () => {
    renderLayout();

    expect(
      screen.queryByRole("button", { name: "Cerrar sesión" }),
    ).not.toBeInTheDocument();
  });

  it("muestra el botón de logout cuando hay sesión", () => {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, "jwt.valido");
    renderLayout();

    expect(
      screen.getByRole("button", { name: "Cerrar sesión" }),
    ).toBeInTheDocument();
  });

  it("al hacer click en logout limpia el token y navega a /login", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(TOKEN_STORAGE_KEY, "jwt.valido");
    renderLayout();

    await user.click(screen.getByRole("button", { name: "Cerrar sesión" }));

    // Token borrado de localStorage (logout limpia la sesión).
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    // Navegación a /login (replace).
    expect(await screen.findByText("Pantalla de login")).toBeInTheDocument();
    // Sin sesión, el botón ya no se renderiza.
    expect(
      screen.queryByRole("button", { name: "Cerrar sesión" }),
    ).not.toBeInTheDocument();
  });
});
