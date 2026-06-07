/**
 * Pantalla de registro (IAN-10).
 *
 * Form conectado a `POST /auth/register` vía `useAuthMutation`. En éxito guarda
 * el token (useAuth().login) y navega a `/`; en error muestra el mensaje del
 * `ApiError` (p.ej. 409 "User already exists" o validación de password).
 */

import { Link } from "react-router-dom";

import { register } from "@/features/auth/auth-api";
import { AuthForm, type AuthFormValues } from "@/features/auth/AuthForm";
import { useAuthMutation } from "@/features/auth/useAuthMutation";

export function RegisterPage() {
  const { submit, isPending, errorMessage } = useAuthMutation(register);

  function handleSubmit(values: AuthFormValues) {
    submit({
      email: values.email,
      password: values.password,
      name: values.name ?? "",
    });
  }

  return (
    <AuthForm
      mode="register"
      title="Crear cuenta"
      description="Registrate para empezar a organizar tu armario."
      submitLabel="Crear cuenta"
      pendingLabel="Creando cuenta…"
      isPending={isPending}
      errorMessage={errorMessage}
      onSubmit={handleSubmit}
      footer={
        <>
          ¿Ya tenés cuenta?{" "}
          <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Iniciar sesión
          </Link>
        </>
      }
    />
  );
}
