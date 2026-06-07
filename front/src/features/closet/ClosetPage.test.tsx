import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock de la capa de red. Conservamos `API_BASE_URL` (lo usa imageUrl.ts).
const apiFetchMock = vi.fn();
vi.mock("@/lib/api/client", () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
  API_BASE_URL: "http://localhost:3000",
}));

import { ClosetPage } from "@/features/closet/ClosetPage";
import type { ClothingItem } from "@/features/closet/types";
import { renderWithProviders } from "@/test/renderWithProviders";

function makeItem(overrides: Partial<ClothingItem> = {}): ClothingItem {
  return {
    id: crypto.randomUUID(),
    userId: "user-1",
    imageUrl: "/uploads/sample.png",
    description: "Prenda de prueba",
    category: "remeras",
    color: "negro",
    createdAt: "2026-06-05T00:00:00.000Z",
    ...overrides,
  };
}

describe("ClosetPage", () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza la grilla con las prendas devueltas por la API", async () => {
    apiFetchMock.mockResolvedValue([
      makeItem({ description: "Remera blanca" }),
      makeItem({ description: "Pantalón azul", category: "pantalones", color: "azul" }),
      makeItem({ description: "Campera roja", category: "abrigos", color: "rojo" }),
    ]);

    renderWithProviders(<ClosetPage />);

    expect(await screen.findByText("Remera blanca")).toBeInTheDocument();
    expect(screen.getByText("Pantalón azul")).toBeInTheDocument();
    expect(screen.getByText("Campera roja")).toBeInTheDocument();

    // La primera llamada es al listado sin filtros.
    expect(apiFetchMock).toHaveBeenCalledWith("/clothing");

    // La imagen relativa se prefija con la base de la API.
    const img = screen.getByRole("img", { name: "Remera blanca" });
    expect(img).toHaveAttribute("src", "http://localhost:3000/uploads/sample.png");
  });

  it("muestra el estado vacío cuando la API devuelve []", async () => {
    apiFetchMock.mockResolvedValue([]);

    renderWithProviders(<ClosetPage />);

    expect(await screen.findByText("Tu armario está vacío.")).toBeInTheDocument();
  });

  it("muestra un vacío específico cuando hay filtros sin resultados", async () => {
    // Primera carga con datos, luego filtro que no matchea -> [].
    apiFetchMock.mockResolvedValueOnce([makeItem({ description: "Remera blanca" })]);
    apiFetchMock.mockResolvedValueOnce([]);

    const user = userEvent.setup();
    renderWithProviders(<ClosetPage />);

    await screen.findByText("Remera blanca");

    await user.type(screen.getByLabelText("Categoría"), "inexistente");
    await user.click(screen.getByRole("button", { name: "Filtrar" }));

    expect(
      await screen.findByText("No hay prendas que coincidan con los filtros."),
    ).toBeInTheDocument();
  });

  it("dispara una nueva query con el query param correcto al cambiar un filtro", async () => {
    apiFetchMock.mockResolvedValue([makeItem({ description: "Remera blanca" })]);

    const user = userEvent.setup();
    renderWithProviders(<ClosetPage />);

    await screen.findByText("Remera blanca");
    expect(apiFetchMock).toHaveBeenLastCalledWith("/clothing");

    await user.type(screen.getByLabelText("Categoría"), "remeras");
    await user.type(screen.getByLabelText("Color"), "negro");
    await user.click(screen.getByRole("button", { name: "Filtrar" }));

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenLastCalledWith(
        "/clothing?category=remeras&color=negro",
      );
    });
  });

  it("muestra el estado de error cuando la API falla", async () => {
    apiFetchMock.mockRejectedValue(new Error("boom"));

    renderWithProviders(<ClosetPage />);

    expect(
      await screen.findByText("No pudimos cargar tus prendas."),
    ).toBeInTheDocument();
  });
});
