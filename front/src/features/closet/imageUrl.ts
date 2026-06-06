/**
 * Resuelve la URL de imagen de una prenda.
 *
 * El backend devuelve rutas relativas (p.ej. `/uploads/abc.png`). Para que
 * carguen desde el frontend (que corre en otro origen en dev) las prefijamos
 * con la base de la API. Las URLs absolutas (`http(s)://...`) y los data URIs
 * se respetan tal cual.
 */

import { API_BASE_URL } from "@/lib/api/client";

export function resolveImageUrl(imageUrl: string): string {
  if (!imageUrl) return imageUrl;
  if (/^(https?:)?\/\//i.test(imageUrl) || imageUrl.startsWith("data:")) {
    return imageUrl;
  }
  const base = API_BASE_URL.replace(/\/+$/, "");
  const suffix = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
  return `${base}${suffix}`;
}
