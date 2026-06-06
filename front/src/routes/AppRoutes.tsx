/**
 * Árbol de rutas de la app.
 *
 * - `/login` es pública (placeholder hasta IAN-10).
 * - El resto cuelga de `<ProtectedRoute>` y se renderiza dentro de `<Layout>`.
 *
 * Se define como `<Routes>` para poder montarlo bajo cualquier router
 * (`BrowserRouter` en prod, `MemoryRouter` en tests).
 */

import { Navigate, Route, Routes } from "react-router-dom";

import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoginPage } from "@/features/auth/LoginPage";
import { AddClothingForm } from "@/features/closet/AddClothingForm";
import { ClosetPage } from "@/features/closet/ClosetPage";

export function AppRoutes() {
  return (
    <Routes>
      {/* Pública */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protegidas: guard -> layout -> páginas */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<ClosetPage />} />
          <Route path="closet/new" element={<AddClothingForm />} />
          {/* Sumar aquí más rutas protegidas (inventario, outfits, etc.). */}
        </Route>
      </Route>

      {/* Fallback: redirige a la raíz (el guard decidirá login si hace falta). */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
