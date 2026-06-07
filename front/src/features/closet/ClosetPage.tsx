/**
 * Inventario (closet): listado de prendas del usuario con filtros.
 *
 * Ruta protegida raíz. Consume `GET /clothing` vía `useClothing` y permite
 * filtrar por categoría y color. Maneja los estados de carga, error y vacío.
 */

import { useState } from "react";

import { ClothingFilters } from "@/features/closet/ClothingFilters";
import { ClothingGrid } from "@/features/closet/ClothingGrid";
import { useClothing } from "@/features/closet/useClothing";
import type { ClothingFilters as Filters } from "@/features/closet/types";

export function ClosetPage() {
  const [filters, setFilters] = useState<Filters>({});
  const { data, isLoading, isError, refetch } = useClothing(filters);

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight">Mi armario</h2>
        <p className="text-muted-foreground">
          Tus prendas. Filtrá por categoría o color.
        </p>
      </header>

      <ClothingFilters value={filters} onChange={setFilters} />

      <ClothingGrid
        items={data}
        isLoading={isLoading}
        isError={isError}
        filters={filters}
        onRetry={() => {
          void refetch();
        }}
      />
    </section>
  );
}
