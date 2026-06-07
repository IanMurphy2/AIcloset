/**
 * Formulario de alta de prenda (IAN-14).
 *
 * Permite elegir una imagen (con preview), validarla client-side (tipo y
 * tamaño) y completar descripción/categoría/color. Al enviar, encadena
 * `POST /clothing/upload` + `POST /clothing` vía `useMutation`. En éxito,
 * invalida la query `['clothing']` para que el grid de IAN-13 se refresque y
 * redirige al listado.
 *
 * Se monta en la ruta `/closet/new`.
 */

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/client";
import {
  ALLOWED_IMAGE_TYPES,
  createClothing,
  validateImageFile,
  type CreateClothingInput,
} from "@/features/closet/createClothing";

const FILE_ACCEPT = ALLOWED_IMAGE_TYPES.join(",");

export function AddClothingForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [color, setColor] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generar/revocar la object URL del preview cuando cambia el archivo.
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const mutation = useMutation({
    mutationFn: (input: CreateClothingInput) => createClothing(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["clothing"] });
      navigate("/");
    },
  });

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    mutation.reset();
    const selected = event.target.files?.[0] ?? null;

    if (!selected) {
      setFile(null);
      setFileError(null);
      return;
    }

    const error = validateImageFile(selected);
    if (error) {
      // Archivo inválido: mostramos el error y NO lo aceptamos para subir.
      setFile(null);
      setFileError(error);
      // Limpiar el input para permitir re-seleccionar el mismo archivo luego.
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setFileError(null);
    setFile(selected);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || mutation.isPending) return;
    mutation.mutate({
      file,
      description,
      category,
      color,
    });
  }

  const submitError = mutation.isError
    ? mutation.error instanceof ApiError
      ? mutation.error.message
      : "No pudimos guardar la prenda. Intentá de nuevo."
    : null;

  const canSubmit =
    Boolean(file) && description.trim().length > 0 && !mutation.isPending;

  return (
    <section className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight">Agregar prenda</h2>
        <p className="text-muted-foreground">
          Subí una foto y describí la prenda para sumarla a tu armario.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-lg border bg-card p-6"
        aria-label="Agregar prenda"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="clothing-image">Imagen</Label>
          <Input
            id="clothing-image"
            ref={fileInputRef}
            type="file"
            accept={FILE_ACCEPT}
            onChange={handleFileChange}
          />
          <p className="text-xs text-muted-foreground">
            JPG, PNG o WEBP. Máximo 5 MB.
          </p>
          {fileError ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {fileError}
            </p>
          ) : null}
        </div>

        {previewUrl ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium leading-none">Vista previa</span>
            <img
              src={previewUrl}
              alt="Vista previa de la prenda"
              className="aspect-square w-full max-w-xs rounded-md border object-cover"
            />
          </div>
        ) : null}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="clothing-description">Descripción</Label>
          <Input
            id="clothing-description"
            name="description"
            placeholder="Ej: Remera blanca de algodón"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="clothing-category">Categoría</Label>
            <Input
              id="clothing-category"
              name="category"
              placeholder="Ej: remeras"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="clothing-color">Color</Label>
            <Input
              id="clothing-color"
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
            {mutation.isPending ? "Guardando…" : "Guardar prenda"}
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
