import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// Mock de la capa de red. Conservamos `ApiError` y `API_BASE_URL`
// (la página los usa para el 404 y para resolver la imagen).
const apiFetchMock = vi.fn();
vi.mock("@/lib/api/client", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/api/client")>(
      "@/lib/api/client",
    );
  return {
    ...actual,
    apiFetch: (...args: unknown[]) => apiFetchMock(...args),
  };
});

import { ClothingDetailPage } from "@/features/closet/ClothingDetailPage";
import type { ClothingItem } from "@/features/closet/types";
import {
  createTestQueryClient,
  renderWithProviders,
} from "@/test/renderWithProviders";

const ITEM: ClothingItem = {
  id: "c1",
  userId: "u1",
  imageUrl: "/uploads/abc.png",
  description: "Remera blanca",
  category: "remeras",
  color: "blanco",
  createdAt: "2026-06-06T00:00:00.000Z",
};

/** Renderiza la página bajo la ruta `/closet/:id` con el id provisto. */
function renderDetail(id: string, client = createTestQueryClient()) {
  return renderWithProviders(
    <MemoryRouter initialEntries={[`/closet/${id}`]}>
      <Routes>
        <Route path="/closet/:id" element={<ClothingDetailPage />} />
      </Routes>
    </MemoryRouter>,
    { queryClient: client },
  );
}

describe("ClothingDetailPage", () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("hace GET /clothing/:id y renderiza imagen + metadatos", async () => {
    apiFetchMock.mockResolvedValueOnce(ITEM);

    renderDetail("c1");

    // Título / descripción.
    expect(
      await screen.findByRole("heading", { name: "Remera blanca" }),
    ).toBeInTheDocument();

    // Imagen con el alt de la descripción.
    const img = screen.getByRole("img", { name: "Remera blanca" });
    expect(img).toHaveAttribute("src", expect.stringContaining("/uploads/abc.png"));

    // Metadatos: categoría, color y fecha.
    expect(screen.getAllByText("remeras").length).toBeGreaterThan(0);
    expect(screen.getAllByText("blanco").length).toBeGreaterThan(0);
    expect(screen.getByText(/2026/)).toBeInTheDocument();

    // Pegó al endpoint correcto.
    expect(apiFetchMock).toHaveBeenCalledWith("/clothing/c1");

    // Link a editar.
    expect(
      screen.getByRole("link", { name: /Editar/i }),
    ).toHaveAttribute("href", "/closet/c1/edit");
  });

  it("muestra un mensaje claro cuando la prenda no existe (404)", async () => {
    const { ApiError } = await vi.importActual<
      typeof import("@/lib/api/client")
    >("@/lib/api/client");
    apiFetchMock.mockRejectedValueOnce(
      new ApiError(404, "Clothing item not found"),
    );

    renderDetail("missing");

    expect(
      await screen.findByText("No encontramos esta prenda."),
    ).toBeInTheDocument();
    // Ofrece volver al armario sin romper.
    expect(
      screen.getByRole("link", { name: /Volver al armario/i }),
    ).toHaveAttribute("href", "/");
  });

  it("muestra un error genérico ante un fallo de red distinto de 404", async () => {
    const { ApiError } = await vi.importActual<
      typeof import("@/lib/api/client")
    >("@/lib/api/client");
    apiFetchMock.mockRejectedValueOnce(new ApiError(500, "Server error"));

    renderDetail("c1");

    expect(
      await screen.findByText(/No pudimos cargar la prenda/i),
    ).toBeInTheDocument();
  });
});
