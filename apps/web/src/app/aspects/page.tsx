import type { Metadata } from "next";
import Link from "next/link";

import { listAspectKeys } from "@/lib/ratings";

export const metadata: Metadata = {
  title: "Aspects — EverythingRated",
  description:
    "Every rating axis used across the catalogue. Click any aspect to see the top-rated items on that single axis, cross-directory.",
};

export const dynamic = "force-dynamic";

export default async function AspectsIndex() {
  const keys = await listAspectKeys();
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/" className="text-[12px] text-[var(--muted)] hover:text-[var(--foreground)]">
        ← All directories
      </Link>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">Aspects</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Every rating axis used in the catalogue. Click one to see the top
        items on that single axis — cross-directory.
      </p>

      {keys.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--muted)]">
          No aspects defined yet.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-[var(--border)]">
          {keys.map((k) => (
            <li key={k.key} className="flex items-center gap-4 py-3">
              <Link
                href={`/aspects/${encodeURIComponent(k.key)}`}
                className="flex-1 text-sm hover:underline"
              >
                <span className="font-medium">{k.label}</span>{" "}
                <span className="text-xs text-[var(--muted)]">{k.key}</span>
              </Link>
              <span className="text-xs tabular-nums text-[var(--muted)]">
                in {k.directories} director{k.directories === 1 ? "y" : "ies"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
