/**
 * Página del armador de outfits (`/outfits/new`).
 *
 * Lista las prendas del usuario (reusa `useClothing`) y monta el `OutfitBuilder`
 * para arrastrarlas a los slots canónicos. Maneja los estados de carga, error y
 * armario vacío.
 *
 * El guardado (`POST /outfit`) es IAN-19: acá solo se mantiene el outfit en
 * memoria. Para hacer visible el contrato que IAN-19 va a consumir, se muestra
 * un resumen del outfit en construcción (cantidad de prendas / items).
 */

import { useState } from "react";

import { useClothing } from "@/features/closet/useClothing";
import { OutfitBuilder } from "@/features/outfit/OutfitBuilder";
import type { OutfitItem } from "@/features/outfit/types";

export function OutfitBuilderPage() {
  const { data, isLoading, isError, refetch } = useClothing({});
  // Outfit en construcción expuesto por el builder; lo guardará IAN-19.
  const [items, setItems] = useState<OutfitItem[]>([]);

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight">Armar outfit</h2>
        <p className="text-muted-foreground">
          Arrastrá prendas de tu armario a cada slot. Una prenda por slot; podés
          quitar o reordenar las asignadas.
        </p>
      </header>

      {isLoading && (
        <div
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
          aria-busy="true"
          aria-label="Cargando prendas"
        >
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              data-testid="clothing-skeleton"
              className="aspect-square animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      )}

      {isError && (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center"
        >
          <p className="text-sm font-medium text-destructive">
            No pudimos cargar tus prendas.
          </p>
          <button
            type="button"
            onClick={() => {
              void refetch();
            }}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {!isLoading && !isError && (!data || data.length === 0) && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-12 text-center">
          <p className="text-base font-medium">Tu armario está vacío.</p>
          <p className="text-sm text-muted-foreground">
            Agregá prendas para poder armar un outfit.
          </p>
        </div>
      )}

      {!isLoading && !isError && data && data.length > 0 && (
        <>
          <p
            className="text-sm text-muted-foreground"
            data-testid="outfit-summary"
            aria-live="polite"
          >
            {items.length === 0
              ? "Sin prendas en el outfit todavía."
              : `Outfit en construcción: ${items.length} ${items.length === 1 ? "prenda" : "prendas"}.`}
          </p>
          <OutfitBuilder clothing={data} onItemsChange={setItems} />
        </>
      )}
    </section>
  );
}
