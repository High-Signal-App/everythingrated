import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Random item — EverythingRated",
  description: "Open a randomly selected public EverythingRated item.",
  alternates: { canonical: "/random" },
};

export default function RandomLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
