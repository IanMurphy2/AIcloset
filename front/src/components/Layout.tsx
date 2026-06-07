/**
 * Layout base de las rutas protegidas.
 *
 * Renderiza la navegación principal y un `<Outlet />` donde se montan las
 * páginas hijas. La acción de logout se conectará en IAN-12; dejamos el slot
 * en la nav para no rehacer el layout entonces.
 */

import { NavLink, Outlet } from "react-router-dom";

import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [{ to: "/", label: "Mi armario" }];

export function Layout() {
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
          {/* Slot para la acción de logout (IAN-12). */}
          <div className="ml-auto" />
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
