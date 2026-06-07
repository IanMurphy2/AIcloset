/**
 * Formulario de guardado/edición de un outfit (IAN-19).
 *
 * Compone:
 * - campos de metadatos: nombre (requerido), descripción y un toggle
 *   privado/público (`isPublic`);
 * - el `OutfitBuilder` (controlado: recibe la `builder` API del padre, que es
 *   quien lee `toItems()` y rehidrata en edición);
 * - un botón Guardar que dispara `onSubmit` con `{ name, description, isPublic,
 *   items }`, donde `items` (`{ clothingId, category }[]`) se deriva de
 *   `toItems()` en orden de `position`.
 *
 * Validación de UI (antes de llamar a la red): nombre no vacío y al menos una
 * prenda asignada. La validación de negocio (prendas del usuario, slots, etc.)
 * la hace el backend y su mensaje se muestra vía `submitError`.
 *
 * NOTA sobre `isPublic`: es parte del contrato nuevo (IAN-17), así que el flag
 * se expone en la UI y se serializa en el body (ver `outfit-api`).
 */

import { useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { ClothingItem } from "@/features/closet/types";
import { OutfitBuilder } from "@/features/outfit/OutfitBuilder";
import type { OutfitRequestItem } from "@/features/outfit/outfit-api";
import type { OutfitBuilderApi } from "@/features/outfit/useOutfitBuilder";

/** Valores que el formulario entrega al guardar. */
export interface OutfitFormValues {
  name: string;
  description: string;
  isPublic: boolean;
  /** Items `{ clothingId, category }` en orden de `position` (del builder). */
  items: OutfitRequestItem[];
}

/** Valores iniciales de los campos de metadatos (precarga en edición). */
export interface OutfitFormInitialValues {
  name?: string;
  description?: string;
  isPublic?: boolean;
}

interface OutfitFormProps {
  /** Prendas del inventario disponibles para arrastrar. */
  clothing: ClothingItem[];
  /** API del builder (estado + acciones), controlada por el padre. */
  builder: OutfitBuilderApi;
  /** Precarga de los campos de metadatos (modo edición). */
  initialValues?: OutfitFormInitialValues;
  /** Texto del botón de guardado (p.ej. "Guardar" / "Guardar cambios"). */
  submitLabel?: string;
  /** `true` mientras la request de guardado está en vuelo. */
  isSubmitting?: boolean;
  /** Mensaje de error de la API a mostrar (p.ej. `ApiError.message`). */
  submitError?: string | null;
  /** Se invoca con los valores válidos al enviar el formulario. */
  onSubmit: (values: OutfitFormValues) => void;
}

export function OutfitForm({
  clothing,
  builder,
  initialValues,
  submitLabel = "Guardar",
  isSubmitting = false,
  submitError,
  onSubmit,
}: OutfitFormProps) {
  const nameId = useId();
  const descriptionId = useId();
  const isPublicId = useId();

  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDescription] = useState(
    initialValues?.description ?? "",
  );
  const [isPublic, setIsPublic] = useState(initialValues?.isPublic ?? false);
  // Error de validación local (no de red).
  const [validationError, setValidationError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    const items = builder.toItems();

    if (!trimmedName) {
      setValidationError("Poné un nombre para el outfit.");
      return;
    }
    if (items.length === 0) {
      setValidationError("Agregá al menos una prenda al outfit.");
      return;
    }

    setValidationError(null);
    onSubmit({
      name: trimmedName,
      description: description.trim(),
      isPublic,
      // `toItems()` ya viene ordenado por `position`; el backend deriva
      // `position` del orden del array `items`.
      items: items.map((item) => ({
        clothingId: item.clothingId,
        category: item.category,
      })),
    });
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-4 sm:max-w-xl">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={nameId}>
            Nombre <span className="text-destructive">*</span>
          </Label>
          <Input
            id={nameId}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ej: Look de oficina"
            disabled={isSubmitting}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={descriptionId}>Descripción</Label>
          <Input
            id={descriptionId}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Opcional"
            disabled={isSubmitting}
          />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
          <div className="flex flex-col gap-0.5">
            <Label htmlFor={isPublicId}>Outfit público</Label>
            <span className="text-xs text-muted-foreground">
              Si lo activás, otras personas podrán verlo (próximamente).
            </span>
          </div>
          <Switch
            id={isPublicId}
            checked={isPublic}
            onCheckedChange={setIsPublic}
            disabled={isSubmitting}
            aria-label="Outfit público"
          />
        </div>
      </div>

      <OutfitBuilder clothing={clothing} builder={builder} />

      {validationError && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {validationError}
        </p>
      )}
      {submitError && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {submitError}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
