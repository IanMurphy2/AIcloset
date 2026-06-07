/**
 * Slots canónicos de un outfit.
 *
 * Réplica en el front de la constante del backend (`lib/constants/outfitSlots.ts`,
 * definida en IAN-17): un outfit se compone de hasta una prenda por cada uno de
 * estos slots. El orden de la lista es el orden visual por defecto de los slots.
 *
 * IMPORTANTE: mantener sincronizado con el backend. Si el backend agrega/quita
 * slots, esta lista debe actualizarse.
 */

/** Los cinco slots canónicos, en orden de presentación. */
export const OUTFIT_SLOTS = [
  "tops",
  "bottoms",
  "calzado",
  "abrigo",
  "accesorios",
] as const;

/** Un slot canónico de outfit. */
export type OutfitSlot = (typeof OUTFIT_SLOTS)[number];

/** Etiquetas legibles para mostrar cada slot en la UI. */
export const SLOT_LABELS: Record<OutfitSlot, string> = {
  tops: "Tops",
  bottoms: "Bottoms",
  calzado: "Calzado",
  abrigo: "Abrigo",
  accesorios: "Accesorios",
};

/** Type guard: ¿`value` es un slot canónico? */
export function isOutfitSlot(value: string): value is OutfitSlot {
  return (OUTFIT_SLOTS as readonly string[]).includes(value);
}
