/**
 * Estado del outfit builder (puro / testeable).
 *
 * Mantiene en memoria qué prenda está asignada a cada slot canónico y el orden
 * (`position`) de los slots ocupados. La lógica vive en un reducer puro
 * (`outfitReducer`) más selectores puros, de modo que se puede testear sin
 * simular el drag nativo de HTML5 (que jsdom no soporta bien). El hook
 * `useOutfitBuilder` solo envuelve el reducer con `useReducer` y memoiza las
 * acciones.
 *
 * Reglas (contrato IAN-17):
 * - Una prenda por slot. `assign` sobre un slot ocupado reemplaza la anterior.
 * - El orden de los slots ocupados define `position` (0..n-1, contiguo).
 * - Al asignar un slot por primera vez se agrega al final del orden; al quitarlo
 *   se saca del orden (las posiciones se recalculan de forma contigua).
 *
 * DECISIÓN DE UX (a revisar): `clothing.category` es texto libre y puede no
 * coincidir con los slots canónicos, así que NO se valida la categoría: cualquier
 * prenda puede ir a cualquier slot y es el slot quien define `OutfitItem.category`.
 * Ver `OutfitSlot.tsx` para el resaltado opcional (no bloqueante) por coincidencia.
 */

import { useCallback, useMemo, useReducer } from "react";

import type { ClothingItem } from "@/features/closet/types";
import { OUTFIT_SLOTS, type OutfitSlot } from "@/features/outfit/slots";
import type { OutfitItem } from "@/features/outfit/types";

/**
 * Estado interno del builder.
 *
 * - `assignments`: prenda asignada a cada slot (o `null` si está vacío).
 * - `order`: slots ocupados en orden; determina `position`. Un slot vacío no
 *   aparece en `order`.
 */
export interface OutfitBuilderState {
  assignments: Record<OutfitSlot, ClothingItem | null>;
  order: OutfitSlot[];
}

export type OutfitBuilderAction =
  | { type: "assign"; slot: OutfitSlot; clothing: ClothingItem }
  | { type: "remove"; slot: OutfitSlot }
  | { type: "reorder"; from: number; to: number }
  | { type: "reset" };

/** Estado inicial: todos los slots vacíos, sin orden. */
export function createInitialState(): OutfitBuilderState {
  const assignments = Object.fromEntries(
    OUTFIT_SLOTS.map((slot) => [slot, null]),
  ) as Record<OutfitSlot, ClothingItem | null>;
  return { assignments, order: [] };
}

/** Mueve el elemento `from` a la posición `to` en un array nuevo. */
function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  if (moved === undefined) return [...items];
  next.splice(to, 0, moved);
  return next;
}

/** Reducer puro del builder. */
export function outfitReducer(
  state: OutfitBuilderState,
  action: OutfitBuilderAction,
): OutfitBuilderState {
  switch (action.type) {
    case "assign": {
      const wasEmpty = state.assignments[action.slot] === null;
      return {
        assignments: { ...state.assignments, [action.slot]: action.clothing },
        // Si el slot ya estaba ocupado, conserva su posición (solo reemplaza la
        // prenda). Si estaba vacío, lo agrega al final del orden.
        order: wasEmpty ? [...state.order, action.slot] : state.order,
      };
    }

    case "remove": {
      if (state.assignments[action.slot] === null) return state;
      return {
        assignments: { ...state.assignments, [action.slot]: null },
        order: state.order.filter((slot) => slot !== action.slot),
      };
    }

    case "reorder": {
      const { from, to } = action;
      if (
        from === to ||
        from < 0 ||
        to < 0 ||
        from >= state.order.length ||
        to >= state.order.length
      ) {
        return state;
      }
      return { ...state, order: moveItem(state.order, from, to) };
    }

    case "reset":
      return createInitialState();

    default:
      return state;
  }
}

/**
 * Proyecta el estado al contrato del backend: items con `position` contigua
 * (según `order`), una sola prenda por categoría/slot.
 */
export function selectItems(state: OutfitBuilderState): OutfitItem[] {
  return state.order.map((slot, index) => {
    const clothing = state.assignments[slot];
    // Invariante: todo slot en `order` tiene una prenda asignada.
    if (!clothing) {
      throw new Error(`Slot "${slot}" en order sin prenda asignada`);
    }
    return { clothingId: clothing.id, category: slot, position: index };
  });
}

/** API pública del hook. */
export interface OutfitBuilderApi {
  /** Estado en bruto (útil para la UI). */
  state: OutfitBuilderState;
  /** Asigna una prenda a un slot (reemplaza si ya había una). */
  assign: (slot: OutfitSlot, clothing: ClothingItem) => void;
  /** Vacía un slot. */
  remove: (slot: OutfitSlot) => void;
  /** Reordena los slots ocupados (índices dentro de `order`). */
  reorder: (from: number, to: number) => void;
  /** Vacía todo el outfit. */
  reset: () => void;
  /**
   * Outfit en construcción listo para IAN-19: `{ clothingId, category,
   * position }[]`, ordenado por `position`.
   */
  toItems: () => OutfitItem[];
}

export function useOutfitBuilder(): OutfitBuilderApi {
  const [state, dispatch] = useReducer(outfitReducer, undefined, createInitialState);

  const assign = useCallback(
    (slot: OutfitSlot, clothing: ClothingItem) =>
      dispatch({ type: "assign", slot, clothing }),
    [],
  );
  const remove = useCallback(
    (slot: OutfitSlot) => dispatch({ type: "remove", slot }),
    [],
  );
  const reorder = useCallback(
    (from: number, to: number) => dispatch({ type: "reorder", from, to }),
    [],
  );
  const reset = useCallback(() => dispatch({ type: "reset" }), []);
  const toItems = useCallback(() => selectItems(state), [state]);

  return useMemo(
    () => ({ state, assign, remove, reorder, reset, toItems }),
    [state, assign, remove, reorder, reset, toItems],
  );
}
