"use client";

import Link from "next/link";
import { useActionState } from "react";
import { submitItem, type SubmitItemState } from "@/lib/actions";

const initialState: SubmitItemState = {
  ok: false,
  message: "",
};

export function ItemSubmissionForm({
  directorySlug,
  directoryName,
}: {
  directorySlug: string;
  directoryName: string;
}) {
  const [state, action, pending] = useActionState(submitItem, initialState);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="directorySlug" value={directorySlug} />

      <label className="block">
        <span className="text-[12px] font-medium text-[var(--muted)]">Tool name</span>
        <input
          name="name"
          required
          placeholder="Zed"
          className="mt-2 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[14px] outline-none"
        />
      </label>

      <label className="block">
        <span className="text-[12px] font-medium text-[var(--muted)]">
          Short description
        </span>
        <textarea
          name="description"
          required
          rows={4}
          placeholder={`What should people know about this tool in ${directoryName}?`}
          className="mt-2 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[14px] outline-none"
        />
      </label>

      <label className="block">
        <span className="text-[12px] font-medium text-[var(--muted)]">Website</span>
        <input
          name="websiteUrl"
          required
          type="url"
          placeholder="https://zed.dev"
          className="mt-2 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[14px] outline-none"
        />
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-[12px] font-medium text-[var(--muted)]">Your name</span>
          <input
            name="submitterName"
            placeholder="Optional"
            className="mt-2 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[14px] outline-none"
          />
        </label>
        <label className="block">
          <span className="text-[12px] font-medium text-[var(--muted)]">Email</span>
          <input
            name="submitterEmail"
            type="email"
            placeholder="Optional"
            className="mt-2 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[14px] outline-none"
          />
        </label>
      </div>

      {state.message ? (
        <div
          className={
            state.ok
              ? "rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[13px]"
              : "rounded-[var(--radius-sm)] border border-[var(--border-strong)] px-3 py-2 text-[13px] text-[var(--muted)]"
          }
        >
          {state.message}
          {state.existingItemSlug ? (
            <p className="mt-2">
              <Link
                href={`/d/${directorySlug}/${state.existingItemSlug}`}
                className="underline hover:text-[var(--foreground)]"
              >
                View existing item →
              </Link>
            </p>
          ) : null}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--foreground)] px-4 text-[13px] font-medium text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Submitting..." : "Submit for review"}
      </button>
    </form>
  );
}
