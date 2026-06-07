import { screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// Mock de la capa de red. Conservamos `API_BASE_URL` (lo usa imageUrl.ts) y la
// clase `ApiError` real.
const apiFetchMock = vi.fn();
vi.mock("@/lib/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/client")>();
  return {
    ...actual,
    apiFetch: (...args: unknown[]) => apiFetchMock(...args),
    API_BASE_URL: "http://localhost:3000",
  };
});

import type { OutfitResponse } from "@/features/outfit/outfit-api";
import { OutfitsListPage } from "@/features/outfit/OutfitsListPage";
import { renderWithProviders } from "@/test/renderWithProviders";

function makeOutfit(overrides: Partial<OutfitResponse> = {}): OutfitResponse {
  return {
    id: crypto.randomUUID(),
    name: "Look casual",
    description: "Para todos los días",
    isPublic: false,
    items: [
      {
        clothingId: "c-1",
        imageUrl: "/uploads/tops.png",
        category: "tops",
        position: 0,
      },
      {
        clothingId: "c-2",
        imageUrl: "/uploads/bottoms.png",
        category: "bottoms",
        position: 1,
      },
    ],
    createdAt: "2026-06-06T00:00:00.000Z",
    updatedAt: "2026-06-06T00:00:00.000Z",
    ...overrides,
  };
}

/** Monta la página dentro de un router que resuelve el link al detalle. */
function renderList() {
  return renderWithProviders(
    <MemoryRouter initialEntries={["/outfits"]}>
      <Routes>
        <Route path="/outfits" element={<OutfitsListPage />} />
        <Route path="/outfits/:id" element={<p>Detalle</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("OutfitsListPage", () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza la lista con varios outfits (nombre, badge público/privado, conteo)", async () => {
    const outfits = [
      makeOutfit({ id: "o-1", name: "Look A", isPublic: true }),
      makeOutfit({
        id: "o-2",
        name: "Look B",
        isPublic: false,
        items: [
          {
            clothingId: "c-9",
            imageUrl: "/uploads/x.png",
            category: "calzado",
            position: 0,
          },
        ],
      }),
    ];
    apiFetchMock.mockResolvedValue(outfits);

    renderList();

    expect(await screen.findByText("Look A")).toBeInTheDocument();
    expect(screen.getByText("Look B")).toBeInTheDocument();

    // Badge público/privado.
    expect(screen.getByText("Público")).toBeInTheDocument();
    expect(screen.getByText("Privado")).toBeInTheDocument();

    // Conteo de prendas: Look A tiene 2, Look B tiene 1.
    expect(screen.getByText("2 prendas")).toBeInTheDocument();
    expect(screen.getByText("1 prenda")).toBeInTheDocument();

    // Pidió la lista con GET /outfit.
    expect(apiFetchMock).toHaveBeenCalledWith("/outfit");
  });

  it("cada card linkea al detalle /outfits/:id", async () => {
    apiFetchMock.mockResolvedValue([makeOutfit({ id: "o-42", name: "Look X" })]);

    renderList();

    const link = await screen.findByRole("link", { name: "Ver outfit Look X" });
    expect(link).toHaveAttribute("href", "/outfits/o-42");
  });

  it("muestra el preview de imágenes resueltas con resolveImageUrl", async () => {
    apiFetchMock.mockResolvedValue([makeOutfit({ id: "o-1", name: "Look A" })]);

    renderList();

    const link = await screen.findByRole("link", { name: "Ver outfit Look A" });
    const images = within(link).getAllByRole("img");
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute(
      "src",
      "http://localhost:3000/uploads/tops.png",
    );
  });

  it("muestra el estado vacío cuando no hay outfits", async () => {
    apiFetchMock.mockResolvedValue([]);

    renderList();

    expect(
      await screen.findByText("Todavía no armaste outfits."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Ver outfit/ })).not.toBeInTheDocument();
  });

  it("muestra el estado de error cuando la carga falla", async () => {
    apiFetchMock.mockRejectedValue(new Error("boom"));

    renderList();

    expect(
      await screen.findByText("No pudimos cargar tus outfits."),
    ).toBeInTheDocument();
  });
});
