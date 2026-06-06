/**
 * Capa de red del dominio de outfit (IAN-19).
 *
 * Tipada sobre `apiFetch`. Refleja el contrato NUEVO de outfit definido por
 * IAN-17 (backend), que es el runtime real con el que se mergeará este frontend
 * (IAN-18 ya codea contra él):
 *
 *   POST /outfit       body  { name, description, isPublic?, items: { clothingId, category }[] }
 *   PUT  /outfit/{id}        mismo body (reemplaza metadatos + items)
 *   GET  /outfit/{id} -> OutfitResponse
 *
 *   OutfitResponse = {
 *     id, name, description, isPublic: boolean,
 *     items: { clothingId, imageUrl, category, position }[],  // ordenados por position
 *     createdAt, updatedAt
 *   }
 *
 * NOTAS sobre el contrato:
 * - El body envía `items: [{ clothingId, category }]`; la `position` la deriva el
 *   backend del orden del array. Acá los `items` se mandan en el orden de
 *   `position` que arma el builder (`toItems()`).
 * - `category` es un slot canónico (`tops|bottoms|calzado|abrigo|accesorios`).
 * - `isPublic` SÍ es parte del contrato y se serializa en el body.
 */

import { apiFetch } from "@/lib/api/client";
import type { OutfitSlot } from "@/features/outfit/slots";

/** Item de un outfit tal como lo devuelve el backend (con `position`). */
export interface OutfitResponseItem {
  clothingId: string;
  imageUrl: string;
  category: OutfitSlot;
  /** Orden estable dentro del outfit (0..n-1, contiguo). */
  position: number;
}

/** Outfit tal como lo devuelve el backend (`GET`/`POST`/`PUT /outfit`). */
export interface OutfitResponse {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  /** Items ordenados por `position`. */
  items: OutfitResponseItem[];
  createdAt: string;
  updatedAt: string;
}

/** Item del body de creación/actualización (sin `position`: la deriva el backend). */
export interface OutfitRequestItem {
  clothingId: string;
  category: OutfitSlot;
}

/**
 * Cuerpo aceptado por el backend para crear/actualizar.
 *
 * El orden de `items` preserva el orden de `position` que arma el builder; la
 * `position` la deriva el backend de ese orden.
 */
export interface OutfitRequest {
  name: string;
  description: string;
  isPublic?: boolean;
  items: OutfitRequestItem[];
}

/**
 * Serializa el body al shape que espera `apiFetch` (`Record<string, unknown>`).
 * Una `interface` no es asignable a `Record<string, unknown>` por falta de índice
 * implícito; este helper hace el puente sin perder el tipado de `OutfitRequest`.
 */
function toBody(body: OutfitRequest): Record<string, unknown> {
  return { ...body };
}

/** Crea un outfit. `POST /outfit`. */
export function createOutfit(body: OutfitRequest): Promise<OutfitResponse> {
  return apiFetch<OutfitResponse>("/outfit", {
    method: "POST",
    body: toBody(body),
  });
}

/** Actualiza un outfit existente. `PUT /outfit/{id}`. */
export function updateOutfit(
  id: string,
  body: OutfitRequest,
): Promise<OutfitResponse> {
  return apiFetch<OutfitResponse>(`/outfit/${id}`, {
    method: "PUT",
    body: toBody(body),
  });
}

/** Carga un outfit existente (modo edición). `GET /outfit/{id}`. */
export function getOutfit(id: string): Promise<OutfitResponse> {
  return apiFetch<OutfitResponse>(`/outfit/${id}`);
}
