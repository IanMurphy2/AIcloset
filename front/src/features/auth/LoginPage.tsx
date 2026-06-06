/**
 * Placeholder de la pantalla de login.
 *
 * El formulario real (con la mutation de auth) llega en IAN-10. Por ahora solo
 * marcamos la ruta pública para que el guard y el routing queden verificables.
 */

export function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-8">
      <h1 className="text-3xl font-bold tracking-tight text-primary">
        Iniciar sesión
      </h1>
      <p className="text-muted-foreground">
        Placeholder de login. El formulario real llega en IAN-10.
      </p>
    </main>
  );
}
