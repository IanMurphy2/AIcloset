# Issue Tracker — Linear via MCP

Issues, proyectos e initiatives de este repo viven en **Linear**.

## Cómo crear y gestionar issues

El servidor MCP `linear` está disponible en esta sesión. Úsalo para todas las operaciones de Linear — no uses la UI ni la API directamente.

Operaciones comunes:
- Crear issue → usa la herramienta `linear` con la acción de creación de issue
- Crear proyecto / initiative → usa la herramienta `linear` con la acción de creación de proyecto
- Buscar issues existentes → usa la herramienta `linear` con la acción de búsqueda

## Workflow

1. Cuando `to-issues` o `to-prd` generan issues, créalos directamente via MCP en el team de Linear correspondiente a este repo.
2. Aplica el label de triage correcto al crear (ver `docs/agents/triage-labels.md`).
3. Si el MCP no está disponible en la sesión, genera el contenido como Markdown y notifica al usuario para que lo pegue manualmente en Linear.

## Estructura esperada en Linear

- **Initiative** → equivale al PRD o épica de alto nivel
- **Projects** → agrupan issues relacionados dentro de la initiative
- **Issues** → unidades de trabajo independientes (tracer-bullet vertical slices)
- **Milestones** → hitos de entrega dentro de un proyecto
