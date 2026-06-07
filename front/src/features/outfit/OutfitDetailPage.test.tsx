import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// Mock de la capa de red. Conservamos `API_BASE_URL` (lo usa imageUrl.ts) y la
// clase `ApiError` real (la página la usa para distinguir el 404).
const apiFetchMock = vi.fn();
vi.mock("@/lib/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/client")>();
  return {
    ...actual,
    apiFetch: (...args: unknown[]) => apiFetchMock(...args),
    API_BASE_URL: "http://localhost:3000",
  };
});

import { ApiError } from "@/lib/api/client";
import type { OutfitResponse } from "@/features/outfit/outfit-api";
import { OutfitDetailPage } from "@/features/outfit/OutfitDetailPage";
import { SLOT_LABELS } from "@/features/outfit/slots";
import { renderWithProviders } from "@/test/renderWithProviders";

function makeOutfit(overrides: Partial<OutfitResponse> = {}): OutfitResponse {
  return {
    id: "o-1",
    name: "Look completo",
    description: "Un look para salir",
    isPublic: true,
    items: [
      {
        clothingId: "c-2",
        imageUrl: "/uploads/bottoms.png",
        category: "bottoms",
        position: 1,
      },
      {
        clothingId: "c-1",
        imageUrl: "/uploads/tops.png",
        category: "tops",
        position: 0,
      },
    ],
    createdAt: "2026-06-06T00:00:00.000Z",
    updatedAt: "2026-06-06T00:00:00.000Z",
    ...overrides,
  };
}

function renderDetail(id: string) {
  return renderWithProviders(
    <MemoryRouter initialEntries={[`/outfits/${id}`]}>
      <Routes>
        <Route path="/outfits/:id" element={<OutfitDetailPage />} />
        <Route path="/outfits/:id/edit" element={<p>Editor</p>} />
        <Route path="/outfits" element={<p>Lista</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("OutfitDetailPage", () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza nombre, descripción y el flag público", async () => {
    apiFetchMock.mockResolvedValue(makeOutfit());

    renderDetail("o-1");

    expect(await screen.findByText("Look completo")).toBeInTheDocument();
    expect(screen.getByText("Un look para salir")).toBeInTheDocument();
    expect(screen.getByText("Público")).toBeInTheDocument();

    expect(apiFetchMock).toHaveBeenCalledWith("/outfit/o-1");
  });

  it("muestra el flag privado cuando isPublic es false", async () => {
    apiFetchMock.mockResolvedValue(makeOutfit({ isPublic: false }));

    renderDetail("o-1");

    expect(await screen.findByText("Privado")).toBeInTheDocument();
  });

  it("renderiza los items por slot en orden de position, con labels e imágenes resueltas", async () => {
    apiFetchMock.mockResolvedValue(makeOutfit());

    renderDetail("o-1");

    // Labels de slot por category.
    expect(await screen.findByText(SLOT_LABELS.tops)).toBeInTheDocument();
    expect(screen.getByText(SLOT_LABELS.bottoms)).toBeInTheDocument();

    // Imágenes resueltas vía resolveImageUrl.
    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(2);
    // Orden por position: tops (pos 0) antes que bottoms (pos 1), aunque la
    // response los traiga al revés.
    expect(images[0]).toHaveAttribute(
      "src",
      "http://localhost:3000/uploads/tops.png",
    );
    expect(images[0]).toHaveAttribute("alt", SLOT_LABELS.tops);
    expect(images[1]).toHaveAttribute(
      "src",
      "http://localhost:3000/uploads/bottoms.png",
    );
  });

  it("incluye un link a editar", async () => {
    apiFetchMock.mockResolvedValue(makeOutfit());

    renderDetail("o-1");

    const editLink = await screen.findByRole("link", { name: "Editar" });
    expect(editLink).toHaveAttribute("href", "/outfits/o-1/edit");
  });

  it("muestra mensaje de no encontrado ante un 404", async () => {
    apiFetchMock.mockRejectedValue(new ApiError(404, "Outfit not found"));

    renderDetail("missing");

    expect(
      await screen.findByText("No encontramos este outfit."),
    ).toBeInTheDocument();
    // Ofrece volver a la lista en lugar de reintentar.
    expect(
      screen.getByRole("link", { name: "Volver a mis outfits" }),
    ).toBeInTheDocument();
  });

  it("muestra mensaje genérico de error ante otros fallos", async () => {
    apiFetchMock.mockRejectedValue(new ApiError(500, "boom"));

    renderDetail("o-1");

    expect(
      await screen.findByText("No pudimos cargar el outfit."),
    ).toBeInTheDocument();
  });
});
