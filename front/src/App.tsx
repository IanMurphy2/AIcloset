/**
 * Raíz de la aplicación.
 *
 * Monta el `BrowserRouter`, conecta el manejo de 401 con React Router y
 * renderiza el árbol de rutas. `AuthProvider` + `QueryClientProvider` los monta
 * `main.tsx` por encima de este componente.
 */

import { BrowserRouter } from "react-router-dom";

import { AppRoutes } from "@/routes/AppRoutes";
import { useUnauthorizedRedirect } from "@/routes/useUnauthorizedRedirect";

/**
 * Componente interno: vive dentro del router y del `AuthProvider`, por lo que
 * puede usar `useNavigate` y `useAuth` para refinar la redirección de 401.
 */
function AppContent() {
  useUnauthorizedRedirect();
  return <AppRoutes />;
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
