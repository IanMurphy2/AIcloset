/**
 * Tipos del dominio de outfit (builder en memoria).
 *
 * Contrato definido por IAN-17 (backend): un outfit se compone de `items`, cada
 * uno `{ clothingId, category, position }`, con una sola prenda por
 * slot/categoría y orden estable por `position`. El guardado real es IAN-19;
 * acá solo se construye el estado en memoria y se expone vía `toItems()`.
 */

import type { OutfitSlot } from "@/features/outfit/slots";

/**
 * Item de un outfit tal como lo espera el backend (IAN-17 / IAN-19).
 *
 * `category` es el slot canónico al que se asignó la prenda. Es el slot quien
 * define la categoría del item (ver decisión de UX en `useOutfitBuilder`), no
 * `clothing.category` (que es texto libre).
 */
export interface OutfitItem {
  clothingId: string;
  category: OutfitSlot;
  /** Orden estable dentro del outfit. Arranca en 0 y es contiguo. */
  position: number;
}
