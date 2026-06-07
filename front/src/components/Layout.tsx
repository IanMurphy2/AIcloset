/**
 * Layout base de las rutas protegidas.
 *
 * Renderiza la navegación principal, la acción de logout y un `<Outlet />`
 * donde se montan las páginas hijas.
 */

import { LogOut } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-context";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [{ to: "/", label: "Mi armario" }];

export function Layout() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // Identidad a mostrar junto al botón, si el AuthContext la tiene disponible.
  const identity = user?.name ?? user?.email ?? null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b">
        <nav
          aria-label="Navegación principal"
          className="mx-auto flex w-full max-w-5xl items-center gap-4 px-4 py-3"
        >
          <span className="text-lg font-bold tracking-tight text-primary">
            AI Closet
          </span>
          <ul className="flex items-center gap-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end
                  className={({ isActive }) =>
                    cn(
                      "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                      isActive && "bg-muted text-foreground",
                    )
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
          {/* Acción de logout: solo visible con sesión activa. */}
          {isAuthenticated && (
            <div className="ml-auto flex items-center gap-3">
              {identity && (
                <span
                  className="text-sm text-muted-foreground"
                  data-testid="auth-identity"
                >
                  {identity}
                </span>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                aria-label="Cerrar sesión"
              >
                <LogOut aria-hidden="true" />
                Cerrar sesión
              </Button>
            </div>
          )}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
