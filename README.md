# SmartCloset AI

**Documento de Definición de Producto y Funcionalidades**

SmartCloset AI es una plataforma de gestión de vestuario inteligente diseñada para digitalizar la experiencia de elegir qué vestir. La aplicación transforma fotos casuales de prendas en un inventario profesional, organizado y enriquecido mediante inteligencia artificial.

Al ser una herramienta que combina Visión Computacional (Computer Vision) con un motor de recomendación avanzado, su estructura está diseñada de forma modular para escalar correctamente.

---

## 1. Objetivos Principales

- **Digitalización Automatizada:** Eliminar la fricción de cargar el inventario manual mediante el procesamiento de imágenes (remoción de fondo y etiquetado automático).
- **Enriquecimiento de Datos:** Conectar las prendas físicas con su información técnica en línea (materiales, marca, cuidados) mediante búsqueda inversa y scraping.
- **Asistencia de Estilo y Contexto:** Actuar como un estilista personal que conoce cada pieza del clóset, sugiere combinaciones basadas en contexto (clima, evento, temporada), y añade recomendaciones extra tras consultar previsiones meteorológicas.

---

## 2. Módulos Funcionales Principales

### 2.1. Módulo de Ingesta y Visión (Pipeline de IA)

- **Procesamiento:** Carga de archivos y eliminación de fondo automática (Background Removal).
- **Clasificación Multiclase:** Identificación automática del tipo de prenda, color, patrón y textil.
- **Semántica:** Generación de descripciones detalladas mediante un modelo de lenguaje (LLM).

### 2.2. Módulo de Catalogación

- **Base de datos:** Inventario de prendas con filtrado avanzado por etiquetas (tags).
- **Búsqueda inversa:** Integración con APIs para localizar la "fuente original" de la prenda en internet.

### 2.3. Módulo de Outfits y Gestión de Privacidad

- **Creador Manual:** Canvas interactivo de "arrastrar y soltar" para armar conjuntos.
- **Selector de Visibilidad:**
  - *Privado:* Almacenado de forma encriptada; exclusivo para el usuario.
  - *Público:* Disponible en el Feed global de la Comunidad.
- **Gestión de Colecciones:** Espacios para organizar outfits propios y guardados de terceros.

### 2.4. Sistema de Recomendación (AI Stylist)

- **Outfits "On-Demand":** Generación de conjuntos basados estrictamente en las prendas existentes del usuario.
- **Recomendación Contextual Avanzada:** Consulta el clima para la fecha de un evento y ofrece sugerencias proactivas de abrigo, accesorios (ej. paraguas) y consideraciones de seguridad (ej. protector solar).
- **Visualización de Prueba Virtual (Virtual Try-On):** Generación de imágenes del usuario vistiendo el outfit elegido mediante IA, reduciendo la fricción de decisión.
- **Análisis de "Huecos":** Identificación de prendas faltantes en el clóset para sugerir nuevas compras que complementen el inventario actual.
- **Aprendizaje del Feed (Integración Social):** La IA utiliza el sistema de ratings de la comunidad (5 estrellas) para aprender qué combinaciones tienen "alto valor estético" y mejorar sus sugerencias privadas.

### 2.5. Módulo Social (Comunidad de Estilo)

- **Feed Explorar:** Algoritmo que muestra outfits públicos de la comunidad basados en tags (ej. "Invierno", "Gala").
- **Interacción:** Sistema de ratings (0-5 estrellas) y un hilo de comentarios por outfit.
- **Social Saving:** Capacidad de guardar outfits de terceros como referencia o inspiración, sin comprometer la privacidad del inventario original.
- **Panel de Estadísticas del Creador (Analytics):** Dashboard donde el autor de un outfit público puede visualizar el rendimiento de sus creaciones, incluyendo la valoración promedio y el número de veces que ha sido guardado por otros usuarios.
- **Sistema de Notificaciones:** Envío automatizado de correos electrónicos (y notificaciones push) al creador original cada vez que otro miembro de la comunidad guarda su outfit en sus colecciones, incentivando la participación activa.

---

## 3. Diagrama Funcional de Flujos

### A. Flujo de Carga (Ingesta) y Enriquecimiento

1. **Sube foto:** El usuario carga la imagen de la prenda.
2. **Procesamiento (IA):** Remoción de fondo y extracción de características (Feature Extraction).
3. **Enriquecimiento:** Búsqueda en internet para obtener metadata adicional (URL oficial, precio, composición). Priorizando tags críticos (tipo, textil) sobre informativos para optimizar tiempos.
4. **Confirmación:** El usuario valida los tags generados. Si la IA tiene "baja confianza" en su análisis, se asigna un tag predeterminado para revisión manual en lugar de forzar un error.

### B. Flujo de Creación y Publicación de Outfits

1. **Diseño:** El usuario selecciona prendas manualmente o pide asistencia a la IA (ej. *"Outfit para cena elegante en invierno"*).
2. **Etiquetado Automático:** La IA sugiere automáticamente tags para el conjunto (ej. "Formal", "Invierno").
3. **Privacidad:** El usuario decide si el outfit es Privado o Público.
4. **Publicación:** Si es público, se indexa en el Feed Global para recibir interacciones.

### C. Flujo de Interacción en el Feed (Usuario B)

1. **Descubrimiento:** El "Usuario B" ve un outfit público del "Usuario A".
2. **Acción (Puntuar/Comentar):** Actualiza el rating global, las estadísticas del Usuario A, o interactúa en el hilo.
3. **Social Saving Inteligente:** El Usuario B guarda el outfit. Ocurren dos acciones simultáneas:
   - **Notificación al Creador:** El sistema dispara un correo electrónico al Usuario A informándole: *"¡A alguien le encantó tu estilo! Tu outfit ha sido guardado"*. Además, se actualiza el contador en su Panel de Estadísticas.
   - **Replicación:** La IA ofrece al Usuario B la opción de *"Buscar equivalentes en mi clóset"*, iniciando un micro-flujo que recrea el look ajeno usando las propias prendas del Usuario B.

### D. Flujo de Recomendación de Compras

1. **Análisis:** La IA revisa los outfits más usados y las prendas "huérfanas" (piezas difíciles de combinar).
2. **Acción:** Busca en tiendas online (e-commerce) piezas clave que maximicen la cantidad de combinaciones posibles con el inventario actual.

---

## 4. Resumen de Mejoras de Usabilidad y UX

Para garantizar una experiencia fluida e inmersiva, el proyecto se centra en:

- **Prueba Virtual (Virtual Try-On):** El usuario puede cargar una foto suya de cuerpo completo y visualizarse hiperrealistamente vistiendo la sugerencia de la IA.
- **"Top Outfits" de IA:** Permitir al usuario pedirle al AI Stylist que arme un conjunto "Inspirado en el Top del Feed" utilizando su propia ropa.
- **Manejo de Incertidumbre:** Comunicación transparente cuando la IA no está segura de una prenda, pidiendo ayuda humana en lugar de clasificar mal.
- **Etiquetado Automático y Búsqueda de Equivalentes:** Automatización de tareas tediosas para mantener al usuario inspirado y no abrumado por la gestión de datos.

---

## 5. Etapas de Desarrollo (Roadmap)

### V1: MVP Básico y Persistencia (Gestión Manual)

**Objetivo:** Validar la utilidad básica de organizar el clóset digitalmente y crear la estructura base de usuarios.

- Sistema de Autenticación (Registro e Inicio de sesión).
- Base de datos en la nube (persistencia) para guardar inventario y outfits.
- Subida manual de fotos de prendas.
- Categorización completamente manual por parte del usuario.
- Creador de outfits "rústico" (lienzo drag-and-drop).
- *Sin funciones sociales, sin notificaciones y sin Inteligencia Artificial.*

### V2: Introducción de IA Visual (Visión Computacional)

**Objetivo:** Eliminar la fricción de la carga manual inicial de prendas usando modelos visuales.

- Integración del Módulo de Visión (IA): Remoción de fondo automática.
- Auto-etiquetado de prendas: Detección básica inicial.

### V3: Inteligencia de Estilo (Motor de Recomendación Básico)

**Objetivo:** Aportar verdadero valor tecnológico procesando la ropa que el usuario ya subió.

- Motor de Recomendación (AI Stylist): Generación de outfits automáticos.
- Etiquetado automático de los outfits creados.

### V4: Comunidad y Contexto (El "Instagram del Estilo")

**Objetivo:** Fomentar el engagement de los usuarios a través de la interacción social.

- Feed Global, interacciones (Likes/Ratings, Comentarios) y Panel de Estadísticas.
- Social Saving con envíos de correo automático al creador.
- Recomendación Contextual (Clima).
- "Buscar equivalentes en mi clóset" al guardar outfits de terceros.

### V5: Experiencia Inmersiva y Monetización (E-commerce)

**Objetivo:** Cerrar el ciclo de consumo y brindar una experiencia hiperrealista.

- Prueba Virtual (Virtual Try-On).
- Análisis de "Huecos" y recomendación de compras (integración e-commerce).

---

## 6. Estrategia de Negocio

**Público Objetivo:** Entusiastas de la moda que buscan inspiración y validación social, profesionales ocupados que desean optimizar su tiempo al vestirse, y usuarios minimalistas interesados en maximizar su "clóset cápsula".

**Modelo de Negocio:**
- *Freemium:* Uso básico gratuito; funciones avanzadas (AI Stylist, Virtual Try-On) bajo modelo de suscripción mensual.
- *Afiliados:* Generación de ingresos mediante comisiones (CPA) al derivar usuarios a e-commerce desde el módulo de recomendación de compras (V5).

---

## 7. Métricas de Éxito y Mitigación de Riesgos

**KPIs Principales:**
- *Engagement:* Cantidad promedio de prendas cargadas por usuario y outfits creados semanalmente.
- *Precisión de IA:* Porcentaje de veces que el usuario acepta el etiquetado automático sin editarlo manualmente.

**Riesgos y Mitigaciones:**

| Riesgo | Mitigación |
| :--- | :--- |
| Clasificación errónea de prendas por la IA | Implementar un flujo "Human-in-the-loop" donde el usuario siempre tenga la última palabra para editar metadata |
| Altos costos de procesamiento en la nube por imágenes | Compresión estricta en el lado del cliente (frontend) antes del envío y arquitectura Serverless/Event-driven para los procesos pesados |

---

## 8. Arquitectura y Stack Tecnológico

El proyecto está diseñado bajo una arquitectura modular y escalable, preparada para soportar alta concurrencia y procesamiento asíncrono. La arquitectura sigue una separación estricta entre la **Capa de Transporte (API)** y la **Capa de Dominio (Lib)**.

### 8.1. Stack Tecnológico Principal

| Componente | Tecnología |
| :--- | :--- |
| **Runtime** | Node.js 20 |
| **Lenguaje** | TypeScript 5 (strict mode, decorators habilitados) |
| **Framework HTTP** | Express 4 |
| **ORM** | TypeORM 0.3 (PostgreSQL) |
| **Cache / Colas** | Redis vía ioredis |
| **Autenticación** | Passport.js (local, Google SSO, Microsoft SSO) + JWT propio |
| **Configuración** | convict + dotenv |
| **Validación** | class-validator |
| **Documentación API** | TSOA (genera OpenAPI/Swagger automáticamente) |
| **Eventos** | AWS EventBridge (Event-driven) |
| **i18n** | i18next con backend de filesystem |
| **Logging** | @alanszp/logger (structured JSON logging) |
| **Monitoreo** | New Relic |
| **Testing** | Jest + Supertest + Rosie (factories) + Faker |

### 8.2. Estructura de Carpetas

```
src/
├── api/                        # Capa HTTP
│   ├── index.ts                # Entrypoint del servidor
│   ├── ExpressApp.ts           # Configuración de Express (middlewares + rutas)
│   ├── controllers/            # Funciones que manejan request/response
│   ├── routes/                 # Definición de rutas Express (Router)
│   ├── endpoints/              # Controllers TSOA (decorados, generan docs automáticas)
│   ├── middlewares/            # Middlewares (auth, context, roles, MFA)
│   └── tsoa/                   # Rutas auto-generadas por TSOA
├── lib/                        # Capa de dominio/negocio
│   ├── commands/               # Lógica de negocio (orquestadores)
│   ├── models/                 # Entidades TypeORM + Inputs (DTOs validables)
│   ├── repositories/           # Queries a base de datos
│   ├── views/                  # Transformadores entity → response JSON
│   ├── clients/                # Clientes HTTP a otros microservicios
│   ├── events/                 # Publishers de eventos (EventBridge)
│   ├── helpers/                # Utilidades (error handling, audit, etc.)
│   ├── reports/                # Lógica de reportes complejos
│   ├── validators/             # Validadores adicionales
│   ├── mappers/                # Mapeadores
│   └── utils/                  # Funciones utilitarias
├── workers/                    # Workers que procesan colas (BullMQ/Redis)
├── queues/                     # Configuración del queue manager
├── serverless/                 # Funciones lambda/serverless
├── scripts/                    # Scripts utilitarios
├── test/                       # Tests unitarios e integración
├── config.ts                   # Configuración centralizada (convict)
├── dbConnection.ts             # Conexiones a BD (principal, read-replica, DW)
├── ormconfig.ts                # Configuración de TypeORM
├── cache.ts                    # Wrapper de Redis para cache
├── logger.ts / getLogger.ts    # Logger con contexto compartido
├── getContext.ts               # Shared context (request-scoped)
├── passportInstance.ts         # Estrategias de autenticación
└── translations.ts             # i18next setup
```

### 8.3. Patrón de Implementación

Para asegurar la mantenibilidad, cada flujo debe seguir esta cadena de responsabilidades:

```
Route → Controller → Input.validate() → Command → Repository → View
```

1. **Route/Endpoint:** Recibe el request.
2. **Input Validation:** `class-validator` asegura que los datos sean correctos antes de seguir.
3. **Command:** Ejecuta la lógica de negocio (ej. `CreateUserCommand`).
4. **Repository:** Interactúa con PostgreSQL.
5. **View:** Formatea la salida (Entity → JSON).

### 8.4. Guía para Replicar la Arquitectura

1. **Inicializar proyecto:** Crear un proyecto TypeScript con Node 20 y configurar el `tsconfig.json` asegurando que los decorators estén habilitados (`"experimentalDecorators": true`, `"emitDecoratorMetadata": true`).
2. **Dependencias Core:** Instalar paquetes principales: `express`, `typeorm`, `pg`, `convict`, `dotenv`, `class-validator`, `ioredis`, `passport` y `tsoa`.
3. **Estructura Base:** Crear el esqueleto de carpetas según el estándar definido arriba: `api/{controllers,routes,middlewares,endpoints}` y `lib/{commands,models,repositories,views,clients,helpers}`.
4. **Configuración Tipada:** Configurar `convict` creando un esquema fuertemente tipado para centralizar y validar todas las variables de entorno.
5. **Capa de Datos (ORM):** Configurar TypeORM creando la instancia del `DataSource` y aplicando `SnakeNamingStrategy` para mantener consistencia en la base de datos PostgreSQL.
6. **Patrón de Arquitectura:** Implementar el flujo estándar de procesamiento: `Route → Controller → Input.validate() → Command → Repository → View`.
7. **Contexto Compartido:** Implementar `SharedContext` utilizando `AsyncLocalStorage` de Node.js para trazar logs (logger) y auditorías a lo largo del ciclo de vida de un request sin pasar variables manualmente.
8. **Documentación Automática:** Configurar y compilar TSOA para que genere las rutas y las especificaciones de Swagger/OpenAPI basándose en los controladores decorados de la carpeta `endpoints/`.
9. **Contenedores:** Dockerizar la aplicación mediante un `Dockerfile` multi-stage (optimizando el peso de la imagen final) y configurar el `docker-compose` para levantar la BD, Redis y la UI de Swagger localmente.
