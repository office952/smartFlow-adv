import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";


type ButtonVariant = "primary" | "secondary" | "ghost";

type CommonProps = {
  variant?: ButtonVariant;
  children: ReactNode;
  className?: string;
};

type NativeButtonProps = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    as?: "button";
  };

type RouterLinkProps = CommonProps &
  LinkProps & {
    as: "link";
  };

export type ButtonProps = NativeButtonProps | RouterLinkProps;

function classNames(variant: ButtonVariant, className?: string) {
  return ["ui-button", `ui-button--${variant}`, className].filter(Boolean).join(" ");
}

export function Button(props: ButtonProps) {
  const variant = props.variant ?? "primary";

  if (props.as === "link") {
    const { as: _as, variant: _variant, className, children, ...linkProps } = props;
    return (
      <Link className={classNames(variant, className)} {...linkProps}>
        {children}
      </Link>
    );
  }

  const { variant: _variant, className, children, ...buttonProps } = props;
  return (
    <button type="button" className={classNames(variant, className)} {...buttonProps}>
      {children}
    </button>
  );
}
