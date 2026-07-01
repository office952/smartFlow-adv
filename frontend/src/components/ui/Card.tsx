import type { ReactNode } from "react";


type CardProps = {
  title?: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
};

export function Card({ title, eyebrow, children, className }: CardProps) {
  return (
    <article className={["ui-card", className].filter(Boolean).join(" ")}>
      {eyebrow ? <span className="ui-card__eyebrow">{eyebrow}</span> : null}
      {title ? <strong className="ui-card__title">{title}</strong> : null}
      <div className="ui-card__body">{children}</div>
    </article>
  );
}
