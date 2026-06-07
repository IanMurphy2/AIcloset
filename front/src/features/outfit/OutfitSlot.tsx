/**
 * Un slot del outfit: zona donde se suelta una prenda.
 *
 * Es a la vez:
 * - **droppable** (acepta prendas del inventario), vía `useSortable` que ya
 *   registra el nodo como zona de drop.
 * - **sortable** cuando está ocupado: el handle permite reordenar los slots
 *   ocupados (define `position`).
 *
 * Estados visuales:
 * - Vacío: placeholder "soltá una prenda acá".
 * - Ocupado: imagen + descripción de la prenda + botón "Quitar".
 *
 * DECISIÓN DE UX (a revisar, no bloqueante): si el nombre del slot coincide con
 * `clothing.category` (texto libre), se muestra una marca discreta de "calza con
 * la categoría". NO se bloquea soltar por categoría en V1.
 */

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { resolveImageUrl } from "@/features/closet/imageUrl";
import type { ClothingItem } from "@/features/closet/types";
import { SLOT_LABELS, type OutfitSlot as OutfitSlotName } from "@/features/outfit/slots";
import { cn } from "@/lib/utils";

interface OutfitSlotProps {
  slot: OutfitSlotName;
  clothing: ClothingItem | null;
  onRemove: (slot: OutfitSlotName) => void;
}

export function OutfitSlot({ slot, clothing, onRemove }: OutfitSlotProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id: `slot-${slot}`, data: { kind: "slot", slot } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isEmpty = clothing === null;
  // Resaltado opcional (no bloqueante): el slot calza con la categoría libre.
  const matchesCategory =
    clothing?.category != null &&
    clothing.category.trim().toLowerCase() === slot.toLowerCase();

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid={`slot-${slot}`}
      data-occupied={isEmpty ? "false" : "true"}
      aria-label={`Slot ${SLOT_LABELS[slot]}`}
      className={cn(
        "flex flex-col gap-2 rounded-lg border p-3 transition-colors",
        isEmpty ? "border-dashed bg-muted/30" : "bg-card shadow-sm",
        isOver && "border-primary ring-2 ring-primary/40",
        isDragging && "opacity-50",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{SLOT_LABELS[slot]}</span>
        <div className="flex items-center gap-1">
          {matchesCategory && (
            <span
              className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
              title="La categoría de la prenda coincide con este slot"
            >
              calza
            </span>
          )}
          {!isEmpty && (
            <>
              <button
                type="button"
                aria-label={`Reordenar ${SLOT_LABELS[slot]}`}
                className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...attributes}
                {...listeners}
              >
                <GripVertical aria-hidden className="size-4" />
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label={`Quitar ${SLOT_LABELS[slot]}`}
                onClick={() => onRemove(slot)}
              >
                <X aria-hidden className="size-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {isEmpty ? (
        <div className="flex aspect-square w-full items-center justify-center rounded-md text-center text-xs text-muted-foreground">
          Soltá una prenda acá
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <div className="aspect-square w-full overflow-hidden rounded-md bg-muted">
            <img
              src={resolveImageUrl(clothing.imageUrl)}
              alt={clothing.description}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
          <p className="truncate text-xs text-muted-foreground" title={clothing.description}>
            {clothing.description}
          </p>
        </div>
      )}
    </div>
  );
}
