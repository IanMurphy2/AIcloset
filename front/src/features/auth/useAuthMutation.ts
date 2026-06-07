/**
 * Hook compartido entre login y registro.
 *
 * Envuelve un request de auth (`login`/`register` de `auth-api`) en un
 * `useMutation`. En éxito: persiste la sesión vía `useAuth().login(token, user)`
 * y navega a la raíz protegida. En error: expone el mensaje del `ApiError`.
 */

import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/features/auth/auth-context";
import type { AuthResponse } from "@/features/auth/auth-api";

/** Mensaje de error genérico si el `ApiError` no trae uno útil. */
const FALLBACK_ERROR = "Algo salió mal. Intentá de nuevo.";

export interface UseAuthMutationResult<TPayload> {
  /** Dispara el request de auth con el payload del formulario. */
  submit: (payload: TPayload) => void;
  /** `true` mientras el request está en vuelo. */
  isPending: boolean;
  /** Mensaje de error visible (del `ApiError`) o `null`. */
  errorMessage: string | null;
}

export function useAuthMutation<TPayload>(
  request: (payload: TPayload) => Promise<AuthResponse>,
): UseAuthMutationResult<TPayload> {
  const { login } = useAuth();
  const navigate = useNavigate();

  const mutation = useMutation<AuthResponse, unknown, TPayload>({
    mutationFn: request,
    onSuccess: ({ token, user }) => {
      login(token, user);
      navigate("/", { replace: true });
    },
  });

  const errorMessage =
    mutation.error == null
      ? null
      : mutation.error instanceof ApiError
        ? mutation.error.message || FALLBACK_ERROR
        : FALLBACK_ERROR;

  return {
    submit: mutation.mutate,
    isPending: mutation.isPending,
    errorMessage,
  };
}
