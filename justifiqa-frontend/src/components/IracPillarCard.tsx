import React from 'react';

export interface IracPillarCardProps {
  letter: string;
  title: string;
  subtitle: string;
  content: string;
  icon: React.ReactNode;
  colorClass: string;
  borderColorClass: string;
  bgIconClass: string;
  articles?: string[];
}

export const IracPillarCard: React.FC<IracPillarCardProps> = ({
  letter,
  title,
  subtitle,
  content,
  icon,
  colorClass,
  borderColorClass,
  bgIconClass,
  articles,
}) => {
  return (
    <div className={`p-5 rounded-2xl bg-card border ${borderColorClass} shadow-lg space-y-3`}>
      <div className={`flex items-center gap-2.5 ${colorClass}`}>
        <div className={`p-2 rounded-lg ${bgIconClass} border ${borderColorClass}`}>
          {icon}
        </div>
        <div>
          <h4 className="font-heading font-bold text-base text-foreground">
            {letter} &mdash; {title}
          </h4>
          <p className="text-[11px] text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <div className="text-xs text-foreground leading-relaxed bg-secondary/50 p-3.5 rounded-xl border border-border whitespace-pre-line font-medium">
        {content}
      </div>

      {articles && articles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {articles.map((article, idx) => (
            <span
              key={idx}
              className="text-[11px] px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 font-semibold"
            >
              {article}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
