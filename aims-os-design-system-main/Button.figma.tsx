/**
 * Button.figma.tsx — Code Connect
 *
 * Maps Figma "Button" component set (node 4504:5148, file v6rmYKA2zmyXWOahlxLOeI)
 * to the React Button so the Figma MCP returns the exact import + usage.
 *
 * DS property → code prop mapping
 *   Type    → variant       (Primary → "primary", etc.)
 *   Size    → size          (S → "sm", M → "default", L → "lg")
 *   Pill    → pill          (Yes → true, No → false)
 *   Icon    → iconPosition  (Left → "left", Right → "right", Alone → "alone")
 *   State   → disabled      (Disabled state → disabled={true})
 */
import figma from "@figma/code-connect";
import { Button } from "./src/components/ui/button";

figma.connect(
  Button,
  "https://www.figma.com/design/v6rmYKA2zmyXWOahlxLOeI/Design-System---AIMS-OS?node-id=4504-5148",
  {
    props: {
      variant: figma.enum("Type", {
        "Primary":         "primary",
        "Secondary":       "secondary",
        "Tertiary":        "tertiary",
        "Warning":         "warning",
        "Positive action": "positive",
        "Main Action":     "main",
      }),
      size: figma.enum("Size", {
        S: "sm",
        M: "default",
        L: "lg",
      }),
      pill: figma.enum("Pill", {
        Yes: true,
        No:  false,
      }),
      iconPosition: figma.enum("Icon", {
        Left:  "left",
        Right: "right",
        Alone: "alone",
        // "No" maps to no icon prop at all — handled by omitting icon in example
      }),
      disabled: figma.enum("State", {
        Disabled: true,
      }),
      label: figma.string("Label"),
    },
    example: ({ variant, size, pill, iconPosition, disabled, label }) => (
      <Button
        variant={variant}
        size={size}
        pill={pill}
        iconPosition={iconPosition !== undefined ? iconPosition : undefined}
        disabled={disabled}
      >
        {label}
      </Button>
    ),
  }
);
