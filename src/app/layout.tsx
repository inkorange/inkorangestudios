import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "inkOrange Studios",
  description: "inkOrange Studios",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
