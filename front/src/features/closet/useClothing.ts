/**
 * Hook de datos del inventario.
 *
 * Envuelve `GET /clothing` con TanStack Query. La query key incluye los filtros
 * (`['clothing', filters]`) para que un cambio de filtro dispare un refetch con
 * los query params correspondientes. El querystring se arma solo con los
 * filtros no vacíos.
 */

import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api/client";
import type { ClothingFilters, ClothingItem } from "@/features/closet/types";

/** Normaliza los filtros descartando los valores vacíos / solo-espacios. */
function normalizeFilters(filters: ClothingFilters): ClothingFilters {
  const normalized: ClothingFilters = {};
  const category = filters.category?.trim();
  const color = filters.color?.trim();
  if (category) normalized.category = category;
  if (color) normalized.color = color;
  return normalized;
}

/** Construye `/clothing` con los query params no vacíos. */
export function buildClothingPath(filters: ClothingFilters): string {
  const normalized = normalizeFilters(filters);
  const params = new URLSearchParams();
  if (normalized.category) params.set("category", normalized.category);
  if (normalized.color) params.set("color", normalized.color);
  const qs = params.toString();
  return qs ? `/clothing?${qs}` : "/clothing";
}

export function useClothing(filters: ClothingFilters) {
  const normalized = normalizeFilters(filters);
  return useQuery({
    // La key incluye los filtros normalizados: cambiar un filtro = nueva query.
    queryKey: ["clothing", normalized] as const,
    queryFn: () => apiFetch<ClothingItem[]>(buildClothingPath(normalized)),
  });
}
