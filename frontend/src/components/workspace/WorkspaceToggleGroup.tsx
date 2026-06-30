import type { LucideIcon } from "lucide-react";
import { toggleGrid } from "./workspaceStyles";
import { WorkspaceButton } from "./WorkspaceButton";

type ToggleOption<T extends string> = {
  value: T;
  label: string;
  icon?: LucideIcon;
};

type WorkspaceToggleGroupProps<T extends string> = {
  value: T;
  options: ToggleOption<T>[];
  onChange: (value: T) => void;
  activeVariant?: "toggle-active" | "toggle-active-dark" | "accent";
  className?: string;
};

export function WorkspaceToggleGroup<T extends string>({
  value,
  options,
  onChange,
  activeVariant = "toggle-active",
  className = "",
}: WorkspaceToggleGroupProps<T>) {
  return (
    <div className={`${toggleGrid} ${className}`.trim()}>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <WorkspaceButton
            key={option.value}
            variant={selected ? activeVariant : "toggle-inactive"}
            icon={option.icon}
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </WorkspaceButton>
        );
      })}
    </div>
  );
}
