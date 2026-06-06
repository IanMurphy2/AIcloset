/**
 * Árbol de rutas de la app.
 *
 * - `/login` y `/register` son públicas (forms de auth de IAN-10).
 * - El resto cuelga de `<ProtectedRoute>` y se renderiza dentro de `<Layout>`.
 *
 * Se define como `<Routes>` para poder montarlo bajo cualquier router
 * (`BrowserRouter` en prod, `MemoryRouter` en tests).
 */

import { Navigate, Route, Routes } from "react-router-dom";

import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoginPage } from "@/features/auth/LoginPage";
import { RegisterPage } from "@/features/auth/RegisterPage";
import { ClosetPage } from "@/features/closet/ClosetPage";

export function AppRoutes() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protegidas: guard -> layout -> páginas */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<ClosetPage />} />
          {/* Sumar aquí más rutas protegidas (inventario, outfits, etc.). */}
        </Route>
      </Route>

      {/* Fallback: redirige a la raíz (el guard decidirá login si hace falta). */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
