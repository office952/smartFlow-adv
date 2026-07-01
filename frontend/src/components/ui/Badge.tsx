import type { ReactNode } from "react";


type BadgeTone = "default" | "success" | "warning" | "danger" | "muted";

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
};

export function Badge({ children, tone = "default", className }: BadgeProps) {
  return (
    <span className={["ui-badge", `ui-badge--${tone}`, className].filter(Boolean).join(" ")}>
      {children}
    </span>
  );
}
