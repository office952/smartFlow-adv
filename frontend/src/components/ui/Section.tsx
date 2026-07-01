import type { ReactNode } from "react";

import { Badge } from "./Badge";


type SectionProps = {
  title: string;
  children: ReactNode;
  className?: string;
};

export function Section({ title, children, className }: SectionProps) {
  return (
    <section className={["ui-section", className].filter(Boolean).join(" ")}>
      <Badge tone="muted">{title}</Badge>
      <div className="ui-section__body">{children}</div>
    </section>
  );
}
