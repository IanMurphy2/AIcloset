# Domain Docs

Cómo los skills de ingeniería deben consumir la documentación de dominio de este repo.

## Antes de explorar, lee estos archivos

- **`CONTEXT-MAP.md`** en la raíz — apunta a los `CONTEXT.md` por contexto. Lee el que sea relevante para el área en la que trabajas.
- **`docs/adr/`** — decisiones arquitectónicas globales (todo el sistema).
- **`back/docs/adr/`** — decisiones específicas del backend.
- **`front/docs/adr/`** — decisiones específicas del frontend.

Si alguno de estos archivos no existe, **procede en silencio**. No lo menciones ni sugieras crearlo; el skill `/grill-with-docs` los crea de forma lazy cuando se resuelven términos o decisiones reales.

## Estructura de archivos

```
/
├── CONTEXT-MAP.md              ← apunta a los CONTEXT.md por contexto
├── docs/adr/                   ← decisiones globales del sistema
├── back/
│   ├── CONTEXT.md              ← dominio y glosario del backend
│   └── docs/adr/               ← decisiones específicas del backend
└── front/
    ├── CONTEXT.md              ← dominio y glosario del frontend
    └── docs/adr/               ← decisiones específicas del frontend
```

## Usa el vocabulario del glosario

Cuando tu output nombre un concepto de dominio (en un título de issue, una propuesta de refactor, una hipótesis, un nombre de test), usa el término tal como está definido en el `CONTEXT.md` correspondiente. No uses sinónimos que el glosario evita explícitamente.

## Señala conflictos con ADRs

Si tu output contradice un ADR existente, indícalo explícitamente en lugar de sobreescribir silenciosamente:

> _Contradice ADR-0002 (autenticación JWT) — pero vale la pena reabrirlo porque…_
