# Cómo generar una vista — AIMS OS Design System

Guía para Product Managers. Este repo contiene el DS en código: Claude lo usa para
construir pantallas que ya respetan tokens, componentes y spacing definidos por Design.

---

## Setup inicial (una sola vez)

**1. Instala los prerequisitos** (si aún no los tienes):
- [Node.js](https://nodejs.org) — elige la versión LTS
- [Git](https://git-scm.com)
- [Claude Code](https://claude.ai/code) — la app de escritorio

**2. Clona el repositorio:**
```bash
git clone [url-del-repo] aims-os-ds
cd aims-os-ds
npm install
```

Ya está. La carpeta `aims-os-ds` en tu máquina es permanente. No la borres.

**3. Cuando Design avise que hay componentes nuevos, actualiza con un comando:**
```bash
cd ~/aims-os-ds
git pull
```

---

## Uso diario — crear una pantalla nueva

**1. Abre Claude Code apuntando al repo:**
```bash
cd ~/aims-os-ds
claude
```
O bien: abre Claude Code → "Open project" → selecciona la carpeta `aims-os-ds`.

**2. Describe la pantalla en lenguaje natural.** Cuanta más especificidad, mejor resultado:

> "Crea una vista de lista de workflows para un tenant admin. Filtros por estado (Active, Draft)
>  y por categoría. Cada item muestra nombre, badge de estado, owner, y dos botones: Publish
>  (primario) y Edit (secundario)."

**Con URL de Figma (fidelidad máxima):**

> "Crea la vista de [nombre]. Referencia en Figma: [pega el node URL del frame]."

**3. Revisa en el navegador:**
```bash
npm run dev
# Abre http://localhost:5173
```
Itera con Claude: "Mueve los filtros arriba del tab", "Agrega paginación al fondo".

**4. Tu pantalla aparece automáticamente** en la sección "Prototypes" del sidebar del DS.

---

## Si falta un componente

Si lo que necesitas no existe en el DS, **no lo inventes ni le digas a Claude que lo cree**.
Claude lo manejará automáticamente:

- Intenta composición con componentes existentes primero.
- Si genuinamente no existe, crea el componente en `src/components/experimental/`
  con un comentario `DS-GAP` que Design usará para auditarlo.

Tú no haces nada extra. Sigue prototipando normalmente.

---

## Cómo entregar tu prototipo a Design

Comprime la carpeta `aims-os-ds` y compártela por Slack o Drive.

O, si usas Git:
```bash
git add .
git commit -m "Prototipo: [nombre breve]"
git push origin pm/[tu-nombre]-[feature]
# Comparte el nombre del branch con Michael
```

---

## Catálogo de componentes disponibles

Corre el DS en local (`npm run dev`) y navega el sidebar — ahí están todos los componentes
documentados con playground interactivo, variantes y tokens.

> Para el flujo completo con más detalle (incluyendo cómo Design audita tu entrega),
> ve a **DS Strategy → PM Working Guide** dentro del catálogo.

---

## Lo que el repo hace por ti automáticamente

- Solo usa componentes de `src/components/ui/` — nunca inventa botones ni inputs.
- Usa tokens de color, spacing y radio del DS — sin valores arbitrarios.
- Tema dark e Inter por defecto.
- Cualquier componente faltante queda marcado para revisión de Design (DS-GAP).
