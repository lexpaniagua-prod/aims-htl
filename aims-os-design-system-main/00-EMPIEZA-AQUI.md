# EMPIEZA AQUÍ — AIMS OS Prototyping Kit

Esta guía es para ti (no para Claude). Síguela en orden.

## Paso 0 — En Figma (puedes hacerlo desde cualquier computador)
1. Termina de renombrar componentes duplicados (ej. el "Tab Switcher" que aún aparece dos veces).
2. Desvincula librerías externas que no uses (ej. "Data Full").
3. **PUBLICA la librería.** Editar no basta: los cambios no llegan al MCP ni a Code Connect
   hasta que publicas. (Panel Assets → Publish, o el menú de la librería.)
4. Chequea que existan variables de spacing y radius:
   abre el archivo, sin seleccionar nada abre "Local variables" en la barra derecha.
   Busca una colección de tipo número con 4/8/12/16 (spacing) y 8/10/16 (radius).
   Si NO existen, créalas antes de seguir — es lo que más afecta la fidelidad.

## Paso 1 — Prepara la MacBook
1. Instala (si no los tienes): Node.js, la app de escritorio de Figma, Claude Code.
2. Abre la app de escritorio de Figma y deja tu archivo del design system abierto.
   (Esto enciende el servidor MCP de Figma que Claude Code usará.)

## Paso 2 — Crea la carpeta del proyecto
1. Crea una carpeta vacía, por ejemplo `aims-os-prototypes`.
2. Copia DENTRO de ella estos archivos del kit:
   - `CLAUDE.md`          → tal cual, en la raíz
   - `kickoff-prompt.md`  → en la raíz (lo usarás en el paso 3)
   - `tailwind.config.example.js` → en la raíz
   - `Button.figma.tsx`   → en la raíz por ahora (Claude lo moverá a su lugar)

## Paso 3 — Arranca Claude Code
1. Abre la Terminal.
2. Entra a la carpeta:  `cd ` y arrastra la carpeta a la terminal, luego Enter.
3. Escribe:  `claude`  y Enter.
4. Copia TODO el contenido de `kickoff-prompt.md` y pégalo como tu primer mensaje.
5. Claude Code hará el montaje y te irá explicando. Cuando te pida validar algo, míralo y responde.

## Paso 4 — Testea (cuando termine el setup)
- Smoke test: pregúntale "¿qué color primary define este proyecto?". Debe dar tu hex exacto.
- Reutilización: pídele una pantalla simple y revisa que importe el Button de la librería, no uno nuevo.
- Fidelidad: pídele reproducir una pantalla que ya tengas en Figma y compárala lado a lado.

## Qué NO necesitas todavía
- Code Connect requiere un asiento Dev/Full en plan Organization/Enterprise.
  Puedes arrancar SIN él y ya verás un gran salto de fidelidad. Lo agregas después.
