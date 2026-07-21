KICKOFF PROMPT — pega esto como tu primer mensaje en Claude Code

---

Eres mi copiloto para montar un proyecto de prototipos de UI. Soy diseñador de producto, NO
tengo mucha experiencia técnica, así que:
- Ejecuta tú los comandos (no me pidas que los escriba yo).
- Explícame en lenguaje simple qué haces en cada paso y por qué.
- Detente y pregúntame cuando necesites una decisión o cuando deba validar algo visualmente.
- Si algo falla, dímelo en simple y propón la solución.

CONTEXTO DEL PROYECTO
- Es la base para que mis colegas (Product Managers) generen prototipos de alta fidelidad de
  AIMS OS, manteniendo consistencia con nuestro Design System. Será un repo en GitHub que ellos
  usarán como base de conocimiento.
- El Design System vive en Figma. Tengo la app de escritorio de Figma abierta y el MCP de Figma
  disponible. File key: v6rmYKA2zmyXWOahlxLOeI
- Stack: React + TypeScript + Tailwind + shadcn/ui. Tema por defecto: dark. Fuente: Inter.
- En esta carpeta ya hay: CLAUDE.md, tailwind.config.example.js, Button.figma.tsx.

LO QUE QUIERO QUE HAGAS, EN ESTE ORDEN (pausando para validar):

1) Verifica prerequisitos (node, npm). Dime versiones. Si falta algo, indícame cómo instalarlo.

2) Crea el proyecto base: Vite + React + TypeScript + Tailwind en esta carpeta.
   Inicializa git. Renombra tailwind.config.example.js a tailwind.config.js y úsalo.

3) Tokens: usando el MCP de Figma sobre el file key de arriba, extrae las variables reales de
   estas colecciones y reemplaza los valores semilla del config por los oficiales:
   - "Semantic Color Tokens"  -> colores
   - "Space and Radios Tokens" -> spacing y radius
   - "Type Tokens"            -> tipografía (tamaños, pesos, line-heights)
   Guarda todo también en src/tokens.json. Si alguna colección no la encuentras, AVÍSAME antes
   de inventar valores.

4) Inicializa shadcn/ui. Agrega e instala estos componentes núcleo y re-estilízalos con MIS
   tokens (no con los defaults de shadcn): Button, Input, Card, Table, Tabs; y crea Sidebar y
   Topbar propios. Para cada uno:
   - Pídeme el node URL del componente en Figma y úsalo como referencia vía MCP.
   - Respeta las variantes/estados que ya existen en el DS (no inventes variantes).
   - Muéstrame el resultado y espera mi OK antes de pasar al siguiente.

5) Storybook: configúralo y crea una historia por componente (catálogo visual para mis colegas).

6) Crea src/components/ui/ y src/screens/. Mueve Button.figma.tsx junto a Button.tsx.

7) Documentación para colegas: crea/actualiza el README explicando cómo un PM genera una vista
   nueva (abrir el repo en Claude Code, describir la pantalla o pegar un node URL, revisar).

8) Smoke test final: confirma que el color "primary" del proyecto sale de los tokens (mi hex
   exacto), y que una pantalla de ejemplo importa el Button de la librería y no uno nuevo.

No avances al siguiente paso sin mi confirmación. Empieza por el paso 1.
