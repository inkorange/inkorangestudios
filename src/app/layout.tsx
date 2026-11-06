import type { Metadata } from "next";
import { display, sans, mono } from "./fonts";
import "@/styles/globals.scss";

export const metadata: Metadata = {
  title: "inkOrange Studios",
  description: "inkOrange Studios",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
