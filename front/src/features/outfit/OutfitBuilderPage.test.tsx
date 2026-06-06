import { screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock de la capa de red. Conservamos `API_BASE_URL` (lo usa imageUrl.ts).
const apiFetchMock = vi.fn();
vi.mock("@/lib/api/client", () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
  API_BASE_URL: "http://localhost:3000",
}));

import type { ClothingItem } from "@/features/closet/types";
import { OutfitBuilderPage } from "@/features/outfit/OutfitBuilderPage";
import { SLOT_LABELS, OUTFIT_SLOTS } from "@/features/outfit/slots";
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

describe("OutfitBuilderPage", () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("muestra los 5 slots canónicos y la lista de prendas del inventario", async () => {
    apiFetchMock.mockResolvedValue([
      makeItem({ description: "Remera blanca" }),
      makeItem({ description: "Pantalón azul" }),
    ]);

    renderWithProviders(<OutfitBuilderPage />);

    // Las prendas del inventario.
    expect(await screen.findByText("Remera blanca")).toBeInTheDocument();
    expect(screen.getByText("Pantalón azul")).toBeInTheDocument();

    // Los 5 slots canónicos por su test id.
    for (const slot of OUTFIT_SLOTS) {
      expect(screen.getByTestId(`slot-${slot}`)).toBeInTheDocument();
    }

    // Reusa el listado sin filtros.
    expect(apiFetchMock).toHaveBeenCalledWith("/clothing");
  });

  it("cada slot vacío muestra el placeholder y no tiene botón de quitar", async () => {
    apiFetchMock.mockResolvedValue([makeItem({ description: "Remera blanca" })]);

    renderWithProviders(<OutfitBuilderPage />);

    await screen.findByText("Remera blanca");

    // Hay un placeholder por cada slot vacío (los 5).
    expect(screen.getAllByText("Soltá una prenda acá")).toHaveLength(
      OUTFIT_SLOTS.length,
    );

    // Ningún botón "Quitar" mientras todos los slots están vacíos.
    for (const slot of OUTFIT_SLOTS) {
      expect(
        screen.queryByRole("button", { name: `Quitar ${SLOT_LABELS[slot]}` }),
      ).not.toBeInTheDocument();
    }
  });

  it("muestra el estado vacío cuando el armario no tiene prendas", async () => {
    apiFetchMock.mockResolvedValue([]);

    renderWithProviders(<OutfitBuilderPage />);

    expect(await screen.findByText("Tu armario está vacío.")).toBeInTheDocument();
    // Sin prendas, no se monta el builder (no hay slots).
    expect(screen.queryByTestId("slot-tops")).not.toBeInTheDocument();
  });

  it("muestra el estado de error cuando la API falla", async () => {
    apiFetchMock.mockRejectedValue(new Error("boom"));

    renderWithProviders(<OutfitBuilderPage />);

    expect(
      await screen.findByText("No pudimos cargar tus prendas."),
    ).toBeInTheDocument();
  });

  it("arranca con el resumen del outfit vacío", async () => {
    apiFetchMock.mockResolvedValue([makeItem({ description: "Remera blanca" })]);

    renderWithProviders(<OutfitBuilderPage />);

    await screen.findByText("Remera blanca");
    await waitFor(() => {
      expect(screen.getByTestId("outfit-summary")).toHaveTextContent(
        "Sin prendas en el outfit todavía.",
      );
    });
  });

  it("renderiza una prenda arrastrable por cada item del inventario", async () => {
    const a = makeItem({ id: "a", description: "Remera blanca" });
    const b = makeItem({ id: "b", description: "Pantalón azul" });
    apiFetchMock.mockResolvedValue([a, b]);

    renderWithProviders(<OutfitBuilderPage />);

    await screen.findByText("Remera blanca");

    const draggableA = screen.getByTestId("draggable-a");
    expect(draggableA).toBeInTheDocument();
    expect(within(draggableA).getByText("Remera blanca")).toBeInTheDocument();
    expect(screen.getByTestId("draggable-b")).toBeInTheDocument();
  });
});
