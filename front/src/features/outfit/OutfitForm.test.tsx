import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { useEffect } from "react";

import type { ClothingItem } from "@/features/closet/types";
import { OutfitForm, type OutfitFormValues } from "@/features/outfit/OutfitForm";
import {
  useOutfitBuilder,
  type HydrationItem,
} from "@/features/outfit/useOutfitBuilder";

function makeItem(overrides: Partial<ClothingItem> = {}): ClothingItem {
  return {
    id: crypto.randomUUID(),
    userId: "user-1",
    imageUrl: "/uploads/sample.png",
    description: "Prenda",
    category: "remeras",
    color: "negro",
    createdAt: "2026-06-06T00:00:00.000Z",
    ...overrides,
  };
}

/**
 * Harness que monta `OutfitForm` con un builder controlado, hidratándolo con los
 * items dados (esto reemplaza el drag-and-drop, que jsdom no puede simular).
 */
function Harness({
  clothing,
  hydrateItems,
  onSubmit,
  submitError,
}: {
  clothing: ClothingItem[];
  hydrateItems: HydrationItem[];
  onSubmit: (values: OutfitFormValues) => void;
  submitError?: string | null;
}) {
  const builder = useOutfitBuilder();
  useEffect(() => {
    if (hydrateItems.length > 0) builder.hydrate(hydrateItems);
    // Hidratar una sola vez al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <OutfitForm
      clothing={clothing}
      builder={builder}
      onSubmit={onSubmit}
      submitError={submitError}
    />
  );
}

describe("OutfitForm", () => {
  it("crear: con nombre + items asignados, Guardar entrega { name, description, isPublic, items } en orden de position", async () => {
    const user = userEvent.setup();
    const tops = makeItem({ id: "c-1", description: "Remera" });
    const bottoms = makeItem({ id: "c-2", description: "Pantalón" });
    const onSubmit = vi.fn();

    render(
      <Harness
        clothing={[tops, bottoms]}
        hydrateItems={[
          { slot: "tops", clothing: tops },
          { slot: "bottoms", clothing: bottoms },
        ]}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText(/Nombre/), "Look casual");
    await user.type(screen.getByLabelText("Descripción"), "para el finde");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      name: "Look casual",
      description: "para el finde",
      isPublic: false,
      // items con { clothingId, category } en orden de position.
      items: [
        { clothingId: "c-1", category: "tops" },
        { clothingId: "c-2", category: "bottoms" },
      ],
    });
  });

  it("el toggle público se refleja en isPublic del payload", async () => {
    const user = userEvent.setup();
    const tops = makeItem({ id: "c-1" });
    const onSubmit = vi.fn();

    render(
      <Harness
        clothing={[tops]}
        hydrateItems={[{ slot: "tops", clothing: tops }]}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText(/Nombre/), "Outfit");
    await user.click(screen.getByRole("switch", { name: "Outfit público" }));
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        isPublic: true,
        items: [{ clothingId: "c-1", category: "tops" }],
      }),
    );
  });

  it("sin nombre: no llama onSubmit y muestra error de validación", async () => {
    const user = userEvent.setup();
    const tops = makeItem({ id: "c-1" });
    const onSubmit = vi.fn();

    render(
      <Harness
        clothing={[tops]}
        hydrateItems={[{ slot: "tops", clothing: tops }]}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(
      await screen.findByText("Poné un nombre para el outfit."),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("sin items: no llama onSubmit y muestra error de validación", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <Harness clothing={[makeItem()]} hydrateItems={[]} onSubmit={onSubmit} />,
    );

    await user.type(screen.getByLabelText(/Nombre/), "Outfit");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(
      await screen.findByText("Agregá al menos una prenda al outfit."),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("muestra el submitError de la API", () => {
    render(
      <Harness
        clothing={[makeItem()]}
        hydrateItems={[]}
        onSubmit={vi.fn()}
        submitError="One or more clothing items not found"
      />,
    );

    expect(
      screen.getByText("One or more clothing items not found"),
    ).toBeInTheDocument();
  });

  it("reordenar slots cambia el orden de items en el payload", async () => {
    const user = userEvent.setup();
    const tops = makeItem({ id: "c-1" });
    const bottoms = makeItem({ id: "c-2" });
    const onSubmit = vi.fn();

    function ReorderHarness() {
      const builder = useOutfitBuilder();
      useEffect(() => {
        builder.hydrate([
          { slot: "tops", clothing: tops },
          { slot: "bottoms", clothing: bottoms },
        ]);
        // Invertir el orden (bottoms primero).
        builder.reorder(0, 1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);
      return (
        <OutfitForm clothing={[tops, bottoms]} builder={builder} onSubmit={onSubmit} />
      );
    }

    render(<ReorderHarness />);

    await user.type(screen.getByLabelText(/Nombre/), "Outfit");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [
          { clothingId: "c-2", category: "bottoms" },
          { clothingId: "c-1", category: "tops" },
        ],
      }),
    );
  });
});
