import { ReactNode } from "react";

interface SkillBadgeProps {
  children: ReactNode;
}

const triggerSkillBadgeChaos = () => {
  window.dispatchEvent(new CustomEvent("vanta:skill-badge-click"));
};

export const SkillBadge = ({ children }: SkillBadgeProps) => {
  return (
    <button
      type="button"
      className="skill-badge text-sm tracking-wider text-muted-foreground border border-border px-4 py-2 hover:cursor-default"
      onClick={triggerSkillBadgeChaos}
    >
      {children}
    </button>
  );
};
