"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { interpretQuery } from "@/lib/query-intent";
import {
  ASPECT_SIGNALS,
  CONSTRAINT_SIGNALS,
  type ConstraintTag,
} from "@/lib/stack-vocabulary";
import { Card, CardBody } from "@/components/atoms/card";
import { Badge } from "@/components/atoms/badge";

const tagId = (t: ConstraintTag) => `${t.key}:${t.value}`;

export function StackBuilder({
  initialQuery,
  initialDirs,
  initialTags,
  initialBoosts,
  allDirectories,
}: {
  initialQuery: string;
  initialDirs: string[];
  initialTags: ConstraintTag[];
  initialBoosts: string[];
  allDirectories: Array<{ slug: string; name: string }>;
}) {
  const router = useRouter();
  const [text, setText] = useState(initialQuery);
  const [dirs, setDirs] = useState<Set<string>>(() => new Set(initialDirs));
  const [tags, setTags] = useState<Set<string>>(() => new Set(initialTags.map(tagId)));
  const [boosts, setBoosts] = useState<Set<string>>(() => new Set(initialBoosts));
  const [showAllDirs, setShowAllDirs] = useState(false);

  const dirName = useMemo(
    () => new Map(allDirectories.map((d) => [d.slug, d.name])),
    [allDirectories],
  );

  // Deterministic "transformer" pre-fill: re-run the interpreter over the prose
  // and adopt whatever it detects as the new chip state. Pure + offline.
  function detect() {
    const intent = interpretQuery(text);
    setDirs(new Set(intent.directories));
    setTags(new Set(intent.tags.map(tagId)));
    const detectedBoosts = ASPECT_SIGNALS.filter((a) =>
      a.aspectKeys.some((k) => (intent.weights[k] ?? 1) > 1),
    ).map((a) => a.id);
    setBoosts(new Set(detectedBoosts));
  }

  function toggle(set: Set<string>, setter: (s: Set<string>) => void, key: string) {
    const next = new Set(set);
    next.has(key) ? next.delete(key) : next.add(key);
    setter(next);
  }

  function submit() {
    const params = new URLSearchParams();
    if (text.trim()) params.set("q", text.trim());
    if (dirs.size) params.set("dirs", [...dirs].join(","));
    if (tags.size) params.set("tags", [...tags].join(","));
    if (boosts.size) params.set("boost", [...boosts].join(","));
    router.push(params.toString() ? `/stack?${params}` : "/stack");
  }

  const selectedDirs = [...dirs];
  const otherDirs = allDirectories.filter((d) => !dirs.has(d.slug));

  return (
    <Card className="overflow-hidden">
      <CardBody className="space-y-6">
        <div>
          <label htmlFor="stack-q" className="text-[13px] font-semibold">
            Describe what you&apos;re building
          </label>
          <textarea
            id="stack-q"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={detect}
            rows={3}
            placeholder="e.g. A realtime collaborative app on Cloudflare Workers — need a fast database, auth, and email. Small team, tight budget."
            className="mt-2 w-full resize-y rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[14px] leading-[1.5] outline-none focus:border-[var(--border-strong)]"
          />
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={detect}
              className="rounded-full border border-[var(--border-strong)] px-3 py-1 text-[12px] font-medium hover:bg-[var(--surface-2)]"
            >
              Detect from description
            </button>
            <span className="text-[11px] text-[var(--muted)]">
              Parsed locally — no AI call, no data leaves your browser.
            </span>
          </div>
        </div>

        <Section title="Categories" hint="What your stack needs">
          <div className="flex flex-wrap gap-2">
            {selectedDirs.length === 0 ? (
              <span className="text-[12px] text-[var(--muted)]">
                None yet — describe your project or add categories below.
              </span>
            ) : (
              selectedDirs.map((slug) => (
                <Chip key={slug} active onClick={() => toggle(dirs, setDirs, slug)}>
                  {dirName.get(slug) ?? slug} ✕
                </Chip>
              ))
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowAllDirs((v) => !v)}
            className="mt-3 text-[12px] text-[var(--muted)] underline-offset-2 hover:text-[var(--foreground)] hover:underline"
          >
            {showAllDirs ? "Hide categories" : "+ Add a category"}
          </button>
          {showAllDirs && (
            <div className="mt-3 flex flex-wrap gap-2">
              {otherDirs.map((d) => (
                <Chip key={d.slug} onClick={() => toggle(dirs, setDirs, d.slug)}>
                  + {d.name}
                </Chip>
              ))}
            </div>
          )}
        </Section>

        <Section title="Constraints" hint="Hard requirements & nudges">
          <div className="flex flex-wrap gap-2">
            {CONSTRAINT_SIGNALS.map((c) => {
              const id = tagId(c.tag);
              return (
                <Chip key={id} active={tags.has(id)} onClick={() => toggle(tags, setTags, id)}>
                  {c.label}
                </Chip>
              );
            })}
          </div>
        </Section>

        <Section title="Prioritise" hint="Axes that matter most">
          <div className="flex flex-wrap gap-2">
            {ASPECT_SIGNALS.map((a) => (
              <Chip key={a.id} active={boosts.has(a.id)} onClick={() => toggle(boosts, setBoosts, a.id)}>
                {a.label}
              </Chip>
            ))}
          </div>
        </Section>

        <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
          <span className="text-[12px] text-[var(--muted)]">
            {dirs.size} categor{dirs.size === 1 ? "y" : "ies"} · {tags.size} constraint
            {tags.size === 1 ? "" : "s"} · {boosts.size} priorit{boosts.size === 1 ? "y" : "ies"}
          </span>
          <button
            type="button"
            onClick={submit}
            className="rounded-full bg-[var(--foreground)] px-4 py-2 text-[13px] font-semibold text-[var(--background)] hover:opacity-90"
          >
            Recommend my stack →
          </button>
        </div>
      </CardBody>
    </Card>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h3 className="text-[13px] font-semibold">{title}</h3>
        <span className="text-[11px] text-[var(--muted)]">{hint}</span>
      </div>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-full border border-transparent bg-[var(--foreground)] px-3 py-1 text-[12px] font-medium text-[var(--background)]"
          : "rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 text-[12px] text-[var(--foreground)] hover:border-[var(--border-strong)]"
      }
    >
      {children}
    </button>
  );
}
