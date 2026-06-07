import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { Layout } from "@/components/Layout";

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<p>Contenido de la página</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("Layout", () => {
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
});
