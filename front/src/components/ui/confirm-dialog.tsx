/**
 * Diálogo de confirmación accesible y mínimo.
 *
 * El proyecto no incluye el `AlertDialog` de shadcn, así que armamos uno simple
 * pero accesible: overlay + panel con `role="dialog"`, `aria-modal`, título y
 * descripción enlazados (`aria-labelledby` / `aria-describedby`), cierre con
 * Escape y click en el overlay, y foco inicial en el botón de confirmar.
 *
 * No bloquea por sí mismo acciones asíncronas; el caller pasa `isPending` para
 * deshabilitar los botones mientras la operación corre.
 */

import { useEffect, useId, useRef } from "react";

import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  /** Texto del botón de confirmación. */
  confirmLabel?: string;
  cancelLabel?: string;
  /** Si la acción de confirmar está en curso (deshabilita los botones). */
  isPending?: boolean;
  /** Variante del botón de confirmar (p.ej. `destructive` para borrar). */
  confirmVariant?: "default" | "destructive";
  /** Mensaje de error a mostrar dentro del diálogo (opcional). */
  errorMessage?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  isPending = false,
  confirmVariant = "default",
  errorMessage = null,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Foco inicial en el botón de confirmar al abrir.
  useEffect(() => {
    if (open) confirmRef.current?.focus();
  }, [open]);

  // Cierre con Escape mientras el diálogo está abierto y no hay acción en curso.
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPending) onCancel();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, isPending, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={() => {
        if (!isPending) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="flex w-full max-w-sm flex-col gap-4 rounded-lg border bg-card p-6 text-card-foreground shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col gap-1.5">
          <h2 id={titleId} className="text-lg font-semibold leading-none tracking-tight">
            {title}
          </h2>
          {description ? (
            <p id={descriptionId} className="text-sm text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>

        {errorMessage ? (
          <p role="alert" className="text-sm font-medium text-destructive">
            {errorMessage}
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            {cancelLabel}
          </Button>
          <Button
            ref={confirmRef}
            type="button"
            variant={confirmVariant}
            onClick={onConfirm}
            disabled={isPending}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
