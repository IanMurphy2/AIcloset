/**
 * Vista de detalle de una prenda (IAN-16).
 *
 * Se monta en `/closet/:id`. Trae la prenda con `GET /clothing/{id}` vía
 * TanStack Query y la renderiza con imagen grande + metadatos (descripción,
 * categoría/color como chips, fecha de alta). Ofrece links a editar
 * (`/closet/:id/edit`) y a volver al listado.
 *
 * Reusa la query key `['clothing-detail', id]` que ya usa `EditClothingForm`,
 * de modo que ambos comparten caché. Esa key vive fuera del namespace
 * `['clothing']` a propósito: invalidar el listado no dispara un refetch del
 * detalle.
 *
 * Maneja tres estados de borde: loading, 404 (la prenda no existe o no es del
 * usuario) y error genérico de red.
 */

import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Pencil } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ApiError, apiFetch } from "@/lib/api/client";
import { resolveImageUrl } from "@/features/closet/imageUrl";
import type { ClothingItem } from "@/features/closet/types";

/** Formatea la fecha ISO de alta a un formato legible (es-AR). */
function formatCreatedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function ClothingDetailPage() {
  const { id = "" } = useParams<{ id: string }>();

  const query = useQuery({
    queryKey: ["clothing-detail", id],
    queryFn: () => apiFetch<ClothingItem>(`/clothing/${id}`),
    enabled: Boolean(id),
  });

  if (query.isLoading) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <p className="text-muted-foreground" aria-busy="true">
          Cargando prenda…
        </p>
      </section>
    );
  }

  // 404: la prenda no existe o no es del usuario.
  if (query.isError && query.error instanceof ApiError && query.error.status === 404) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 rounded-lg border border-dashed p-12 text-center">
        <p className="text-base font-medium">No encontramos esta prenda.</p>
        <p className="text-sm text-muted-foreground">
          Puede que ya no exista o que no forme parte de tu armario.
        </p>
        <Link to="/" className={cn(buttonVariants({ variant: "outline" }))}>
          <ArrowLeft aria-hidden="true" />
          Volver al armario
        </Link>
      </section>
    );
  }

  // Error genérico de red.
  if (query.isError || !query.data) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-3">
        <p role="alert" className="text-sm font-medium text-destructive">
          No pudimos cargar la prenda. Intentá de nuevo.
        </p>
        <Link
          to="/"
          className={cn(buttonVariants({ variant: "outline" }), "self-start")}
        >
          <ArrowLeft aria-hidden="true" />
          Volver al armario
        </Link>
      </section>
    );
  }

  const item = query.data;

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver al armario
        </Link>
      </div>

      <Card className="overflow-hidden">
        <div className="grid gap-0 md:grid-cols-2">
          <div className="aspect-square w-full overflow-hidden bg-muted">
            <img
              src={resolveImageUrl(item.imageUrl)}
              alt={item.description}
              className="h-full w-full object-cover"
            />
          </div>

          <CardContent className="flex flex-col gap-5 p-6">
            <header className="flex flex-col gap-2">
              <h2 className="text-2xl font-semibold leading-tight tracking-tight">
                {item.description}
              </h2>
              {(item.category || item.color) && (
                <div className="flex flex-wrap gap-1.5">
                  {item.category && (
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                      {item.category}
                    </span>
                  )}
                  {item.color && (
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {item.color}
                    </span>
                  )}
                </div>
              )}
            </header>

            <dl className="flex flex-col gap-3 text-sm">
              <div className="flex flex-col gap-0.5">
                <dt className="font-medium text-muted-foreground">Categoría</dt>
                <dd>{item.category || "Sin categoría"}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="font-medium text-muted-foreground">Color</dt>
                <dd>{item.color || "Sin color"}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="font-medium text-muted-foreground">
                  Agregada el
                </dt>
                <dd>{formatCreatedAt(item.createdAt)}</dd>
              </div>
            </dl>

            <div className="mt-auto flex gap-2 pt-2">
              <Link
                to={`/closet/${item.id}/edit`}
                className={cn(buttonVariants({ variant: "default" }))}
              >
                <Pencil aria-hidden="true" />
                Editar
              </Link>
            </div>
          </CardContent>
        </div>
      </Card>
    </section>
  );
}
