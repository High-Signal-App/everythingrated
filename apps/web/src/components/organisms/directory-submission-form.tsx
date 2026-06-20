"use client";

import { useActionState } from "react";

import {
  submitDirectory,
  type SubmitDirectoryState,
} from "@/lib/actions";

const initialState: SubmitDirectoryState = {
  ok: false,
  message: "",
};

const starterAspects = [
  "Quality",
  "Developer experience",
  "Cost",
  "Reliability",
  "Ecosystem",
];

export function DirectorySubmissionForm() {
  const [state, action, pending] = useActionState(submitDirectory, initialState);

  return (
    <form action={action} className="space-y-5">
      <Field label="Directory name" name="name" placeholder="AI design tools" required />
      <Field
        label="Short description"
        name="description"
        placeholder="Design agents, image generators, and creative tools builders compare."
        required
      />
      <label className="block">
        <span className="text-[12px] font-medium text-[var(--muted)]">
          Hero copy
        </span>
        <textarea
          name="heroCopy"
          required
          rows={4}
          placeholder="What trade-offs should people understand before choosing one?"
          className="mt-2 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[14px] outline-none"
        />
      </label>

      <div>
        <div className="mb-2 text-[12px] font-medium text-[var(--muted)]">
          Rating aspects
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {starterAspects.map((aspect) => (
            <input
              key={aspect}
              name="aspectLabels"
              defaultValue={aspect}
              className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[14px] outline-none"
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Your name" name="submitterName" placeholder="Optional" />
        <Field label="Email" name="submitterEmail" placeholder="Optional" type="email" />
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

function Field({
  label,
  name,
  placeholder,
  required,
  type = "text",
}: {
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-[12px] font-medium text-[var(--muted)]">
        {label}
      </span>
      <input
        name={name}
        required={required}
        type={type}
        placeholder={placeholder}
        className="mt-2 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[14px] outline-none"
      />
    </label>
  );
}
