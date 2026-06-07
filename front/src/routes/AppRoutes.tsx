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
import { OAuthCallbackPage } from "@/features/auth/OAuthCallbackPage";
import { RegisterPage } from "@/features/auth/RegisterPage";
import { AddClothingForm } from "@/features/closet/AddClothingForm";
import { ClosetPage } from "@/features/closet/ClosetPage";
import { ClothingDetailPage } from "@/features/closet/ClothingDetailPage";
import { EditClothingForm } from "@/features/closet/EditClothingForm";
import { OutfitBuilderPage } from "@/features/outfit/OutfitBuilderPage";
import { OutfitDetailPage } from "@/features/outfit/OutfitDetailPage";
import { OutfitsListPage } from "@/features/outfit/OutfitsListPage";

export function AppRoutes() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/auth/callback" element={<OAuthCallbackPage />} />

      {/* Protegidas: guard -> layout -> páginas */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<ClosetPage />} />
          {/*
            Orden defensivo: `new` antes que `:id`. React Router v7 igual
            rankea los segmentos estáticos por encima de los dinámicos, así que
            `/closet/new` matchea el alta y nunca cae en el detalle.
          */}
          <Route path="closet/new" element={<AddClothingForm />} />
          <Route path="closet/:id" element={<ClothingDetailPage />} />
          <Route path="closet/:id/edit" element={<EditClothingForm />} />
          <Route path="outfits" element={<OutfitsListPage />} />
          <Route path="outfits/new" element={<OutfitBuilderPage />} />
          <Route path="outfits/:id" element={<OutfitDetailPage />} />
          <Route path="outfits/:id/edit" element={<OutfitBuilderPage />} />
          {/* Sumar aquí más rutas protegidas (inventario, etc.). */}
        </Route>
      </Route>

      {/* Fallback: redirige a la raíz (el guard decidirá login si hace falta). */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
