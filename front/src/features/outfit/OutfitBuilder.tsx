/**
 * Orquestador del outfit builder con dnd-kit.
 *
 * Layout en dos columnas: a la izquierda los slots del outfit (zonas de drop +
 * reordenables), a la derecha el inventario de prendas arrastrables.
 *
 * Maneja dos tipos de drag dentro de un único `DndContext`:
 * 1. Prenda del inventario -> slot: asigna (reemplaza si el slot estaba ocupado).
 *    El item arrastrado lleva `data.kind === "clothing"`; el destino, un slot.
 * 2. Slot ocupado -> otro slot: reordena (define `position`). Ambos extremos
 *    llevan `data.kind === "slot"`; se traduce a índices dentro de `order`.
 *
 * El estado vive en `useOutfitBuilder` (reducer puro). Esta capa solo traduce
 * eventos de dnd-kit a acciones del hook. El outfit en construcción se expone
 * vía `onItemsChange` (para IAN-19) sin guardarlo todavía.
 */

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { useEffect, useState } from "react";

import { ClothingCard } from "@/features/closet/ClothingCard";
import type { ClothingItem } from "@/features/closet/types";
import {
  DraggableClothing,
  type ClothingDragData,
} from "@/features/outfit/DraggableClothing";
import { OutfitSlot } from "@/features/outfit/OutfitSlot";
import { OUTFIT_SLOTS, isOutfitSlot } from "@/features/outfit/slots";
import type { OutfitItem } from "@/features/outfit/types";
import { useOutfitBuilder } from "@/features/outfit/useOutfitBuilder";

interface OutfitBuilderProps {
  /** Prendas del inventario disponibles para arrastrar. */
  clothing: ClothingItem[];
  /**
   * Se invoca con el outfit en construcción cada vez que cambia. Lo consume
   * IAN-19 para guardar (`POST /outfit`). Acá no se guarda.
   */
  onItemsChange?: (items: OutfitItem[]) => void;
}

/** Quita el prefijo `slot-` de un id de sortable y valida que sea un slot. */
function slotFromSortableId(id: string) {
  const raw = id.startsWith("slot-") ? id.slice("slot-".length) : id;
  return isOutfitSlot(raw) ? raw : null;
}

export function OutfitBuilder({ clothing, onItemsChange }: OutfitBuilderProps) {
  const { state, assign, remove, reorder, toItems } = useOutfitBuilder();
  const [activeClothing, setActiveClothing] = useState<ClothingItem | null>(null);

  // Notifica el outfit en construcción hacia arriba (IAN-19) en cada cambio.
  useEffect(() => {
    onItemsChange?.(toItems());
  }, [state, toItems, onItemsChange]);

  // Pequeña distancia de activación: evita disparar drag en un click simple
  // (p.ej. el botón "Quitar").
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as
      | ClothingDragData
      | { kind: "slot" }
      | undefined;
    if (data?.kind === "clothing") {
      setActiveClothing(data.clothing);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveClothing(null);
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current as
      | ClothingDragData
      | { kind: "slot" }
      | undefined;

    // Caso 1: prenda del inventario soltada sobre un slot.
    if (activeData?.kind === "clothing") {
      const slot = slotFromSortableId(String(over.id));
      if (slot) assign(slot, activeData.clothing);
      return;
    }

    // Caso 2: reordenar slots ocupados.
    if (activeData?.kind === "slot") {
      const fromSlot = slotFromSortableId(String(active.id));
      const toSlot = slotFromSortableId(String(over.id));
      if (!fromSlot || !toSlot || fromSlot === toSlot) return;
      const from = state.order.indexOf(fromSlot);
      const to = state.order.indexOf(toSlot);
      if (from !== -1 && to !== -1) reorder(from, to);
    }
  }

  // Los sortable ids siguen el orden visual (todos los slots, ocupados o no).
  const sortableIds = OUTFIT_SLOTS.map((slot) => `slot-${slot}`);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(280px,340px)_1fr]">
        {/* Columna de slots del outfit */}
        <section aria-label="Outfit en construcción" className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Tu outfit
          </h3>
          <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {OUTFIT_SLOTS.map((slot) => (
                <OutfitSlot
                  key={slot}
                  slot={slot}
                  clothing={state.assignments[slot]}
                  onRemove={remove}
                />
              ))}
            </div>
          </SortableContext>
        </section>

        {/* Columna de inventario arrastrable */}
        <section aria-label="Inventario" className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Tus prendas
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {clothing.map((item) => (
              <DraggableClothing key={item.id} item={item} />
            ))}
          </div>
        </section>
      </div>

      <DragOverlay>
        {activeClothing ? (
          <div className="w-40 rotate-3 opacity-90">
            <ClothingCard item={activeClothing} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
