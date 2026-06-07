/**
 * Callback del flow OAuth de Google (IAN-11).
 *
 * El backend redirige aquí tras autenticar contra Google:
 * - éxito: `/auth/callback?token=<jwt>` → persistimos el token vía
 *   `useAuth().login(token)` y navegamos a `/`.
 * - fallo (sin token o con `?error=…`): navegamos a `/login?error=oauth` para
 *   que `LoginPage` muestre el mensaje correspondiente.
 *
 * Ambas navegaciones usan `replace` para no dejar el callback en el historial.
 */

import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "@/features/auth/auth-context";

export function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      login(token);
      navigate("/", { replace: true });
    } else {
      navigate("/login?error=oauth", { replace: true });
    }
  }, [searchParams, login, navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <p role="status" className="text-sm text-muted-foreground">
        Procesando…
      </p>
    </main>
  );
}
