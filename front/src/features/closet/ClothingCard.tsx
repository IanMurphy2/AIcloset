/**
 * Tarjeta de una prenda: imagen, descripción, metadatos (categoría/color) y
 * acciones de Editar / Eliminar (IAN-15).
 *
 * - La imagen y el título enlazan al detalle de la prenda (`/closet/:id`,
 *   IAN-16). Se usan `<Link>` puntuales (no envolvemos toda la card) para que
 *   los botones Editar/Eliminar no disparen la navegación al detalle.
 * - "Editar" navega a `/closet/:id/edit`.
 * - "Eliminar" abre un diálogo de confirmación; al confirmar, ejecuta
 *   `DELETE /clothing/{id}` vía `useMutation` y, en éxito, invalida `['clothing']`
 *   para que el grid se refresque sin la prenda.
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ApiError } from "@/lib/api/client";
import { resolveImageUrl } from "@/features/closet/imageUrl";
import { deleteClothing } from "@/features/closet/updateClothing";
import type { ClothingItem } from "@/features/closet/types";

interface ClothingCardProps {
  item: ClothingItem;
}

export function ClothingCard({ item }: ClothingCardProps) {
  const queryClient = useQueryClient();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => deleteClothing(item.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["clothing"] });
      setConfirmingDelete(false);
    },
  });

  const deleteError = deleteMutation.isError
    ? deleteMutation.error instanceof ApiError
      ? deleteMutation.error.message
      : "No pudimos eliminar la prenda. Intentá de nuevo."
    : null;

  function handleOpenConfirm() {
    deleteMutation.reset();
    setConfirmingDelete(true);
  }

  function handleCancelDelete() {
    if (deleteMutation.isPending) return;
    setConfirmingDelete(false);
  }

  return (
    <Card className="overflow-hidden">
      <Link
        to={`/closet/${item.id}`}
        aria-label={`Ver detalle de ${item.description}`}
        className="block aspect-square w-full overflow-hidden bg-muted"
      >
        <img
          src={resolveImageUrl(item.imageUrl)}
          alt={item.description}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </Link>
      <CardContent className="flex flex-col gap-2 p-4">
        <Link
          to={`/closet/${item.id}`}
          className="text-sm font-medium leading-snug underline-offset-4 hover:underline"
        >
          {item.description}
        </Link>
        {(item.category || item.color) && (
          <div className="flex flex-wrap gap-1.5">
            {item.category && (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                {item.category}
              </span>
            )}
            {item.color && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {item.color}
              </span>
            )}
          </div>
        )}

        <div className="mt-1 flex gap-1.5">
          <Link
            to={`/closet/${item.id}/edit`}
            aria-label={`Editar ${item.description}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "icon" }),
              "h-8 w-8",
            )}
          >
            <Pencil aria-hidden="true" />
          </Link>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            aria-label={`Eliminar ${item.description}`}
            onClick={handleOpenConfirm}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      </CardContent>

      <ConfirmDialog
        open={confirmingDelete}
        title="Eliminar prenda"
        description={`¿Seguro que querés eliminar "${item.description}"? Esta acción no se puede deshacer.`}
        confirmLabel={deleteMutation.isPending ? "Eliminando…" : "Eliminar"}
        confirmVariant="destructive"
        isPending={deleteMutation.isPending}
        errorMessage={deleteError}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={handleCancelDelete}
      />
    </Card>
  );
}
