import type { ReactNode } from "react";

import { Badge } from "./Badge";


type SectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function Section({ title, description, children, className }: SectionProps) {
  return (
    <section className={["ui-section", className].filter(Boolean).join(" ")}>
      <Badge tone="muted">{title}</Badge>
      {description ? <p className="ui-section__description">{description}</p> : null}
      <div className="ui-section__body">{children}</div>
    </section>
  );
}
