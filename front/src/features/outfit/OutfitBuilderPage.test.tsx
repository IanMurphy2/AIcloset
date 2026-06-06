import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// Mock de la capa de red. Conservamos `API_BASE_URL` (lo usa imageUrl.ts) y la
// clase `ApiError` real (la página la usa para extraer el mensaje del error).
const apiFetchMock = vi.fn();
vi.mock("@/lib/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/client")>();
  return {
    ...actual,
    apiFetch: (...args: unknown[]) => apiFetchMock(...args),
    API_BASE_URL: "http://localhost:3000",
  };
});

// Espía de navegación.
const navigateMock = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => navigateMock };
});

import { ApiError } from "@/lib/api/client";
import type { ClothingItem } from "@/features/closet/types";
import { OutfitBuilderPage } from "@/features/outfit/OutfitBuilderPage";
import { OUTFIT_SLOTS } from "@/features/outfit/slots";
import {
  renderWithProviders,
  createTestQueryClient,
} from "@/test/renderWithProviders";

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

/** Resuelve `apiFetch` según el path/método (clothing vs outfit). */
function routeApi(handlers: {
  clothing?: () => unknown;
  getOutfit?: () => unknown;
  post?: () => unknown;
  put?: () => unknown;
}) {
  apiFetchMock.mockImplementation((path: string, options?: { method?: string }) => {
    const method = options?.method ?? "GET";
    if (path === "/clothing") return Promise.resolve(handlers.clothing?.() ?? []);
    if (path.startsWith("/outfit/") && method === "PUT")
      return Promise.resolve(handlers.put?.());
    if (path.startsWith("/outfit/") && method === "GET")
      return Promise.resolve(handlers.getOutfit?.());
    if (path === "/outfit" && method === "POST")
      return Promise.resolve(handlers.post?.());
    return Promise.resolve(undefined);
  });
}

function renderCreate() {
  return renderWithProviders(
    <MemoryRouter initialEntries={["/outfits/new"]}>
      <Routes>
        <Route path="/outfits/new" element={<OutfitBuilderPage />} />
        <Route path="/outfits/:id/edit" element={<OutfitBuilderPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function renderEdit(id: string) {
  const client = createTestQueryClient();
  return renderWithProviders(
    <MemoryRouter initialEntries={[`/outfits/${id}/edit`]}>
      <Routes>
        <Route path="/outfits/:id/edit" element={<OutfitBuilderPage />} />
      </Routes>
    </MemoryRouter>,
    { queryClient: client },
  );
}

describe("OutfitBuilderPage", () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
    navigateMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("muestra los 5 slots canónicos, el inventario y los campos del form", async () => {
    routeApi({
      clothing: () => [
        makeItem({ description: "Remera blanca" }),
        makeItem({ description: "Pantalón azul" }),
      ],
    });

    renderCreate();

    expect(await screen.findByText("Remera blanca")).toBeInTheDocument();
    expect(screen.getByText("Pantalón azul")).toBeInTheDocument();

    for (const slot of OUTFIT_SLOTS) {
      expect(screen.getByTestId(`slot-${slot}`)).toBeInTheDocument();
    }

    // Campos de metadatos + toggle + botón Guardar.
    expect(screen.getByLabelText(/Nombre/)).toBeInTheDocument();
    expect(screen.getByLabelText("Descripción")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Outfit público" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar" })).toBeInTheDocument();

    expect(apiFetchMock).toHaveBeenCalledWith("/clothing");
  });

  it("muestra el estado vacío cuando el armario no tiene prendas", async () => {
    routeApi({ clothing: () => [] });

    renderCreate();

    expect(await screen.findByText("Tu armario está vacío.")).toBeInTheDocument();
    expect(screen.queryByTestId("slot-tops")).not.toBeInTheDocument();
  });

  it("muestra el estado de error cuando el inventario falla", async () => {
    apiFetchMock.mockRejectedValue(new Error("boom"));

    renderCreate();

    expect(
      await screen.findByText("No pudimos cargar tus prendas."),
    ).toBeInTheDocument();
  });

  it("no dispara la request si falta el nombre, y muestra error de validación", async () => {
    const user = userEvent.setup();
    routeApi({ clothing: () => [makeItem({ description: "Remera blanca" })] });

    renderCreate();
    await screen.findByText("Remera blanca");

    // Guardar sin nombre.
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(
      await screen.findByText("Poné un nombre para el outfit."),
    ).toBeInTheDocument();
    // Solo se llamó al GET /clothing; nunca al POST /outfit.
    expect(apiFetchMock).not.toHaveBeenCalledWith(
      "/outfit",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("con nombre pero sin prendas muestra error y no llama al POST", async () => {
    const user = userEvent.setup();
    routeApi({ clothing: () => [makeItem({ description: "Remera blanca" })] });

    renderCreate();
    await screen.findByText("Remera blanca");

    await user.type(screen.getByLabelText(/Nombre/), "Look casual");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(
      await screen.findByText("Agregá al menos una prenda al outfit."),
    ).toBeInTheDocument();
    expect(apiFetchMock).not.toHaveBeenCalledWith(
      "/outfit",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("editar: hace GET /outfit/{id}, precarga campos + slots por category, y Guardar hace PUT con los cambios", async () => {
    const user = userEvent.setup();
    const remera = makeItem({ id: "c-1", description: "Remera blanca" });
    const pantalon = makeItem({ id: "c-2", description: "Pantalón azul" });
    // Los items vienen con category y position; calzado=pos 0, abrigo=pos 1.
    // Hidratar por category (no posicionalmente) ubica cada prenda en su slot.
    const existing = {
      id: "o-1",
      name: "Look viejo",
      description: "desc vieja",
      isPublic: true,
      items: [
        {
          clothingId: "c-1",
          imageUrl: "/uploads/sample.png",
          category: "calzado",
          position: 0,
        },
        {
          clothingId: "c-2",
          imageUrl: "/uploads/sample.png",
          category: "abrigo",
          position: 1,
        },
      ],
      createdAt: "2026-06-06T00:00:00.000Z",
      updatedAt: "2026-06-06T00:00:00.000Z",
    };
    const updated = { ...existing, name: "Look nuevo" };

    routeApi({
      clothing: () => [remera, pantalon],
      getOutfit: () => existing,
      put: () => updated,
    });

    const client = createTestQueryClient();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    renderWithProviders(
      <MemoryRouter initialEntries={["/outfits/o-1/edit"]}>
        <Routes>
          <Route path="/outfits/:id/edit" element={<OutfitBuilderPage />} />
        </Routes>
      </MemoryRouter>,
      { queryClient: client },
    );

    // Encabezado de edición.
    expect(await screen.findByText("Editar outfit")).toBeInTheDocument();

    // Campos precargados (incluido el toggle público desde la response).
    const nameInput = await screen.findByLabelText<HTMLInputElement>(/Nombre/);
    await waitFor(() => expect(nameInput.value).toBe("Look viejo"));
    expect(screen.getByLabelText<HTMLInputElement>("Descripción").value).toBe(
      "desc vieja",
    );
    expect(screen.getByRole("switch", { name: "Outfit público" })).toBeChecked();

    // Slots precargados por category (NO posicional): calzado <- c-1, abrigo <- c-2.
    const calzado = screen.getByTestId("slot-calzado");
    const abrigo = screen.getByTestId("slot-abrigo");
    const tops = screen.getByTestId("slot-tops");
    expect(calzado).toHaveAttribute("data-occupied", "true");
    expect(abrigo).toHaveAttribute("data-occupied", "true");
    // El slot tops queda vacío: la hidratación no es posicional.
    expect(tops).toHaveAttribute("data-occupied", "false");
    expect(within(calzado).getByText("Remera blanca")).toBeInTheDocument();
    expect(within(abrigo).getByText("Pantalón azul")).toBeInTheDocument();

    // Editar el nombre y guardar.
    await user.clear(nameInput);
    await user.type(nameInput, "Look nuevo");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith(
        "/outfit/o-1",
        expect.objectContaining({
          method: "PUT",
          body: {
            name: "Look nuevo",
            description: "desc vieja",
            isPublic: true,
            // items en orden de position (calzado=0, abrigo=1), con category.
            items: [
              { clothingId: "c-1", category: "calzado" },
              { clothingId: "c-2", category: "abrigo" },
            ],
          },
        }),
      );
    });

    // Invalida ['outfits'] y navega.
    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["outfits"] }),
    );
    expect(navigateMock).toHaveBeenCalledWith("/");
  });

  it("editar: el body incluye isPublic e items [{clothingId, category}] (contrato IAN-17)", async () => {
    const user = userEvent.setup();
    const remera = makeItem({ id: "c-1", description: "Remera blanca" });
    const existing = {
      id: "o-2",
      name: "Solo",
      description: "",
      isPublic: false,
      items: [
        {
          clothingId: "c-1",
          imageUrl: "/uploads/sample.png",
          category: "tops",
          position: 0,
        },
      ],
      createdAt: "2026-06-06T00:00:00.000Z",
      updatedAt: "2026-06-06T00:00:00.000Z",
    };
    routeApi({
      clothing: () => [remera],
      getOutfit: () => existing,
      put: () => existing,
    });

    renderEdit("o-2");

    await screen.findByText("Editar outfit");
    await screen.findByDisplayValue("Solo");

    // Activar el toggle público: ahora SÍ va en el body.
    await user.click(screen.getByRole("switch", { name: "Outfit público" }));
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => {
      const putCall = apiFetchMock.mock.calls.find(
        ([path, opts]) => path === "/outfit/o-2" && opts?.method === "PUT",
      );
      expect(putCall).toBeDefined();
      const body = (putCall?.[1] as { body: Record<string, unknown> }).body;
      expect(body).not.toHaveProperty("clothingIds");
      expect(body.isPublic).toBe(true);
      expect(body.items).toEqual([{ clothingId: "c-1", category: "tops" }]);
      expect(Object.keys(body).sort()).toEqual([
        "description",
        "isPublic",
        "items",
        "name",
      ]);
    });
  });

  it("muestra el mensaje de ApiError cuando el guardado falla (400/401)", async () => {
    const user = userEvent.setup();
    const remera = makeItem({ id: "c-1", description: "Remera blanca" });
    const existing = {
      id: "o-3",
      name: "Outfit",
      description: "",
      isPublic: false,
      items: [
        {
          clothingId: "c-1",
          imageUrl: "/uploads/sample.png",
          category: "tops",
          position: 0,
        },
      ],
      createdAt: "2026-06-06T00:00:00.000Z",
      updatedAt: "2026-06-06T00:00:00.000Z",
    };
    apiFetchMock.mockImplementation((path: string, options?: { method?: string }) => {
      const method = options?.method ?? "GET";
      if (path === "/clothing") return Promise.resolve([remera]);
      if (path.startsWith("/outfit/") && method === "GET")
        return Promise.resolve(existing);
      if (path.startsWith("/outfit/") && method === "PUT")
        return Promise.reject(
          new ApiError(400, "One or more clothing items not found"),
        );
      return Promise.resolve(undefined);
    });

    renderEdit("o-3");

    await screen.findByText("Editar outfit");
    await screen.findByDisplayValue("Outfit");

    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(
      await screen.findByText("One or more clothing items not found"),
    ).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("editar: muestra error si el GET del outfit falla", async () => {
    apiFetchMock.mockImplementation((path: string) => {
      if (path === "/clothing") return Promise.resolve([]);
      if (path.startsWith("/outfit/"))
        return Promise.reject(new ApiError(404, "Outfit not found"));
      return Promise.resolve(undefined);
    });

    renderEdit("missing");

    expect(
      await screen.findByText("No pudimos cargar el outfit."),
    ).toBeInTheDocument();
  });
});
