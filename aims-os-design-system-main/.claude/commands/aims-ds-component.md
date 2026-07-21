# AIMS OS — DS Component Implementation Skill

**Invoke:** `/aims-ds-component [component name] [Figma node ID]`

Example: `/aims-ds-component Card 1234:5678`

---

## What this skill does

Guides the complete workflow to implement any AIMS OS Design System component into this repo with **100% token fidelity**. Every color, state, and property is extracted directly from Figma before any code is written.

**Core rule: NEVER write a color value without first running Phase 1.** No rgba approximations. No guessing. No "probably similar to". Every value must come from the extraction script output.

---

## PHASE 1 — Extract tokens from Figma (MANDATORY, always first)

### 1a. Verify the DS file is active in DevTools

Before running any script, confirm DevTools is pointed at the DS file:

```javascript
return figma.root.name;
// Must return: "Design System — AIMS OS"
// If not: ask the user to navigate DevTools to file v6rmYKA2zmyXWOahlxLOeI
```

### 1b. Run the Token Extraction Script

Replace `TARGET_NODE_ID` with the component set node ID from the Figma URL (`?node-id=XXXX-YYYY` → use `"XXXX:YYYY"`).

```javascript
const TARGET_NODE_ID = "REPLACE_WITH_NODE_ID";

// ── Helpers ────────────────────────────────────────────────────────────────

async function resolveVar(varId) {
  const v = await figma.variables.getVariableByIdAsync(varId);
  if (!v) return null;
  const col = await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId);
  const result = { name: v.name, modes: {} };

  for (const m of col.modes) {
    let val = v.valuesByMode[m.modeId];
    if (val?.type === 'VARIABLE_ALIAS') {
      const inner = await figma.variables.getVariableByIdAsync(val.id);
      if (inner) {
        const innerCol = await figma.variables.getVariableCollectionByIdAsync(inner.variableCollectionId);
        const innerVals = {};
        innerCol.modes.forEach(im => { innerVals[im.name] = inner.valuesByMode[im.modeId]; });
        val = { aliasName: inner.name, resolvedValues: innerVals };
      }
    }
    result.modes[m.name] = val;
  }
  return result;
}

function colorToString(c) {
  if (!c || c.r === undefined) return null;
  const r = Math.round(c.r * 255);
  const g = Math.round(c.g * 255);
  const b = Math.round(c.b * 255);
  const a = c.a ?? 1;
  if (a < 0.999) return `rgba(${r},${g},${b},${Math.round(a * 1000) / 1000})`;
  return '#' + [r,g,b].map(x => x.toString(16).padStart(2,'0')).join('');
}

function getModeValue(resolved, mode) {
  const m = resolved?.modes?.[mode];
  if (!m) return null;
  if (m.resolvedValues) {
    const keys = Object.keys(m.resolvedValues);
    const match = keys.find(k => k.toLowerCase() === (mode === 'Primary' ? 'light' : 'dark'));
    return colorToString(m.resolvedValues[match ?? keys[0]]);
  }
  return colorToString(m);
}

// ── Main extraction ────────────────────────────────────────────────────────

const root = await figma.getNodeByIdAsync(TARGET_NODE_ID);
if (!root) return { error: `Node ${TARGET_NODE_ID} not found. Check the node ID.` };
if (root.type !== 'COMPONENT_SET') return { warning: `Node is type "${root.type}", expected COMPONENT_SET. Continuing anyway.`, name: root.name };

const allVarIds = new Set();
const rawMap = {};

for (const comp of root.children) {
  const entry = { fills: [], strokes: [] };

  const layers = [comp, ...comp.findAll(() => true)];
  for (const layer of layers) {
    if ('fills' in layer && Array.isArray(layer.fills)) {
      layer.fills.forEach(f => {
        const id = f.boundVariables?.color?.id;
        if (id) { allVarIds.add(id); entry.fills.push({ layer: layer.name, layerType: layer.type, varId: id }); }
        else if (f.type === 'SOLID' && f.color) entry.fills.push({ layer: layer.name, layerType: layer.type, hardcoded: colorToString({ ...f.color, a: f.opacity ?? 1 }) });
      });
    }
    if ('strokes' in layer && Array.isArray(layer.strokes)) {
      layer.strokes.forEach(s => {
        const id = s.boundVariables?.color?.id;
        if (id) { allVarIds.add(id); entry.strokes.push({ layer: layer.name, layerType: layer.type, varId: id }); }
        else if (s.type === 'SOLID' && s.color) entry.strokes.push({ layer: layer.name, layerType: layer.type, hardcoded: colorToString({ ...s.color, a: s.opacity ?? 1 }) });
      });
    }
  }
  rawMap[comp.name] = entry;
}

// Resolve all variable IDs to names + mode values
const resolvedVars = {};
for (const id of allVarIds) {
  resolvedVars[id] = await resolveVar(id);
}

// Build final report
const report = { componentSet: root.name, states: {} };
for (const [stateName, tokens] of Object.entries(rawMap)) {
  report.states[stateName] = {
    fills: tokens.fills.map(f => f.hardcoded
      ? { layer: f.layer, type: f.layerType, varName: 'HARDCODED', primary: f.hardcoded, dark: f.hardcoded }
      : { layer: f.layer, type: f.layerType, varName: resolvedVars[f.varId]?.name ?? '?', primary: getModeValue(resolvedVars[f.varId], 'Primary'), dark: getModeValue(resolvedVars[f.varId], 'Dark') }
    ),
    strokes: tokens.strokes.map(s => s.hardcoded
      ? { layer: s.layer, type: s.layerType, varName: 'HARDCODED', primary: s.hardcoded, dark: s.hardcoded }
      : { layer: s.layer, type: s.layerType, varName: resolvedVars[s.varId]?.name ?? '?', primary: getModeValue(resolvedVars[s.varId], 'Primary'), dark: getModeValue(resolvedVars[s.varId], 'Dark') }
    ),
  };
}

return report;
```

### 1c. Read the output — build the token table

The script returns every state with fills and strokes. After running it, build a summary table:

```
State                         | Property | DS Token                  | primary     | dark
------------------------------|----------|---------------------------|-------------|-----
Type=Secondary,State=Default  | fill     | Surface/Neutral/White     | #ffffff     | rgba(255,255,255,0.1)
Type=Secondary,State=Default  | stroke   | Border/Neutral/Default    | #5c5c5c     | rgba(255,255,255,0.1)
Type=Secondary,State=Hover    | fill     | Surface/Neutral/Default   | #f2f2f2     | rgba(255,255,255,0.08)
Type=Secondary,State=Hover    | stroke   | Surface/Neutral/Emphasis  | #d9d9d9     | rgba(255,255,255,0.2)
...
```

**Any `HARDCODED` entry must be noted** — it means the DS layer has no variable bound. Use the value as-is but flag it in a comment.

**Any `?` varName** means the variable ID couldn't be resolved. Re-run Phase 1 targeting that specific state node ID directly.

---

## PHASE 2 — Map DS tokens to CSS variable names

### Naming convention

```
--[component]-[variant]-[property]
--[component]-[variant]-[property]-[state]    (state = hover / focus / active / disabled)
```

| Property in DS | CSS suffix |
|---|---|
| Fill / Background (default) | `-bg` |
| Fill / Background (hover) | `-hover-bg` |
| Fill / Background (focus) | `-focus-bg` |
| Fill / Background (active) | `-active-bg` |
| Fill / Background (disabled) | `-disabled-bg` |
| Stroke / Border (default) | `-border` |
| Stroke / Border (hover) | `-hover-bd` |
| Stroke / Border (focus) | `-focus-bd` |
| Stroke / Border (disabled) | `-disabled-bd` |
| Text fill | `-fg` |
| Text fill (disabled) | `-disabled-fg` |
| Icon fill | `-icon` |
| Effect / Ring | `-ring` |

### Anti-hallucination checkpoint

Before moving to Phase 3, verify:
- [ ] Every CSS variable has a `primary` value AND a `dark` value from Phase 1
- [ ] No values were invented or approximated — all come from script output
- [ ] All states are covered: Default, Hover, Focus, Disabled (+ Active if DS has it)
- [ ] Both fills AND strokes were checked for each state

---

## PHASE 3 — Add CSS variables to index.css

File: `src/index.css`

**Format — always add both blocks:**

```css
/* In :root, .dark {} */
/* Component — dark mode */
--[component]-[variant]-bg:          [dark_value];   /* DS token = primitive */
--[component]-[variant]-fg:          [dark_value];   /* DS token = primitive */
--[component]-[variant]-border:      [dark_value];   /* DS token = primitive */
--[component]-[variant]-hover-bg:    [dark_value];
--[component]-[variant]-hover-bd:    [dark_value];
--[component]-[variant]-focus-bd:    [dark_value];
--[component]-[variant]-disabled-bg: [dark_value];
--[component]-[variant]-disabled-bd: [dark_value];
--[component]-[variant]-disabled-fg: [dark_value];

/* In .light {} */
/* Component — light mode overrides */
--[component]-[variant]-bg:          [primary_value]; /* DS token = primitive */
--[component]-[variant]-fg:          [primary_value];
/* ... */
```

**Omit the `.light` override** only when `primary === dark` for that specific token.

**Comment format:** always include the DS token name + primitive alias on the same line:
```css
--btn-secondary-bg: #ffffff;  /* Surface/Neutral/White light = Gray/100 */
```

---

## PHASE 4 — React component implementation

File: `src/components/ui/[component].tsx`

### Rules
- All colors via `[var(--token)]` in Tailwind arbitrary values — zero hardcoded hex
- Use `cva` (class-variance-authority) for variant definitions
- `disabled:pointer-events-none` in base — then per-variant disabled styling
- For components with DS-specific disabled tokens: use `disabled:bg-[var(--x-disabled-bg)]` etc., NOT `disabled:opacity-40`
- For components without DS disabled tokens (Primary, Warning, etc.): use `disabled:opacity-40`
- Focus state: always check Phase 1 output for what changes on focus (border? bg? ring? all three?)

### Template

```tsx
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const [component]Variants = cva(
  [
    // base — layout, typography, transitions
    "inline-flex items-center ...",
    "transition-all duration-200",
    "outline-none",
    "disabled:pointer-events-none",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-[var(--x-primary-bg)] text-[var(--x-primary-fg)]",
          "hover:bg-[var(--x-primary-hover-bg)]",
          "focus-visible:ring-2 focus-visible:ring-[var(--x-primary-ring)]",
          "disabled:opacity-40",   // no DS-specific disabled for primary
        ],
        secondary: [
          "border border-[var(--x-secondary-border)]",
          "bg-[var(--x-secondary-bg)] text-[var(--x-secondary-fg)]",
          "hover:bg-[var(--x-secondary-hover-bg)] hover:border-[var(--x-secondary-hover-bd)]",
          "focus-visible:border-[var(--x-secondary-focus-bd)]",  // DS defines border change on focus
          "active:bg-[var(--x-secondary-active-bg)]",
          "disabled:bg-[var(--x-secondary-disabled-bg)] disabled:border-[var(--x-secondary-disabled-bd)] disabled:text-[var(--x-secondary-disabled-fg)]",
        ],
      },
      size: {
        sm: "h-[XYpx] px-[XYpx] ...",
        default: "h-[XYpx] px-[XYpx] ...",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  }
)
```

---

## PHASE 5 — Document the SPEC in App.tsx

Every component has a `[COMPONENT]_SPEC` constant with a `tokens` array. Values must come from Phase 1 output — never invent.

```tsx
tokens: [
  { role: "Background",          variable: "Surface/Neutral/White",    light: "#ffffff",    dark: "rgba(255,255,255,0.1)" },
  { role: "Border",              variable: "Border/Neutral/Default",   light: "#5c5c5c",    dark: "rgba(255,255,255,0.1)" },
  { role: "Text",                variable: "Text/Label",               light: "#2a2a2a",    dark: "rgba(255,255,255,0.6)" },
  { role: "Background hover",    variable: "Surface/Neutral/Default",  light: "#f2f2f2",    dark: "rgba(255,255,255,0.08)" },
  { role: "Border hover",        variable: "Surface/Neutral/Emphasis", light: "#d9d9d9",    dark: "rgba(255,255,255,0.2)" },
  { role: "Border focus",        variable: "Border/Neutral/Lighter",   light: "#bababa",    dark: "rgba(255,255,255,0.15)" },
  { role: "Background disabled", variable: "Surface/Neutral/Subtle",   light: "#fafafa",    dark: "rgba(255,255,255,0.05)" },
  { role: "Text disabled",       variable: "Text/Disabled",            light: "#bababa",    dark: "rgba(255,255,255,0.3)" },
],
```

---

## PHASE 6 — Verify against DS

Run this in DevTools to take a screenshot of the DS component for comparison:

```javascript
const node = await figma.getNodeByIdAsync("STATE_NODE_ID");
await node.screenshot();
```

Then compare in the browser at `localhost:5173`. Checklist:

- [ ] Light mode — default state matches DS screenshot
- [ ] Light mode — hover state correct
- [ ] Light mode — focus state: correct border/bg/ring
- [ ] Light mode — disabled state: correct colors (not just faded opacity)
- [ ] Dark mode — all four states above
- [ ] Text color is correct in both modes
- [ ] Icon color correct if component has icons
- [ ] Border width/style matches DS (0.5px? 1px?)
- [ ] Corner radius matches DS exact value
- [ ] Spacing/padding matches DS exact value

---

## Anti-hallucination rules (hard stops)

These apply throughout all phases. If any of these triggers, stop and re-run Phase 1:

1. **Never write `rgba(0,0,0,0.0XX)` or `rgba(255,255,255,0.0XX)` as a token value** unless Phase 1 output explicitly returned that value. Semitransparent blacks/whites are the most common hallucination pattern.

2. **Never reuse tokens from a different component** without verifying they're the same DS variable. `Field/bg` and `Button/bg` may look similar but can be different tokens.

3. **Never skip states.** If Phase 1 only covered Default and Hover, run it again for Focus and Disabled before writing CSS.

4. **Never assume dark mode mirrors light.** Always get both `primary` and `dark` values from Phase 1. They frequently differ by more than opacity.

5. **HARDCODED in the output = stop and ask.** If a layer has `HARDCODED` as varName, note it explicitly in a CSS comment and flag it to the user — it may be a DS error or an intentional override.

6. **Never use `opacity-40` for a component that has DS-defined disabled tokens.** Only use generic opacity for variants where Phase 1 shows NO fills/strokes in the disabled state.

7. **Never invent custom CSS alias tokens.** Before creating any new `--my-custom-*` variable in `index.css`, search for an existing token that maps to the same DS concept. The project already has tokens for every major DS concept (`--card-primary-bg` = `Surface/Primary/More Subtle`, `--primary` = `Icon/Primary/Default`, `--field-supporting` = `Text/Body`, etc.). Creating a new alias for an existing token introduces two bugs at once: it's a second source of truth that can diverge, and it hides the real DS name from the SpecPanel documentation. **If no existing token covers the concept, tell the user before creating one** — the correct response is "I don't see a token for X in `index.css`; should I add `--[name]` mapped to DS variable Y?"

8. **No hardcoded values in `.tsx` component files — ever.** Every color, background, and border in a component file must reference `var(--token-name)`. The only accepted exceptions are values that are structurally absolute in the DS: `#ffffff` for `Text/Negative` (white text on solid-colored surfaces), and `transparent`. Everything else is a CSS variable. If a Phase 1 value has no matching token in `index.css`, stop and add the token first — do not inline the raw value into the component.

9. **Audit before shipping.** After implementing any component, run a quick grep to confirm zero hardcoded colors remain:
   ```bash
   grep -n 'style={{.*"#\|style={{.*rgba\|bg-\[#\|text-\[#\|border-\[#' src/components/ui/[component].tsx
   ```
   If this returns any lines that are not referencing `var(--)`, treat them as bugs and fix before marking done.

---

## Day-to-day usage

```
You: /aims-ds-component Card 1234:5678
```

Claude will:
1. Run the extraction script on node `1234:5678`
2. Show the token table (every state × fill/stroke × primary/dark)
3. Propose the CSS variable names with exact values
4. Ask for confirmation before writing any file
5. Add to `index.css`, create `src/components/ui/card.tsx`, update `App.tsx` SPEC

**At any point** if you notice a value looks wrong, say "re-extract state X" — Claude will run Phase 1 again targeting that specific state node ID.

**If the component has text styles or spacing tokens** (not just colors), after running Phase 1 also run:

```javascript
// Get sizing and typography from a single component state
const node = await figma.getNodeByIdAsync("STATE_NODE_ID");
const info = {
  width: node.width, height: node.height,
  paddingLeft: node.paddingLeft, paddingRight: node.paddingRight,
  paddingTop: node.paddingTop, paddingBottom: node.paddingBottom,
  cornerRadius: node.cornerRadius,
  itemSpacing: node.itemSpacing,
};

// Get text styles from child text nodes
const texts = node.findAll(n => n.type === 'TEXT').map(t => ({
  name: t.name,
  fontSize: t.fontSize,
  fontWeight: t.fontWeight,
  fontFamily: t.fontName?.family,
  lineHeight: t.lineHeight,
}));

return { dimensions: info, typography: texts };
```

This gives you exact px values for height, padding, radius, and gap — no measuring manually in Figma.
