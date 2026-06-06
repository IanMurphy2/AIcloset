/**
 * Pantalla de login (IAN-10).
 *
 * Form conectado a `POST /auth/login` vía `useAuthMutation`. En éxito guarda el
 * token (useAuth().login) y navega a `/`; en error muestra el mensaje del
 * `ApiError` (p.ej. 401 "Invalid email or password").
 */

import { Link } from "react-router-dom";

import { login } from "@/features/auth/auth-api";
import { AuthForm, type AuthFormValues } from "@/features/auth/AuthForm";
import { useAuthMutation } from "@/features/auth/useAuthMutation";

export function LoginPage() {
  const { submit, isPending, errorMessage } = useAuthMutation(login);

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
      errorMessage={errorMessage}
      onSubmit={handleSubmit}
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
