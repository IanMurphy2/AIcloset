/**
 * Página de armado / guardado / edición de un outfit.
 *
 * - Crear: ruta `/outfits/new`. Arma el outfit en memoria y lo guarda con
 *   `POST /outfit`.
 * - Editar: ruta `/outfits/:id/edit`. Hace `GET /outfit/{id}`, precarga los
 *   campos y los slots, y guarda con `PUT /outfit/{id}`.
 *
 * Lista las prendas del usuario (reusa `useClothing`) para arrastrarlas a los
 * slots canónicos. El estado del builder se levanta acá (`useOutfitBuilder`)
 * para poder leer `toItems()` al guardar y rehidratarlo en edición.
 *
 * Contrato del backend (IAN-17, ver `outfit-api.ts`): el body es
 * `{ name, description, isPublic, items: [{ clothingId, category }] }`. La
 * `position` la deriva el backend del orden del array `items`. El `GET` devuelve
 * los `items` con su `category` y `position`, así que en edición se rehidrata
 * cada item en su slot por `category` (respetando `position`), no posicionalmente.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useClothing } from "@/features/closet/useClothing";
import type { ClothingItem } from "@/features/closet/types";
import {
  OutfitForm,
  type OutfitFormValues,
} from "@/features/outfit/OutfitForm";
import {
  createOutfit,
  getOutfit,
  updateOutfit,
  type OutfitResponse,
} from "@/features/outfit/outfit-api";
import {
  useOutfitBuilder,
  type HydrationItem,
} from "@/features/outfit/useOutfitBuilder";
import { ApiError } from "@/lib/api/client";

/** Destino tras guardar con éxito. No hay listado de outfits aún (IAN-20). */
const POST_SAVE_PATH = "/";

/**
 * Mapea los `items` que devuelve el backend (cada uno con `category` y
 * `position`) a items de hidratación, asignando cada prenda a su slot canónico
 * por `category` y respetando el orden de `position`.
 *
 * Enriquece cada prenda con su `ClothingItem` completo del inventario cuando
 * está disponible (para mostrar descripción, etc.); si no está, arma un item
 * mínimo a partir del item del outfit.
 */
function toHydrationItems(
  outfit: OutfitResponse,
  inventory: ClothingItem[],
): HydrationItem[] {
  const byId = new Map(inventory.map((item) => [item.id, item]));
  return [...outfit.items]
    .sort((a, b) => a.position - b.position)
    .map((item) => {
      const full = byId.get(item.clothingId);
      const clothing: ClothingItem = full ?? {
        id: item.clothingId,
        userId: "",
        imageUrl: item.imageUrl,
        description: "",
        createdAt: outfit.createdAt,
      };
      return { slot: item.category, clothing };
    });
}

export function OutfitBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const builder = useOutfitBuilder();

  const {
    data: clothing,
    isLoading: isClothingLoading,
    isError: isClothingError,
    refetch,
  } = useClothing({});

  // Modo edición: carga el outfit existente.
  const {
    data: outfit,
    isLoading: isOutfitLoading,
    isError: isOutfitError,
  } = useQuery({
    queryKey: ["outfit", id] as const,
    queryFn: () => getOutfit(id as string),
    enabled: isEdit,
  });

  // Una vez que tenemos el outfit (y, si es posible, el inventario), precarga
  // los slots del builder. Solo una vez por outfit cargado.
  const [hydratedId, setHydratedId] = useState<string | null>(null);
  useEffect(() => {
    if (!outfit || isClothingLoading) return;
    if (hydratedId === outfit.id) return;
    builder.hydrate(toHydrationItems(outfit, clothing ?? []));
    setHydratedId(outfit.id);
  }, [outfit, clothing, isClothingLoading, hydratedId, builder]);

  const initialValues = useMemo(
    () =>
      outfit
        ? {
            name: outfit.name,
            description: outfit.description,
            isPublic: outfit.isPublic,
          }
        : undefined,
    [outfit],
  );

  const mutation = useMutation({
    mutationFn: (values: OutfitFormValues) => {
      const body = {
        name: values.name,
        description: values.description,
        isPublic: values.isPublic,
        items: values.items,
      };
      return isEdit ? updateOutfit(id as string, body) : createOutfit(body);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["outfits"] });
      navigate(POST_SAVE_PATH);
    },
  });

  const submitError =
    mutation.error instanceof ApiError
      ? mutation.error.message
      : mutation.error
        ? "No pudimos guardar el outfit. Intentá de nuevo."
        : null;

  const heading = isEdit ? "Editar outfit" : "Armar outfit";

  // Estados de carga / error del inventario y, en edición, del outfit.
  const isLoading = isClothingLoading || (isEdit && isOutfitLoading);
  const isError = isClothingError || (isEdit && isOutfitError);

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight">{heading}</h2>
        <p className="text-muted-foreground">
          Completá los datos y arrastrá prendas de tu armario a cada slot. Una
          prenda por slot; podés quitar o reordenar las asignadas.
        </p>
      </header>

      {isLoading && (
        <div
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
          aria-busy="true"
          aria-label="Cargando"
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

      {!isLoading && isError && (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center"
        >
          <p className="text-sm font-medium text-destructive">
            {isEdit && isOutfitError
              ? "No pudimos cargar el outfit."
              : "No pudimos cargar tus prendas."}
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

      {!isLoading &&
        !isError &&
        (!clothing || clothing.length === 0) &&
        !isEdit && (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-12 text-center">
            <p className="text-base font-medium">Tu armario está vacío.</p>
            <p className="text-sm text-muted-foreground">
              Agregá prendas para poder armar un outfit.
            </p>
          </div>
        )}

      {!isLoading && !isError && ((clothing && clothing.length > 0) || isEdit) && (
        <OutfitForm
          clothing={clothing ?? []}
          builder={builder}
          initialValues={initialValues}
          submitLabel={isEdit ? "Guardar cambios" : "Guardar"}
          isSubmitting={mutation.isPending}
          submitError={submitError}
          onSubmit={(values) => mutation.mutate(values)}
        />
      )}
    </section>
  );
}
