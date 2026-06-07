/**
 * Pantalla de login (IAN-10 + IAN-11).
 *
 * Form local conectado a `POST /auth/login` vía `useAuthMutation`. En éxito
 * guarda el token (useAuth().login) y navega a `/`; en error muestra el mensaje
 * del `ApiError` (p.ej. 401 "Invalid email or password").
 *
 * IAN-11: añade "Entrar con Google" (inicia el flow OAuth con navegación
 * full-page) y muestra un error si el callback de OAuth falló (`?error=oauth`).
 */

import { Link, useSearchParams } from "react-router-dom";

import { login } from "@/features/auth/auth-api";
import { AuthForm, type AuthFormValues } from "@/features/auth/AuthForm";
import { GoogleLoginButton } from "@/features/auth/GoogleLoginButton";
import { useAuthMutation } from "@/features/auth/useAuthMutation";

/** Mensaje mostrado cuando el flow de Google volvió con error. */
const OAUTH_ERROR_MESSAGE = "No se pudo iniciar sesión con Google.";

export function LoginPage() {
  const { submit, isPending, errorMessage } = useAuthMutation(login);
  const [searchParams] = useSearchParams();

  // Error propagado por el backend tras un fallo en el flow OAuth.
  const oauthError =
    searchParams.get("error") === "oauth" ? OAUTH_ERROR_MESSAGE : null;

  function handleSubmit(values: AuthFormValues) {
    submit({ email: values.email, password: values.password });
  }

  return (
    <AuthForm
      mode="login"
      title="Iniciar sesión"
      description="Accedé a tu armario con tu email y contraseña."
      submitLabel="Iniciar sesión"
      pendingLabel="Ingresando…"
      isPending={isPending}
      // El error del form local tiene prioridad; si no, mostramos el de OAuth.
      errorMessage={errorMessage ?? oauthError}
      onSubmit={handleSubmit}
      extra={
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase text-muted-foreground">o</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <GoogleLoginButton />
        </div>
      }
      footer={
        <>
          ¿No tenés cuenta?{" "}
          <Link to="/register" className="font-medium text-primary underline-offset-4 hover:underline">
            Crear cuenta
          </Link>
        </>
      }
    />
  );
}
