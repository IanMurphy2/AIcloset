/**
 * Guard de rutas protegidas.
 *
 * Si no hay sesión, redirige a `/login` con `replace` (no deja la ruta privada
 * en el historial). Si hay sesión, renderiza las rutas hijas vía `<Outlet />`.
 */

import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "@/features/auth/auth-context";

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
