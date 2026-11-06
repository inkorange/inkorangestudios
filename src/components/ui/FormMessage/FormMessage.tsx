import type { ReactNode } from "react";
import styles from "./FormMessage.module.scss";

export type FormMessageProps = {
  status: "success" | "error";
  children: ReactNode;
};

export function FormMessage({ status, children }: FormMessageProps) {
  return (
    <p className={styles.root} data-status={status} role={status === "success" ? "status" : "alert"}>
      {children}
    </p>
  );
}
