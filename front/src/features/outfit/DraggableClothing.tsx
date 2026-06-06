/**
 * Prenda del inventario arrastrable hacia un slot del outfit.
 *
 * Envuelve `ClothingCard` con `useDraggable` de dnd-kit. El `id` del draggable
 * es el `id` de la prenda y `data` lleva la prenda completa para que el
 * `DndContext` (en `OutfitBuilder`) pueda recuperarla al soltar.
 */

import { useDraggable } from "@dnd-kit/core";

import { ClothingCard } from "@/features/closet/ClothingCard";
import type { ClothingItem } from "@/features/closet/types";
import { cn } from "@/lib/utils";

/** Payload que viaja en el `active.data.current` de un drag de prenda. */
export interface ClothingDragData {
  kind: "clothing";
  clothing: ClothingItem;
}

interface DraggableClothingProps {
  item: ClothingItem;
}

export function DraggableClothing({ item }: DraggableClothingProps) {
  const data: ClothingDragData = { kind: "clothing", clothing: item };
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `clothing-${item.id}`,
    data,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      data-testid={`draggable-${item.id}`}
      aria-roledescription="Prenda arrastrable"
      className={cn(
        "cursor-grab touch-none rounded-lg transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isDragging && "opacity-40",
      )}
    >
      <ClothingCard item={item} />
    </div>
  );
}
