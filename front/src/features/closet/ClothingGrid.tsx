/**
 * Grilla responsiva de prendas con sus estados (loading / error / vacío).
 */

import { ClothingCard } from "@/features/closet/ClothingCard";
import type { ClothingFilters, ClothingItem } from "@/features/closet/types";

interface ClothingGridProps {
  items: ClothingItem[] | undefined;
  isLoading: boolean;
  isError: boolean;
  /** Filtros activos: distinguen "sin prendas" de "sin resultados". */
  filters: ClothingFilters;
  onRetry: () => void;
}

const SKELETON_COUNT = 8;

function hasActiveFilters(filters: ClothingFilters): boolean {
  return Boolean(filters.category?.trim() || filters.color?.trim());
}

export function ClothingGrid({
  items,
  isLoading,
  isError,
  filters,
  onRetry,
}: ClothingGridProps) {
  if (isLoading) {
    return (
      <div
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
        aria-busy="true"
        aria-label="Cargando prendas"
      >
        {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
          <div
            key={index}
            data-testid="clothing-skeleton"
            className="aspect-square animate-pulse rounded-lg bg-muted"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center"
      >
        <p className="text-sm font-medium text-destructive">
          No pudimos cargar tus prendas.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!items || items.length === 0) {
    const filtered = hasActiveFilters(filters);
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-12 text-center">
        <p className="text-base font-medium">
          {filtered
            ? "No hay prendas que coincidan con los filtros."
            : "Tu armario está vacío."}
        </p>
        <p className="text-sm text-muted-foreground">
          {filtered
            ? "Probá ajustar o limpiar los filtros."
            : "Cuando agregues prendas, aparecerán acá."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <ClothingCard key={item.id} item={item} />
      ))}
    </div>
  );
}
