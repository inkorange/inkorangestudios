export { viewport } from "next-sanity/studio";

export const metadata = {
  title: "inkOrange Studios — Studio",
  robots: { index: false },
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
