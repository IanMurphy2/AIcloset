import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock de la capa de red. Conservamos `ApiError` y `API_BASE_URL`
// (el card los usa para mensajes y para resolver la imagen).
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

import { ClothingCard } from "@/features/closet/ClothingCard";
import type { ClothingItem } from "@/features/closet/types";
import { renderWithProviders } from "@/test/renderWithProviders";

const ITEM: ClothingItem = {
  id: "c1",
  userId: "u1",
  imageUrl: "/uploads/abc.png",
  description: "Remera blanca",
  category: "remeras",
  color: "blanco",
  createdAt: "2026-06-06T00:00:00.000Z",
};

describe("ClothingCard — acciones editar / eliminar", () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("la imagen y el título enlazan al detalle (/closet/:id)", () => {
    renderWithProviders(<ClothingCard item={ITEM} />, { withRouter: true });

    // Imagen enlazada al detalle.
    const imageLink = screen.getByRole("link", {
      name: "Ver detalle de Remera blanca",
    });
    expect(imageLink).toHaveAttribute("href", "/closet/c1");

    // El título también enlaza al detalle (no al editar).
    const titleLink = screen.getByRole("link", { name: "Remera blanca" });
    expect(titleLink).toHaveAttribute("href", "/closet/c1");
  });

  it("los botones Editar/Eliminar apuntan a sus rutas y NO al detalle", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ClothingCard item={ITEM} />, { withRouter: true });

    // Editar apunta a /closet/:id/edit (no al detalle /closet/:id).
    const edit = screen.getByRole("link", { name: "Editar Remera blanca" });
    expect(edit).toHaveAttribute("href", "/closet/c1/edit");

    // Eliminar es un botón: abre la confirmación, no navega.
    await user.click(
      screen.getByRole("button", { name: "Eliminar Remera blanca" }),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("ofrece un link de editar hacia /closet/:id/edit con label accesible", () => {
    renderWithProviders(<ClothingCard item={ITEM} />, { withRouter: true });

    const edit = screen.getByRole("link", { name: "Editar Remera blanca" });
    expect(edit).toHaveAttribute("href", "/closet/c1/edit");
  });

  it("al click en eliminar abre la confirmación; cancelar NO llama a la API", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ClothingCard item={ITEM} />, { withRouter: true });

    expect(screen.queryByRole("dialog")).toBeNull();

    await user.click(
      screen.getByRole("button", { name: "Eliminar Remera blanca" }),
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it("al confirmar llama DELETE /clothing/{id} e invalida ['clothing']", async () => {
    apiFetchMock.mockResolvedValueOnce(null);

    const user = userEvent.setup();
    const { client } = renderWithProviders(<ClothingCard item={ITEM} />, {
      withRouter: true,
    });
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    await user.click(
      screen.getByRole("button", { name: "Eliminar Remera blanca" }),
    );
    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));

    const [path, opts] = apiFetchMock.mock.calls[0];
    expect(path).toBe("/clothing/c1");
    expect(opts.method).toBe("DELETE");

    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["clothing"] }),
    );

    // El diálogo se cierra al completar el borrado.
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("muestra un mensaje de error si el DELETE falla y mantiene el diálogo", async () => {
    const { ApiError } = await vi.importActual<
      typeof import("@/lib/api/client")
    >("@/lib/api/client");
    apiFetchMock.mockRejectedValueOnce(
      new ApiError(404, "Clothing item not found"),
    );

    const user = userEvent.setup();
    renderWithProviders(<ClothingCard item={ITEM} />, { withRouter: true });

    await user.click(
      screen.getByRole("button", { name: "Eliminar Remera blanca" }),
    );
    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    expect(
      await screen.findByText("Clothing item not found"),
    ).toBeInTheDocument();
    // El diálogo sigue abierto para reintentar o cancelar.
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
