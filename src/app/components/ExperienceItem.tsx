import { ReactNode } from "react";

interface ExperienceProps {
  title: string;
  period: string;
  company: string;
  location: string;
  description: ReactNode;
}

export const ExperienceItem = ({
  title,
  period,
  company,
  location,
  description,
}: ExperienceProps) => {
  return (
    <div className="border-l-2 border-border pl-8">
      <div className="flex flex-col md:flex-row md:items-baseline md:justify-between mb-2">
        <h3 className="text-2xl tracking-tight">{title}</h3>
        <span className="text-sm text-muted-foreground tracking-wider mt-1 md:mt-0">
          {period}
        </span>
      </div>
      <div className="text-muted-foreground mb-3">
        {company} · {location}
      </div>
      <p className="text-muted-foreground leading-relaxed max-w-2xl">
        {description}
      </p>
    </div>
  );
};
