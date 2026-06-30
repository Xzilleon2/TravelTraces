import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  accentButton,
  neutralButton,
  primaryButton,
  secondaryButton,
  toggleActiveButton,
  toggleActiveDarkButton,
  toggleInactiveButton,
} from "./workspaceStyles";

export type WorkspaceButtonVariant =
  | "primary"
  | "secondary"
  | "neutral"
  | "accent"
  | "toggle-active"
  | "toggle-active-dark"
  | "toggle-inactive";

const variantClasses: Record<WorkspaceButtonVariant, string> = {
  primary: primaryButton,
  secondary: secondaryButton,
  neutral: neutralButton,
  accent: accentButton,
  "toggle-active": toggleActiveButton,
  "toggle-active-dark": toggleActiveDarkButton,
  "toggle-inactive": toggleInactiveButton,
};

type WorkspaceButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: WorkspaceButtonVariant;
  icon?: LucideIcon;
  iconSize?: number;
  children: ReactNode;
};

export function WorkspaceButton({
  variant = "neutral",
  icon: Icon,
  iconSize = 16,
  className = "",
  children,
  type = "button",
  ...props
}: WorkspaceButtonProps) {
  return (
    <button type={type} className={`${variantClasses[variant]} ${className}`.trim()} {...props}>
      {Icon ? <Icon size={iconSize} aria-hidden /> : null}
      {children}
    </button>
  );
}
