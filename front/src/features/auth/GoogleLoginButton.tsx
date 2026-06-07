/**
 * Botón "Entrar con Google" (IAN-11).
 *
 * Inicia el flujo OAuth del backend con una navegación full-page a
 * `${API_BASE_URL}/auth/google`. Es un redirect del navegador (Google luego
 * vuelve al backend y este redirige a `/auth/callback?token=…`), por eso usamos
 * un `<a href>` real y NO `fetch`.
 *
 * Reutiliza la base configurable de IAN-8 (`API_BASE_URL`, derivada de
 * `VITE_API_URL`); no hardcodeamos el host.
 */

import { API_BASE_URL } from "@/lib/api/client";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** URL de inicio del flow de Google, resuelta contra la base del backend. */
export const GOOGLE_OAUTH_URL = `${API_BASE_URL.replace(/\/+$/, "")}/auth/google`;

/** Logo de Google (multicolor) en SVG inline, sin dependencias extra. */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

export interface GoogleLoginButtonProps {
  /** Texto del botón. Default: "Entrar con Google". */
  label?: string;
}

export function GoogleLoginButton({
  label = "Entrar con Google",
}: GoogleLoginButtonProps) {
  // `<a href>` para navegación full-page (no SPA): el browser sale del sitio
  // hacia el backend, que a su vez redirige a Google.
  return (
    <a
      href={GOOGLE_OAUTH_URL}
      className={cn(buttonVariants({ variant: "outline" }), "w-full")}
    >
      <GoogleIcon />
      {label}
    </a>
  );
}
