export const OUTFIT_SLOTS = ['tops', 'bottoms', 'calzado', 'abrigo', 'accesorios'] as const;

export type OutfitSlot = typeof OUTFIT_SLOTS[number];

export function isValidSlot(c: string): c is OutfitSlot {
  return (OUTFIT_SLOTS as readonly string[]).includes(c);
}
