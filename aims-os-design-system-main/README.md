# AIMS OS — Prototyping Kit (starter)

Goal: let PMs generate high-fidelity prototypes that match the design system, with Claude Code,
without the design team redrawing every screen.

## How it removes the bottleneck
Fidelity is enforced by the SYSTEM, not by manual Figma redlines:
the AI reuses real, themed components instead of guessing from a visual description.

## Repo structure
```
aims-os-prototypes/
├── CLAUDE.md                 # tight rules — loaded every Claude Code session
├── tailwind.config.js        # tokens = single source of truth (synced from Figma vars)
├── .storybook/               # visual catalog of components (for PMs + as AI reference)
├── src/
│   ├── components/ui/         # the component library (shadcn/ui base, themed with your tokens)
│   │   ├── Button.tsx
│   │   ├── Button.figma.tsx   # Code Connect mapping  <-- the key consistency lever
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Table.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   └── Tabs.tsx
│   ├── screens/               # PM-generated prototypes go here
│   └── tokens.json            # exported from Figma "Semantic Color Tokens"
```

## Setup (one-time, design/eng)
1. `npx shadcn@latest init` then add core components; restyle each with your tokens.
2. Export Figma "Semantic Color Tokens" -> `tokens.json` -> feed into `tailwind.config.js`.
   (Keep this automated so nobody types a hex by hand.)
3. Add Code Connect to the core components (see Button.figma.tsx). Map Figma node ids.
4. Set up Storybook so every component has a story (visual catalog + AI reference).
5. Connect the Figma MCP server in Claude Code (Figma desktop app -> Dev Mode MCP).

## PM workflow (per prototype)
1. Open the repo in Claude Code.
2. Either describe the screen in plain language, or paste a Figma node URL.
3. Claude reuses library components (Code Connect) and tokens -> high-fidelity output.
4. Review the ~10-15% that needs adjustment. Expand the library when a real gap appears.

## Build order (MVP first — don't build all 40 components)
Week 1: tokens->config + 8-10 core components + Storybook
Week 1-2: CLAUDE.md + Figma MCP connected
Week 2: Code Connect on the core components
Then: onboard 1 PM, iterate, expand coverage.
