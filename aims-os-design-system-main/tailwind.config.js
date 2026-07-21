/**
 * tailwind.config.js — AIMS OS Design System
 *
 * AUTO-GENERATED from Figma variable collections (file: v6rmYKA2zmyXWOahlxLOeI)
 * Collections synced:
 *   - "Semantic Color Tokens" (162 vars) → colors, Dark mode
 *   - "Space and Radios Tokens" (21 vars) → spacing + borderRadius
 *   - "Type Tokens" (54 vars) → fontSize, fontWeight
 *
 * DO NOT edit values by hand. Re-sync from Figma when DS updates.
 */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx,html}"],
  theme: {
    extend: {
      colors: {
        // ─── Canvas / Base backgrounds (dynamic — changes with .dark / .light) ──
        canvas:    "var(--canvas)",   // bg-canvas → follows theme class
        "node-bg": "var(--surface)", // bg-node-bg → follows theme class

        // ─── Surface ─────────────────────────────────────────────────────────
        surface: {
          DEFAULT:  "#0D1120",  // bg-surface shortcut (CLAUDE.md)
          neutral: {
            white:    "#ffffff1a",
            subtle:   "#ffffff0d",
            default:  "#ffffff14",
            emphasis: "#ffffff33",
            focus:    "#ffffff26",
            darker:   "#ffffff33",
            black:    "#fafafa",
            inverse:  "#ffffff",
          },
          primary: {
            "more-subtle": "#2b7fff14",
            subtle:   "#155dfc26",
            lighter:  "#1d2f4f",
            default:  "#155dfc",
            emphasis: "#2b7fff",
            darker:   "#1032a0",
          },
          error: {
            "more-subtle": "#2d1515",
            subtle:   "#fb2c361a",
            default:  "#e05252",
            lighter:  "#fb2c3626",
            darker:   "#ff6467",
          },
          alert: {
            "more-subtle": "#281e00",
            subtle:   "#2d1a08",
            default:  "#fcd34d",
            lighter:  "#fdc70026",
            darker:   "#fcd34d",
          },
          success: {
            "more-subtle": "#0a1f1a",
            subtle:   "#00c9501a",
            default:  "#34d399",
            lighter:  "#0a1f1a",
            emphasis: "#6ee7b7",
            darker:   "#6ee7b7",
          },
          yellow: {
            "more-subtle": "#281e00",
            subtle:   "#2d1a08",
            lighter:  "#fdc70026",
            default:  "#f59e0b",
            emphasis: "#fcd34d",
            darker:   "#fdc700b2",
          },
          "lime-green": {
            "more-subtle": "#111a04",
            subtle:   "#bdee491a",
            lighter:  "#bdee4926",
            default:  "#bdee4933",
            emphasis: "#bef264",
            darker:   "#bdee49",
          },
          purple: {
            "more-subtle": "#120520",
            subtle:   "#ad46ff1a",
            lighter:  "#ad46ff26",
            default:  "#ad46ff33",
            emphasis: "#d8b4fe",
            darker:   "#d8b4fe",
          },
          "light-blue": {
            "more-subtle": "#071828",
            subtle:   "#51a2ff1a",
            lighter:  "#51a2ff26",
            default:  "#51a2ff33",
            emphasis: "#7dd3fc",
            darker:   "#7dd3fc",
          },
          floating: {
            default: "#141b2ad9",
            hover:   "#202a3ee5",
          },
          modal: {
            default: "#ffffff",
          },
        },

        // ─── Text ────────────────────────────────────────────────────────────
        text: {
          title:              "#ffffffcc",
          subtitle:           "#ffffff99",
          body:               "#ffffff99",
          caption:            "#ffffff80",
          negative:           "#ffffff",
          "negative-disable": "#ffffff4d",
          disabled:           "#ffffff4d",
          "disabled-2":       "#ffffff33",
          label:              "#ffffff99",
          link:               "#2b7fff",
          info:               "#ffffffcc",
          error:              "#ff6467",
          alert:              "#fcd34d",
          success:            "#6ee7b7",
          yellow:             "#fcd34d",
          "lime-green":       "#bdee49",
          purple:             "#d8b4fe",
          "light-blue":       "#7dd3fc",
        },

        // ─── Border ──────────────────────────────────────────────────────────
        border: {
          subtle:  "#ffffff1a",  // border-subtle shortcut (CLAUDE.md)
          neutral: {
            lighter: "#ffffff26",
            subtle:  "#ffffff1a",
            default: "#ffffff1a",
            darker:  "#ffffff33",
            black:   "#ffffff4d",
          },
          primary: {
            subtle:  "#1d2f4f",
            default: "#2b7fff",
            lighter: "#2b7fff1a",
            darker:  "#155dfc",
          },
          error: {
            subtle:  "#fb2c361a",
            default: "#e05252",
            lighter: "#fb2c3626",
            darker:  "#ff6467",
          },
          alert: {
            subtle:  "#2d1a08",
            default: "#fbbf24",
            lighter: "#f59e0b",
            darker:  "#fcd34d",
          },
          success: {
            subtle:  "#00c9501a",
            default: "#00c9504d",
            lighter: "#34d399",
            darker:  "#6ee7b7",
          },
          yellow: {
            subtle:  "#2d1a08",
            default: "#fbbf24",
            lighter: "#f59e0b",
            darker:  "#fcd34d",
          },
          "lime-green": {
            subtle:  "#bdee491a",
            default: "#84cc16",
            lighter: "#bdee4933",
            darker:  "#bdee49",
          },
          purple: {
            subtle:  "#ad46ff1a",
            default: "#a855f7",
            lighter: "#ad46ff33",
            darker:  "#d8b4fe",
          },
          "light-blue": {
            subtle:  "#51a2ff1a",
            default: "#38bdf8",
            lighter: "#51a2ff33",
            darker:  "#7dd3fc",
          },
        },

        // ─── Icon ────────────────────────────────────────────────────────────
        icon: {
          neutral: {
            light:           "#ffffffb2",
            "disable-light": "#ffffff26",
            "disable-dark":  "#ffffff40",
            dark:            "#ffffff80",
            black:           "#ffffffb2",
          },
          primary: {
            subtle:  "#80afff99",
            default: "#2b7fff",
            lighter: "#80afffe5",
            darker:  "#155dfc",
          },
          error:   { disabled: "#e05252", default: "#ff6467", darker: "#fca5a5" },
          alert:   { default: "#fcd34d",  darker: "#fcd34d" },
          success: { default: "#6ee7b7",  darker: "#6ee7b7" },
          yellow:  { default: "#fcd34d",  darker: "#fcd34d" },
          "lime-green":  { default: "#bdee49", darker: "#bef264" },
          purple:        { default: "#d8b4fe", darker: "#d8b4fe" },
          "light-blue":  { default: "#7dd3fc", darker: "#7dd3fc" },
        },

        // ─── Badge ───────────────────────────────────────────────────────────
        badge: {
          error:         "#ff6467",
          alert:         "#fcd34d",
          "in-progress": "#2b7fff",
          success:       "#6ee7b7",
          neutral:       "#ffffff80",
          "light-blue":  "#7dd3fc",
          "lime-green":  "#bdee49",
          yellow:        "#fcd34d",
          purple:        "#d8b4fe",
        },

        // ─── Overlay ─────────────────────────────────────────────────────────
        overlay: {
          scrim: "#00000080",
        },
      },

      // ─── Spacing — Space and Radios Tokens ───────────────────────────────────
      spacing: {
        "0x":   "0px",
        "0-5x": "2px",
        "1x":   "4px",
        "2x":   "8px",
        "3x":   "12px",
        "4x":   "16px",
        "5x":   "20px",
        "6x":   "24px",
        "7x":   "32px",
        "10x":  "40px",
        "12x":  "48px",
        "16x":  "64px",
        "20x":  "80px",
      },

      // ─── Border Radius — Space and Radios Tokens ─────────────────────────────
      borderRadius: {
        none:  "0px",
        xs:    "2px",
        sm:    "4px",
        md:    "8px",
        lg:    "16px",
        xl:    "24px",
        "2xl": "32px",
        full:  "100px",
      },

      // ─── Typography — Type Tokens ─────────────────────────────────────────────
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },

      fontSize: {
        "type-xs":   ["10px", { lineHeight: "1.4" }],  // Caption XS
        "type-sm":   ["12px", { lineHeight: "1.5" }],  // Caption S / Label S / Body S
        "type-base": ["14px", { lineHeight: "1.5" }],  // Body M / Label M / Caption M
        "type-md":   ["16px", { lineHeight: "1.5" }],  // Body L / Label L / Subtitle M
        "type-lg":   ["18px", { lineHeight: "1.4" }],  // Title S / Subtitle L
        "type-xl":   ["20px", { lineHeight: "1.3" }],  // Title M
        "type-2xl":  ["24px", { lineHeight: "1.3" }],  // Title L
        "type-3xl":  ["32px", { lineHeight: "1.2" }],  // Display M
        "type-4xl":  ["40px", { lineHeight: "1.2" }],  // Display L
        "type-5xl":  ["48px", { lineHeight: "1.1" }],  // Display XL
      },

      fontWeight: {
        regular:   "500",  // Body/Regular, Caption/Regular, Link/Regular
        semibold:  "600",  // Title, Subtitle, Label Bold
        bold:      "700",  // Display/Bold
        extrabold: "800",  // Display/ExtraBold
        black:     "900",  // Display/Black
      },
    },
  },
};
