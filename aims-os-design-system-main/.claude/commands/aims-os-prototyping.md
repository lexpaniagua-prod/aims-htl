# AIMS OS — Prototyping Consistency Skill

**Invoke:** `/aims-os-prototyping`

Run this at the start of any PM prototyping session — or any time you're about to generate or modify a screen in `src/screens/`. It loads the full interaction ruleset and the pre-delivery checklist so nothing is skipped.

---

## What this skill enforces

Every screen generated in this repo must:

1. Use **only** components from `src/components/ui/` and `src/components/layouts/`
2. Use **only** `var(--token)` for colors — zero hardcoded hex/rgba in `.tsx`
3. Wire **every interactive element** — no buttons, filters, or chips left with `onClick={undefined}`
4. Pass `npx tsc -b --noEmit` with **zero errors** before marking complete
5. Be visually verified with a **browser screenshot** — TypeScript passing ≠ screen rendering correctly

---

## Interaction pairing rules (non-negotiable)

Every interactive element must have its DS-standard counterpart wired. If it's present, it must work.

| Element present | Required counterpart |
|---|---|
| `showAllFilters={true}` on `ListViewSection` | `onAllFiltersClick` → opens `<FiltersSlideout>` |
| `<FiltersSlideout>` | `onApply` resets to page 1 + closes; `onClearAll` clears applied filters |
| Filter slot `onOpen` | Fixed-position dropdown with backdrop + real dataset options |
| Filter slot `onRemove` | Clears value + resets to page 1 |
| `<SlideOut>` | `onClose` always wired; never `open` hardcoded to `true` |
| Nav chips (`chips` prop) | `selectedChip` + `onChipSelect` with page reset |
| Any filter, sort, or tab change | Resets pagination to page 1 |
| `<Pagination>` | Only renders when `total > pageSize`; hidden otherwise |

---

## Correct component for each situation

Use these — never build from scratch:

| Need | Use |
|---|---|
| Filters bar (search + filter chips) | `Filters` component with `slots` prop |
| Advanced filter panel | `FiltersSlideout` — never a Modal |
| Secondary view toggle (List/Grid) | `SwitchTab` — never custom buttons |
| Inline filter dropdown | Slot in `Filters` + `getBoundingClientRect()` positioned overlay |
| Item detail panel | `SlideOut` |
| Destructive confirmation | `ModalDialog` |
| Overview / KPI widgets | `WidgetCanvasView` with `HighlightIcon` |
| Log / activity history | `Table` inside `ListViewSection` + `Pagination` (page size 10) |
| Page layout | `ScreenLayout` — always, no exceptions |
| List of entity cards | `ListViewSection` — search + filters + entity cards pre-wired |

---

## Token rules

- **No hex. No rgba.** Every color in `.tsx` must be `var(--token-name)`.
- If the token doesn't exist → **stop and tell the user** before creating it.
- Dropdown overlay standard tokens:
  - `background: "var(--surface)"`
  - `border: "0.5px solid var(--field-border)"`
  - `boxShadow: "var(--shadow-elevation-3)"`
- Active state in a dropdown option:
  - `background: "var(--color-surface-primary-subtle)"`
  - `color: "var(--primary)"`, `fontWeight: 600`

---

## Navigation spacing — always 24px between layers (DS spec, Figma node 14660-136237)

```
Tabs  →  24px  →  SwitchTab  →  24px  →  Filters  →  24px  →  Chips (nav)  →  24px  →  Entity list
```

- Gap between entity cards: **12px**
- `SwitchTab` always needs `w-fit` (already in the component) — never stretches full width

---

## Pre-delivery checklist

Run in this exact order before marking any screen complete:

- [ ] `npx tsc -b --noEmit` → 0 errors
- [ ] Screenshot of **every tab** — no tab left unverified
- [ ] Every button/chip/slot has an `onClick` handler (not `undefined`)
- [ ] `showAllFilters={true}` has `onAllFiltersClick` wired to `<FiltersSlideout>`
- [ ] All filter/tab/sort changes reset pagination to page 1
- [ ] Zero hardcoded colors — grep `rgba\|#[0-9a-fA-F]` in the screen file to verify
- [ ] Prototyped data uses real-looking values (names, dates, IDs) — no "Lorem ipsum" or "Option A"

---

## Button hierarchy

- `variant="main"` → **header CTA only** (`Header` component's `primaryAction` prop). Max 1 per screen.
- `variant="primary"` → content-area actions inside widgets, cards, SlideOuts, table rows.
- **Never use `main` inside a widget, card, or SlideOut** — always `primary` there.
- **Max 2 `primary` buttons visible at the same time** in a single viewport.
- Action order always: `main` (header) → `primary` → `secondary` → `tertiary`.

---

## Common mistakes this skill prevents

These appeared in real sessions — Claude knows to avoid them:

- `showAllFilters={true}` with no `onAllFiltersClick` → button exists but does nothing
- Using a standalone `<Select>` instead of a `Filters` slot → inconsistent with DS filter bar
- Passing `chips` as `string[]` → TypeScript error; must be `NavChip[]` (`{ label: string }`)
- `SwitchTab` stretching full-width in flex-column parents → already fixed in component via `w-fit`
- Building a custom dropdown from scratch instead of using the `Filters` + `onClickCapture` pattern
- Spacing between nav layers inconsistent → always **24px** between every nav tier (Figma node 14660-136237)
- `ListViewSection` inside a flex `gap` container causes double-spacing: the outer `gap` stacks with the internal `mt` values because `ListViewSection` returns a fragment. Fix: use `gap: 0` on the wrapper and `mb-[24px]` on the element above `ListViewSection` (e.g. `<SwitchTab className="mb-[24px]" />`)

---

## File ownership reminder

PMs only create and edit files in `src/screens/`. Never modify:
- `src/components/ui/` — DS components (Michael only)
- `src/App.tsx` — DS registry (Michael only)
- `src/index.css` — design tokens (Michael only)
- `CLAUDE.md` — AI rules (Michael only)
