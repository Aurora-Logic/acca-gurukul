import { Toaster as Sonner } from "sonner";
import { CircleCheckBig, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react";

/**
 * Sonner toaster with a custom soft palette.
 *
 *  - richColors is enabled so sonner applies per-type CSS variables
 *    (without it, every toast falls back to --normal-bg = white).
 *  - The CSS variables below override sonner's rich-color defaults.
 *  - A tiny global <style> block is injected once for the close-button
 *    hover fix that can't be expressed via CSS variables alone.
 */

const CLOSE_BUTTON_STYLES = `
  [data-sonner-toaster] [data-sonner-toast] [data-close-button] {
    background: transparent !important;
    border: 0 !important;
    color: currentColor !important;
    opacity: 0.55;
    transition: opacity 0.15s, background-color 0.15s;
    border-radius: 6px !important;
    width: 22px !important;
    height: 22px !important;
    top: 10px !important;
    left: auto !important;
    right: 10px !important;
  }
  [data-sonner-toaster] [data-sonner-toast] [data-close-button]:hover {
    opacity: 1;
    background: rgba(0,0,0,0.06) !important;
    color: currentColor !important;
  }
`;

let injected = false;
function injectCloseButtonStyles() {
  if (injected || typeof document === "undefined") return;
  const style = document.createElement("style");
  style.setAttribute("data-sonner-overrides", "true");
  style.textContent = CLOSE_BUTTON_STYLES;
  document.head.appendChild(style);
  injected = true;
}

const Toaster = ({
  ...props
}: React.ComponentProps<typeof Sonner>) => {
  injectCloseButtonStyles();

  return (
    <Sonner
      theme="light"
      richColors
      position="top-right"
      className="toaster group"
      icons={{
        success: <CircleCheckBig className="size-4" />,
        info:    <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error:   <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          // Base — used by "default" toasts
          "--normal-bg":      "#FFFFFF",
          "--normal-text":    "#0E0D0A",
          "--normal-border":  "#E5E3DE",

          // Success — soft sage tint
          "--success-bg":     "#EEF6F0",
          "--success-text":   "#2F5F3F",
          "--success-border": "#BFDCC6",

          // Error — soft rose tint
          "--error-bg":       "#FEF2F2",
          "--error-text":     "#9B1C2B",
          "--error-border":   "#F6C6CB",

          // Warning — soft amber tint
          "--warning-bg":     "#FFF8E6",
          "--warning-text":   "#8B5E0F",
          "--warning-border": "#F1DFA1",

          // Info — soft blue tint
          "--info-bg":        "#EEF5FB",
          "--info-text":      "#1E4E7D",
          "--info-border":    "#C4DAEC",

          "--border-radius":  "10px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
          title: "font-medium",
          description: "opacity-85",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
