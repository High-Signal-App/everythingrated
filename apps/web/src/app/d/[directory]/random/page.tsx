"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

/**
 * /d/[directory]/random — bounces to a random item in this directory.
 * Useful for "Surprise me" entry points.
 */
export default function RandomItem() {
  const router = useRouter();
  const params = useParams<{ directory: string }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const directory = params?.directory;
    if (!directory) {
      setError("missing directory");
      return;
    }
    fetch(`/d/${directory}/items.json`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => {
        const items = (data?.items ?? []) as Array<{ item: { slug: string } }>;
        if (items.length === 0) {
          setError("no items in this directory yet");
          return;
        }
        const pick = items[Math.floor(Math.random() * items.length)];
        router.replace(`/d/${directory}/${pick.item.slug}`);
      })
      .catch(() => setError("could not load items"));
  }, [params, router]);

  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <p className="text-sm text-[var(--muted)]">
        {error ?? "Picking a random item…"}
      </p>
    </main>
  );
}
