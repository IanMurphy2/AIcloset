/**
 * Conecta el manejo de 401 del cliente HTTP (IAN-8) con React Router.
 *
 * Registra un handler que cierra la sesión y navega a `/login` usando la
 * navegación del router (en vez del `window.location.assign` por defecto).
 * Al desmontar restaura el handler por defecto.
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
  resetUnauthorizedHandler,
  setUnauthorizedHandler,
} from "@/lib/api/client";
import { useAuth } from "@/features/auth/auth-context";

export function useUnauthorizedRedirect(): void {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
      navigate("/login", { replace: true });
    });

    return () => {
      resetUnauthorizedHandler();
    };
  }, [logout, navigate]);
}
