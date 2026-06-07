/**
 * Placeholder del inventario (closet).
 *
 * Ruta protegida raíz. La grilla/listado real de prendas llega en issues de
 * inventario posteriores; aquí solo confirmamos que el guard deja pasar a un
 * usuario autenticado y que se renderiza dentro del layout.
 */

export function ClosetPage() {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-2xl font-semibold tracking-tight">Mi armario</h2>
      <p className="text-muted-foreground">
        Placeholder del inventario. Aquí irá la grilla de prendas.
      </p>
    </section>
  );
}
