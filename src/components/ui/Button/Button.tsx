import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "../Icon/Icon";
import styles from "./Button.module.scss";

export type ButtonProps = {
  variant: "accent" | "ink" | "outline" | "outline-on-dark" | "on-light";
  size?: "m" | "l" | "s";
  href?: string;
  external?: boolean;
  block?: boolean;
  icon?: IconName;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
  children: ReactNode;
};

export function Button({ variant, size = "m", href, external = false, block = false, icon, type = "button", onClick, disabled, children }: ButtonProps) {
  const content = (
    <>
      {icon ? <Icon name={icon} size={size === "s" ? 16 : 18} /> : null}
      <span>{children}</span>
    </>
  );
  const common = { className: styles.root, "data-variant": variant, "data-size": size, "data-block": block };

  if (href && external) {
    return (
      <a {...common} href={href} target="_blank" rel="noopener noreferrer" onClick={onClick}>
        {content}
      </a>
    );
  }
  if (href) {
    return (
      <Link {...common} href={href} onClick={onClick}>
        {content}
      </Link>
    );
  }
  return (
    <button {...common} type={type} onClick={onClick} disabled={disabled}>
      {content}
    </button>
  );
}
