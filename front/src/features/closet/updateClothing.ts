/**
 * Capa de datos para editar y eliminar prendas (IAN-15).
 *
 * Contra el backend (`ClothingController`):
 *   - `PUT /clothing/{id}`  con `{ description?, category?, color?, imageUrl? }`
 *     -> la prenda actualizada. 404 si no es del usuario.
 *   - `DELETE /clothing/{id}` -> 204 (sin cuerpo). 404 si no es del usuario.
 *
 * `apiFetch` ya lanza `ApiError` ante respuestas no-OK (el caller decide cómo
 * mostrarlo) y devuelve `null` ante un 204.
 */

import { apiFetch } from "@/lib/api/client";
import type { ClothingItem } from "@/features/closet/types";

/** Campos editables de una prenda (todos opcionales en el PUT). */
export interface UpdateClothingInput {
  description?: string;
  category?: string;
  color?: string;
  imageUrl?: string;
}

/**
 * Actualiza una prenda vía `PUT /clothing/{id}`.
 *
 * Solo se envían los campos provistos. `description` se recorta; `category` y
 * `color` se recortan y, si quedan vacíos, se envían como `""` para permitir
 * limpiarlos explícitamente.
 */
export async function updateClothing(
  id: string,
  input: UpdateClothingInput,
): Promise<ClothingItem> {
  const body: Record<string, unknown> = {};
  if (input.description !== undefined) body.description = input.description.trim();
  if (input.category !== undefined) body.category = input.category.trim();
  if (input.color !== undefined) body.color = input.color.trim();
  if (input.imageUrl !== undefined) body.imageUrl = input.imageUrl;

  return apiFetch<ClothingItem>(`/clothing/${id}`, {
    method: "PUT",
    body,
  });
}

/** Elimina una prenda vía `DELETE /clothing/{id}` (responde 204). */
export async function deleteClothing(id: string): Promise<void> {
  await apiFetch<null>(`/clothing/${id}`, { method: "DELETE" });
}
