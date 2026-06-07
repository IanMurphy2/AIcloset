/**
 * Tipos del dominio de inventario (closet).
 *
 * `ClothingItem` refleja la forma que devuelve `GET /clothing`
 * (backend: `ClothingController` + entidad `Clothing`).
 */

/** Prenda tal como la devuelve el backend. */
export interface ClothingItem {
  id: string;
  userId: string;
  /** Ruta de la imagen. El backend devuelve rutas relativas tipo `/uploads/...`. */
  imageUrl: string;
  description: string;
  category?: string;
  color?: string;
  createdAt: string;
}

/**
 * Filtros aplicables al listado. Ambos opcionales; los valores vacíos no se
 * envían como query params.
 */
export interface ClothingFilters {
  category?: string;
  color?: string;
}
