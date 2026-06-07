/**
 * Formulario de autenticación reutilizable (login y registro).
 *
 * Renderiza los campos según `mode`, valida requeridos en cliente y delega el
 * submit en el caller. La validación client-side evita disparar el request si
 * hay campos vacíos; los errores del servidor se muestran vía `errorMessage`.
 *
 * Accesibilidad: cada input tiene su `<Label htmlFor>`, los inválidos marcan
 * `aria-invalid` y describen su error con `aria-describedby`; el error del
 * servidor se anuncia con `role="alert"`.
 */

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type AuthFormMode = "login" | "register";

export interface AuthFormValues {
  email: string;
  password: string;
  /** Solo presente en modo `register`. */
  name?: string;
}

interface FieldErrors {
  email?: string;
  password?: string;
  name?: string;
}

export interface AuthFormProps {
  mode: AuthFormMode;
  title: string;
  description: string;
  submitLabel: string;
  pendingLabel: string;
  isPending: boolean;
  errorMessage: string | null;
  onSubmit: (values: AuthFormValues) => void;
  /** Pie del formulario con el enlace a la pantalla opuesta. */
  footer: React.ReactNode;
}

/** Longitud mínima de password exigida por el backend (`MinLength(8)`). */
const PASSWORD_MIN_LENGTH = 8;

export function AuthForm({
  mode,
  title,
  description,
  submitLabel,
  pendingLabel,
  isPending,
  errorMessage,
  onSubmit,
  footer,
}: AuthFormProps) {
  const isRegister = mode === "register";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (email.trim() === "") {
      next.email = "El email es obligatorio.";
    }
    if (password === "") {
      next.password = "La contraseña es obligatoria.";
    } else if (isRegister && password.length < PASSWORD_MIN_LENGTH) {
      next.password = `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`;
    }
    if (isRegister && name.trim() === "") {
      next.name = "El nombre es obligatorio.";
    }
    return next;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    const values: AuthFormValues = { email: email.trim(), password };
    if (isRegister) {
      values.name = name.trim();
    }
    onSubmit(values);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isRegister ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={errors.name ? true : undefined}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  disabled={isPending}
                />
                {errors.name ? (
                  <p id="name-error" role="alert" className="text-sm text-destructive">
                    {errors.name}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={errors.email ? "email-error" : undefined}
                disabled={isPending}
              />
              {errors.email ? (
                <p id="email-error" role="alert" className="text-sm text-destructive">
                  {errors.email}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={isRegister ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={errors.password ? true : undefined}
                aria-describedby={errors.password ? "password-error" : undefined}
                disabled={isPending}
              />
              {errors.password ? (
                <p
                  id="password-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {errors.password}
                </p>
              ) : null}
            </div>

            {errorMessage ? (
              <p role="alert" className="text-sm font-medium text-destructive">
                {errorMessage}
              </p>
            ) : null}

            <Button type="submit" disabled={isPending}>
              {isPending ? pendingLabel : submitLabel}
            </Button>
          </form>
        </CardContent>
        <div className="px-6 pb-6 text-center text-sm text-muted-foreground">
          {footer}
        </div>
      </Card>
    </main>
  );
}
