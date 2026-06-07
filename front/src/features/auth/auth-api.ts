/**
 * Contrato de la API de autenticación (IAN-10).
 *
 * Refleja `back/src/api/endpoints/AuthController.ts`:
 * - `POST /auth/login`    body: { email, password }
 * - `POST /auth/register` body: { email, password, name } (password >= 8 chars)
 * Ambos responden `{ token, user: { id, email, name } }`.
 */

import { apiFetch } from "@/lib/api/client";
import type { AuthUser } from "@/features/auth/auth-context";

/** Respuesta exitosa de los endpoints de auth. */
export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  name: string;
}

/** Llama a `POST /auth/login`. Lanza `ApiError` ante credenciales inválidas. */
export function login({ email, password }: LoginPayload): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

/** Llama a `POST /auth/register`. Lanza `ApiError` (409 si el usuario existe). */
export function register({
  email,
  password,
  name,
}: RegisterPayload): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: { email, password, name },
  });
}
