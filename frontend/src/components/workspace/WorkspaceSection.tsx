import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { sectionCard, sectionTitle } from "./workspaceStyles";

type WorkspaceSectionProps = {
  title: string;
  icon?: LucideIcon;
  iconClassName?: string;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function WorkspaceSection({ title, icon: Icon, iconClassName = "text-[#C4713A]", badge, children, className = "" }: WorkspaceSectionProps) {
  return (
    <div className={`${sectionCard} ${className}`.trim()}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {Icon ? <Icon size={20} className={iconClassName} aria-hidden /> : null}
          <h2 className={sectionTitle}>{title}</h2>
        </div>
        {badge}
      </div>
      {children}
    </div>
  );
}
