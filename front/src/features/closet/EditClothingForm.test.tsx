import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// Mock de la capa de red. Conservamos `ApiError` (el form lo usa para mensajes).
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

// Mock del navigate de react-router para inspeccionar la redirección.
const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

import { EditClothingForm } from "@/features/closet/EditClothingForm";
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

/** Renderiza el form bajo una ruta `/closet/:id/edit` con el id provisto. */
function renderEdit(id: string, client = createTestQueryClient()) {
  return renderWithProviders(
    <MemoryRouter initialEntries={[`/closet/${id}/edit`]}>
      <Routes>
        <Route path="/closet/:id/edit" element={<EditClothingForm />} />
      </Routes>
    </MemoryRouter>,
    { queryClient: client },
  );
}

describe("EditClothingForm", () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
    navigateMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("precarga los valores actuales desde la caché de ['clothing'] (sin fetch)", async () => {
    const client = createTestQueryClient();
    client.setQueryData(["clothing", {}], [ITEM]);

    renderEdit("c1", client);

    expect(await screen.findByLabelText("Descripción")).toHaveValue(
      "Remera blanca",
    );
    expect(screen.getByLabelText("Categoría")).toHaveValue("remeras");
    expect(screen.getByLabelText("Color")).toHaveValue("blanco");
    // Estaba en caché: no hace falta pegarle al backend.
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it("hace GET /clothing/{id} cuando la prenda no está en caché", async () => {
    apiFetchMock.mockResolvedValueOnce(ITEM);

    renderEdit("c1");

    expect(await screen.findByLabelText("Descripción")).toHaveValue(
      "Remera blanca",
    );
    expect(apiFetchMock).toHaveBeenCalledWith("/clothing/c1");
  });

  it("al enviar llama PUT /clothing/{id} con los cambios e invalida ['clothing']", async () => {
    const client = createTestQueryClient();
    client.setQueryData(["clothing", {}], [ITEM]);
    apiFetchMock.mockResolvedValueOnce({ ...ITEM, description: "Remera negra" });

    const invalidateSpy = vi.spyOn(client, "invalidateQueries");
    const user = userEvent.setup();
    renderEdit("c1", client);

    const description = await screen.findByLabelText("Descripción");
    await user.clear(description);
    await user.type(description, "Remera negra");

    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));

    const [path, opts] = apiFetchMock.mock.calls[0];
    expect(path).toBe("/clothing/c1");
    expect(opts.method).toBe("PUT");
    expect(opts.body).toEqual({
      description: "Remera negra",
      category: "remeras",
      color: "blanco",
    });

    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["clothing"] }),
    );
    expect(navigateMock).toHaveBeenCalledWith("/");
  });

  it("muestra un mensaje de error si el PUT falla y no redirige", async () => {
    const { ApiError } = await vi.importActual<
      typeof import("@/lib/api/client")
    >("@/lib/api/client");

    const client = createTestQueryClient();
    client.setQueryData(["clothing", {}], [ITEM]);
    apiFetchMock.mockRejectedValueOnce(new ApiError(404, "Clothing item not found"));

    const user = userEvent.setup();
    renderEdit("c1", client);

    await screen.findByLabelText("Descripción");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(
      await screen.findByText("Clothing item not found"),
    ).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
