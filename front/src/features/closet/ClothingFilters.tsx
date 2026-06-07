/**
 * Filtros del inventario por categoría y color.
 *
 * Como el backend no expone un set fijo de categorías/colores, usamos inputs de
 * texto libre. Los cambios se aplican al enviar el formulario (Enter o botón
 * "Filtrar"), evitando una request por cada tecla. "Limpiar" resetea ambos.
 */

import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ClothingFilters as Filters } from "@/features/closet/types";

interface ClothingFiltersProps {
  value: Filters;
  onChange: (filters: Filters) => void;
}

export function ClothingFilters({ value, onChange }: ClothingFiltersProps) {
  const [category, setCategory] = useState(value.category ?? "");
  const [color, setColor] = useState(value.color ?? "");

  // Mantener el form en sync si los filtros cambian desde afuera (p.ej. reset).
  useEffect(() => {
    setCategory(value.category ?? "");
    setColor(value.color ?? "");
  }, [value.category, value.color]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onChange({ category, color });
  }

  function handleClear() {
    setCategory("");
    setColor("");
    onChange({});
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border bg-card p-4 sm:flex-row sm:items-end"
      aria-label="Filtros de prendas"
    >
      <div className="flex flex-1 flex-col gap-1.5">
        <Label htmlFor="filter-category">Categoría</Label>
        <Input
          id="filter-category"
          name="category"
          placeholder="Ej: remeras"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        />
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        <Label htmlFor="filter-color">Color</Label>
        <Input
          id="filter-color"
          name="color"
          placeholder="Ej: negro"
          value={color}
          onChange={(event) => setColor(event.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit">Filtrar</Button>
        <Button type="button" variant="outline" onClick={handleClear}>
          Limpiar
        </Button>
      </div>
    </form>
  );
}
