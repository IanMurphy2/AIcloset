/**
 * Listado de outfits del usuario (IAN-20).
 *
 * Ruta protegida `/outfits`. Consume `GET /outfit` vía `useQuery` con la query
 * key `["outfits"]` para que la invalidación que dispara el guardado (IAN-19,
 * en `OutfitBuilderPage`) refresque esta lista automáticamente.
 *
 * Muestra cada outfit como una card con un mini-preview de las imágenes de sus
 * prendas, el nombre, una descripción corta, el conteo de prendas y un badge
 * público/privado. Cada card linkea al detalle `/outfits/:id`. Maneja los
 * estados de carga, error y vacío.
 */

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { Card } from "@/components/ui/card";
import { resolveImageUrl } from "@/features/closet/imageUrl";
import {
  listOutfits,
  type OutfitResponse,
} from "@/features/outfit/outfit-api";

/** Cantidad máxima de miniaturas en el preview de una card. */
const MAX_PREVIEW = 4;
const SKELETON_COUNT = 6;

function PublicBadge({ isPublic }: { isPublic: boolean }) {
  return (
    <span
      className={
        isPublic
          ? "rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
          : "rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
      }
    >
      {isPublic ? "Público" : "Privado"}
    </span>
  );
}

function OutfitCard({ outfit }: { outfit: OutfitResponse }) {
  const items = [...outfit.items].sort((a, b) => a.position - b.position);
  const preview = items.slice(0, MAX_PREVIEW);
  const count = outfit.items.length;

  return (
    <Link
      to={`/outfits/${outfit.id}`}
      className="group rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`Ver outfit ${outfit.name}`}
    >
      <Card className="flex h-full flex-col overflow-hidden transition-shadow group-hover:shadow-md">
        <div className="grid grid-cols-2 gap-px bg-muted">
          {preview.length === 0 ? (
            <div className="col-span-2 flex aspect-[2/1] items-center justify-center bg-muted text-sm text-muted-foreground">
              Sin prendas
            </div>
          ) : (
            preview.map((item) => (
              <div
                key={`${item.clothingId}-${item.position}`}
                className="aspect-square overflow-hidden bg-background"
              >
                <img
                  src={resolveImageUrl(item.imageUrl)}
                  alt={item.category}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
            ))
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold leading-snug">
              {outfit.name}
            </h3>
            <PublicBadge isPublic={outfit.isPublic} />
          </div>
          {outfit.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {outfit.description}
            </p>
          )}
          <p className="mt-auto text-xs text-muted-foreground">
            {count === 1 ? "1 prenda" : `${count} prendas`}
          </p>
        </div>
      </Card>
    </Link>
  );
}

export function OutfitsListPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["outfits"],
    queryFn: listOutfits,
  });

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight">Mis outfits</h2>
        <p className="text-muted-foreground">
          Tus looks guardados. Tocá uno para ver el detalle.
        </p>
      </header>

      {isLoading && (
        <div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          aria-busy="true"
          aria-label="Cargando outfits"
        >
          {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <div
              key={index}
              data-testid="outfit-skeleton"
              className="aspect-[3/2] animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      )}

      {!isLoading && isError && (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center"
        >
          <p className="text-sm font-medium text-destructive">
            No pudimos cargar tus outfits.
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
          <p className="text-base font-medium">Todavía no armaste outfits.</p>
          <p className="text-sm text-muted-foreground">
            Cuando armes uno, aparecerá acá.
          </p>
          <Link
            to="/outfits/new"
            className="mt-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Armar outfit
          </Link>
        </div>
      )}

      {!isLoading && !isError && data && data.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((outfit) => (
            <OutfitCard key={outfit.id} outfit={outfit} />
          ))}
        </div>
      )}
    </section>
  );
}
