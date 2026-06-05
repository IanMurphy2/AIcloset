// Placeholder de enrutamiento.
//
// El router definitivo (p. ej. react-router) se configurará en una issue
// posterior. Por ahora exportamos las rutas como una lista de descriptores
// para dejar la estructura feature-first lista.

export interface RouteDescriptor {
  path: string;
  label: string;
}

export const routes: RouteDescriptor[] = [{ path: "/", label: "Inicio" }];
