/**
 * Capa de datos para crear prendas (IAN-14).
 *
 * El flujo de alta es en dos pasos contra el backend:
 *   1. `POST /clothing/upload` (multipart, campo `image`) -> `{ imageUrl }`.
 *   2. `POST /clothing` con `{ imageUrl, description, category?, color? }`
 *      -> la prenda creada.
 *
 * Acá vive la validación client-side del archivo (tipo y tamaño) y la función
 * `createClothing` que encadena ambos pasos. La capa de red (`apiFetch`) ya
 * deja pasar el `FormData` sin serializarlo ni fijar `Content-Type` (el browser
 * pone el boundary), adjuntando igualmente el JWT.
 */

import { apiFetch } from "@/lib/api/client";
import type { ClothingItem } from "@/features/closet/types";

/** Tipos MIME aceptados para la imagen de una prenda (alineado con el backend). */
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

/** Tamaño máximo del archivo en bytes (5 MB, igual que el límite de multer). */
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

/** Respuesta de `POST /clothing/upload`. */
interface UploadResponse {
  imageUrl: string;
}

/** Datos de la prenda que el usuario completa en el formulario. */
export interface CreateClothingInput {
  file: File;
  description: string;
  category?: string;
  color?: string;
}

/**
 * Valida un archivo de imagen antes de subirlo.
 *
 * @returns `null` si es válido, o un mensaje de error (en español) si no.
 */
export function validateImageFile(file: File): string | null {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return "Formato no válido. Usá una imagen JPG, PNG o WEBP.";
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "La imagen supera el tamaño máximo de 5 MB.";
  }
  return null;
}

/** Sube la imagen vía multipart y devuelve la `imageUrl` resultante. */
export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);

  const { imageUrl } = await apiFetch<UploadResponse>("/clothing/upload", {
    method: "POST",
    body: formData,
  });

  return imageUrl;
}

/**
 * Alta completa de una prenda: sube la imagen y luego crea el registro.
 *
 * Lanza `ApiError` si cualquiera de los dos pasos falla (el caller decide cómo
 * mostrarlo). Los campos `category`/`color` solo se envían si tienen contenido.
 */
export async function createClothing(
  input: CreateClothingInput,
): Promise<ClothingItem> {
  const imageUrl = await uploadImage(input.file);

  const category = input.category?.trim();
  const color = input.color?.trim();

  return apiFetch<ClothingItem>("/clothing", {
    method: "POST",
    body: {
      imageUrl,
      description: input.description.trim(),
      ...(category ? { category } : {}),
      ...(color ? { color } : {}),
    },
  });
}
