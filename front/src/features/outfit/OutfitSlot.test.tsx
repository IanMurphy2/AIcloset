import { DndContext } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

// `OutfitSlot` usa `resolveImageUrl`, que lee `API_BASE_URL`.
vi.mock("@/lib/api/client", () => ({
  apiFetch: vi.fn(),
  API_BASE_URL: "http://localhost:3000",
}));

import type { ClothingItem } from "@/features/closet/types";
import { OutfitSlot } from "@/features/outfit/OutfitSlot";

function makeItem(overrides: Partial<ClothingItem> = {}): ClothingItem {
  return {
    id: "c1",
    userId: "user-1",
    imageUrl: "/uploads/sample.png",
    description: "Remera blanca",
    category: "tops",
    color: "blanco",
    createdAt: "2026-06-05T00:00:00.000Z",
    ...overrides,
  };
}

/** `useSortable` requiere estar dentro de un DndContext + SortableContext. */
function renderSlot(ui: React.ReactElement) {
  return render(
    <DndContext>
      <SortableContext items={["slot-tops"]}>{ui}</SortableContext>
    </DndContext>,
  );
}

describe("OutfitSlot", () => {
  it("vacío: muestra el placeholder y no muestra botón quitar", () => {
    renderSlot(<OutfitSlot slot="tops" clothing={null} onRemove={() => {}} />);

    expect(screen.getByText("Soltá una prenda acá")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Quitar Tops" }),
    ).not.toBeInTheDocument();
  });

  it("ocupado: muestra la imagen (prefijada) y el botón quitar", () => {
    renderSlot(
      <OutfitSlot
        slot="tops"
        clothing={makeItem({ description: "Remera blanca" })}
        onRemove={() => {}}
      />,
    );

    const img = screen.getByRole("img", { name: "Remera blanca" });
    expect(img).toHaveAttribute("src", "http://localhost:3000/uploads/sample.png");
    expect(
      screen.getByRole("button", { name: "Quitar Tops" }),
    ).toBeInTheDocument();
  });

  it("ocupado: el botón quitar invoca onRemove con el slot", async () => {
    const onRemove = vi.fn();
    renderSlot(<OutfitSlot slot="tops" clothing={makeItem()} onRemove={onRemove} />);

    await userEvent.click(screen.getByRole("button", { name: "Quitar Tops" }));
    expect(onRemove).toHaveBeenCalledWith("tops");
  });

  it("resalta cuando la categoría libre de la prenda coincide con el slot (no bloqueante)", () => {
    renderSlot(
      <OutfitSlot
        slot="tops"
        clothing={makeItem({ category: "TOPS" })}
        onRemove={() => {}}
      />,
    );
    expect(screen.getByText("calza")).toBeInTheDocument();
  });

  it("no resalta cuando la categoría no coincide", () => {
    renderSlot(
      <OutfitSlot
        slot="tops"
        clothing={makeItem({ category: "pantalones" })}
        onRemove={() => {}}
      />,
    );
    expect(screen.queryByText("calza")).not.toBeInTheDocument();
  });
});
