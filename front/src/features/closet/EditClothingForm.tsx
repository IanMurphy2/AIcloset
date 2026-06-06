/**
 * Formulario de edición de prenda (IAN-15).
 *
 * Se monta en `/closet/:id/edit`. Precarga los datos actuales de la prenda y al
 * enviar persiste los cambios vía `PUT /clothing/{id}` (`useMutation`). En éxito
 * invalida `['clothing']` (para refrescar el grid) y la query del item, y navega
 * de vuelta al listado.
 *
 * Estrategia de precarga (la más robusta y barata):
 *   1. Buscar la prenda en cualquier entrada cacheada de `['clothing', ...]`
 *      (el grid ya la trajo en la mayoría de los flujos).
 *   2. Si no está en caché, hacer `GET /clothing/{id}` con TanStack Query.
 *
 * En V1 no se edita la imagen (queda la actual); los campos editables son
 * descripción, categoría y color.
 */

import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, apiFetch } from "@/lib/api/client";
import {
  updateClothing,
  type UpdateClothingInput,
} from "@/features/closet/updateClothing";
import type { ClothingItem } from "@/features/closet/types";

/** Busca la prenda en las queries `['clothing', ...]` ya cacheadas. */
function findCachedItem(
  client: ReturnType<typeof useQueryClient>,
  id: string,
): ClothingItem | undefined {
  const entries = client.getQueriesData<unknown>({ queryKey: ["clothing"] });
  for (const [, data] of entries) {
    // El listado cachea arrays; ignoramos otras entradas (p.ej. el detalle).
    if (!Array.isArray(data)) continue;
    const found = (data as ClothingItem[]).find((item) => item.id === id);
    if (found) return found;
  }
  return undefined;
}

export function EditClothingForm() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Resolvemos la prenda cacheada una sola vez (al montar). Lo congelamos para
  // que invalidar `['clothing']` tras guardar no la "pierda" y reactive el
  // fetch del detalle.
  const [cached] = useState(() => findCachedItem(queryClient, id));

  // Si no está en caché, lo traemos por id. Si está, evitamos el fetch.
  // La key vive fuera del namespace `['clothing']` a propósito: así invalidar
  // el listado tras guardar no dispara un refetch del detalle.
  const itemQuery = useQuery({
    queryKey: ["clothing-detail", id],
    queryFn: () => apiFetch<ClothingItem>(`/clothing/${id}`),
    enabled: !cached && Boolean(id),
  });

  const item = cached ?? itemQuery.data;

  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [color, setColor] = useState("");
  const [hydrated, setHydrated] = useState(false);

  // Precargar los campos una vez que tenemos la prenda.
  useEffect(() => {
    if (item && !hydrated) {
      setDescription(item.description ?? "");
      setCategory(item.category ?? "");
      setColor(item.color ?? "");
      setHydrated(true);
    }
  }, [item, hydrated]);

  const mutation = useMutation({
    mutationFn: (input: UpdateClothingInput) => updateClothing(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["clothing"] });
      navigate("/");
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isPending || description.trim().length === 0) return;
    mutation.mutate({ description, category, color });
  }

  const submitError = mutation.isError
    ? mutation.error instanceof ApiError
      ? mutation.error.message
      : "No pudimos guardar los cambios. Intentá de nuevo."
    : null;

  if (itemQuery.isLoading && !item) {
    return (
      <section className="mx-auto flex w-full max-w-lg flex-col gap-6">
        <p className="text-muted-foreground" aria-busy="true">
          Cargando prenda…
        </p>
      </section>
    );
  }

  if (itemQuery.isError && !item) {
    return (
      <section className="mx-auto flex w-full max-w-lg flex-col gap-3">
        <p role="alert" className="text-sm font-medium text-destructive">
          No pudimos cargar la prenda.
        </p>
        <Button type="button" variant="outline" onClick={() => navigate("/")}>
          Volver al armario
        </Button>
      </section>
    );
  }

  const canSubmit = description.trim().length > 0 && !mutation.isPending;

  return (
    <section className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight">Editar prenda</h2>
        <p className="text-muted-foreground">
          Actualizá la descripción, categoría o color de la prenda.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-lg border bg-card p-6"
        aria-label="Editar prenda"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-description">Descripción</Label>
          <Input
            id="edit-description"
            name="description"
            placeholder="Ej: Remera blanca de algodón"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="edit-category">Categoría</Label>
            <Input
              id="edit-category"
              name="category"
              placeholder="Ej: remeras"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="edit-color">Color</Label>
            <Input
              id="edit-color"
              name="color"
              placeholder="Ej: blanco"
              value={color}
              onChange={(event) => setColor(event.target.value)}
            />
          </div>
        </div>

        {submitError ? (
          <p role="alert" className="text-sm font-medium text-destructive">
            {submitError}
          </p>
        ) : null}

        <div className="flex gap-2">
          <Button type="submit" disabled={!canSubmit}>
            {mutation.isPending ? "Guardando…" : "Guardar cambios"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/")}
            disabled={mutation.isPending}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </section>
  );
}
