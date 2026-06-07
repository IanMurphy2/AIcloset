/**
 * Detalle de un outfit (IAN-20).
 *
 * Ruta protegida `/outfits/:id`. Consume `GET /outfit/{id}` y renderiza los
 * slots (las prendas por categoría) en orden de `position`, usando
 * `SLOT_LABELS` para los títulos y `resolveImageUrl` para las imágenes, junto
 * con el nombre, la descripción y el estado `isPublic` del outfit. Ofrece un
 * link a editar (`/outfits/:id/edit`).
 *
 * El 404 (outfit inexistente o ajeno) se traduce a un mensaje de "no
 * encontrado"; el resto de los errores muestran un mensaje genérico con
 * reintento.
 */

import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { resolveImageUrl } from "@/features/closet/imageUrl";
import {
  getOutfit,
  type OutfitResponseItem,
} from "@/features/outfit/outfit-api";
import { SLOT_LABELS } from "@/features/outfit/slots";
import { ApiError } from "@/lib/api/client";

function SlotCard({ item }: { item: OutfitResponseItem }) {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-square w-full overflow-hidden bg-muted">
        <img
          src={resolveImageUrl(item.imageUrl)}
          alt={SLOT_LABELS[item.category]}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>
      <CardContent className="p-3">
        <p className="text-sm font-medium">{SLOT_LABELS[item.category]}</p>
      </CardContent>
    </Card>
  );
}

export function OutfitDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["outfit", id] as const,
    queryFn: () => getOutfit(id as string),
    enabled: Boolean(id),
  });

  const isNotFound = error instanceof ApiError && error.status === 404;

  if (isLoading) {
    return (
      <section className="flex flex-col gap-6" aria-busy="true" aria-label="Cargando outfit">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              data-testid="outfit-detail-skeleton"
              className="aspect-square animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className="flex flex-col gap-4">
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center"
        >
          <p className="text-sm font-medium text-destructive">
            {isNotFound
              ? "No encontramos este outfit."
              : "No pudimos cargar el outfit."}
          </p>
          {isNotFound ? (
            <Link
              to="/outfits"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Volver a mis outfits
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                void refetch();
              }}
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Reintentar
            </button>
          )}
        </div>
      </section>
    );
  }

  const items = [...data.items].sort((a, b) => a.position - b.position);

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-semibold tracking-tight">
                {data.name}
              </h2>
              <span
                className={
                  data.isPublic
                    ? "rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                    : "rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                }
              >
                {data.isPublic ? "Público" : "Privado"}
              </span>
            </div>
            {data.description && (
              <p className="text-muted-foreground">{data.description}</p>
            )}
          </div>
          <Link
            to={`/outfits/${data.id}/edit`}
            className="shrink-0 rounded-md border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Editar
          </Link>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-12 text-center">
          <p className="text-base font-medium">Este outfit no tiene prendas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <SlotCard key={`${item.clothingId}-${item.position}`} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
