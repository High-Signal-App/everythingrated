import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/atoms/badge";
import { Card, CardBody } from "@/components/atoms/card";
import { moderateDirectorySubmission, moderateItemSubmission } from "@/lib/actions";
import {
  listDirectorySubmissions,
  parseAspectLabels,
} from "@/lib/directory-submissions";
import {
  computeTrustSignals,
  listItemSubmissions,
  PILOT_DIRECTORY_SLUG,
} from "@/lib/item-submissions";
import { getModerationToken } from "@/lib/moderation";

export const dynamic = "force-dynamic";

function statusTone(status: string): "outline" | "neutral" | "strong" {
  if (status === "pending") return "outline";
  if (status === "approved") return "strong";
  return "neutral";
}

export default async function ModerationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const token = String(query.token ?? "");
  const expectedToken = await getModerationToken();

  if (!expectedToken || token !== expectedToken) {
    notFound();
  }

  const [directorySubmissions, itemSubmissions] = await Promise.all([
    listDirectorySubmissions(),
    listItemSubmissions(PILOT_DIRECTORY_SLUG),
  ]);
  const pendingDirectories = directorySubmissions.filter(
    (submission) => submission.status === "pending",
  );
  const pendingItems = itemSubmissions.filter((submission) => submission.status === "pending");

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-14">
      <Link
        href="/"
        className="text-[12px] text-[var(--muted)] hover:text-[var(--foreground)]"
      >
        ← All directories
      </Link>
      <header className="mt-6 flex flex-col gap-3 border-b border-[var(--border)] pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge tone="outline">Moderation</Badge>
          <h1 className="mt-4 text-[36px] font-semibold tracking-tight">Review queue</h1>
          <p className="mt-2 max-w-2xl text-[14px] text-[var(--muted)]">
            Approve community directory and item suggestions. Item pilot is limited to{" "}
            <code className="text-[12px]">{PILOT_DIRECTORY_SLUG}</code>.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="neutral">{pendingDirectories.length} directory pending</Badge>
          <Badge tone="neutral">{pendingItems.length} item pending</Badge>
        </div>
      </header>

      {typeof query.moderated === "string" ? (
        <StatusMessage message={`Directory submission ${query.moderated}.`} />
      ) : null}
      {typeof query.itemModerated === "string" ? (
        <StatusMessage message={`Item submission ${query.itemModerated}.`} />
      ) : null}
      {typeof query.error === "string" ? (
        <StatusMessage message={query.error} />
      ) : null}

      <section className="mt-10">
        <h2 className="text-[22px] font-semibold tracking-tight">Directory submissions</h2>
        <div className="mt-6 grid grid-cols-1 gap-4">
          {directorySubmissions.length === 0 ? (
            <EmptyState message="No directory submissions yet." />
          ) : (
            directorySubmissions.map((submission) => (
              <Card key={submission.id}>
                <CardBody className="space-y-5">
                  <SubmissionHeader
                    name={submission.name}
                    status={submission.status}
                    meta={`/d/${submission.slug}`}
                    createdAt={submission.createdAt}
                  />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FieldBlock label="Description" value={submission.description} />
                    <FieldBlock label="Hero copy" value={submission.heroCopy} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {parseAspectLabels(submission).map((aspect) => (
                      <Badge key={aspect} tone="neutral">
                        {aspect}
                      </Badge>
                    ))}
                  </div>
                  {submission.status === "pending" ? (
                    <ModerationActions
                      token={token}
                      id={submission.id}
                      action={moderateDirectorySubmission}
                    />
                  ) : submission.moderatorNote ? (
                    <NoteBlock note={submission.moderatorNote} />
                  ) : null}
                </CardBody>
              </Card>
            ))
          )}
        </div>
      </section>

      <section className="mt-14 border-t border-[var(--border)] pt-10">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-[22px] font-semibold tracking-tight">Item submissions</h2>
            <p className="mt-1 text-[13px] text-[var(--muted)]">
              Pilot directory: {PILOT_DIRECTORY_SLUG}. Fixture rows load on first visit;
              visitor submissions append to the in-memory queue.
            </p>
          </div>
          <Link
            href={`/d/${PILOT_DIRECTORY_SLUG}/submit`}
            className="text-[12px] text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            Public submit form →
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4">
          {itemSubmissions.length === 0 ? (
            <EmptyState message="No item submissions loaded. Start dev with local D1 seeded." />
          ) : (
            itemSubmissions.map((submission) => {
              const trust = computeTrustSignals(submission, itemSubmissions);
              return (
                <Card key={submission.id}>
                  <CardBody className="space-y-5">
                    <SubmissionHeader
                      name={submission.name}
                      status={submission.status}
                      meta={`/d/${submission.directorySlug}/${submission.slug}`}
                      createdAt={submission.createdAt}
                    />

                    <div className="flex flex-wrap gap-2">
                      <Badge tone={submission.source === "fixture" ? "neutral" : "outline"}>
                        source: {submission.source}
                      </Badge>
                      {trust.trustedSubmitter ? (
                        <Badge tone="strong">trusted submitter</Badge>
                      ) : null}
                      {trust.urlPlausible ? (
                        <Badge tone="neutral">URL plausible</Badge>
                      ) : (
                        <Badge tone="outline">URL flagged</Badge>
                      )}
                      {trust.domainAligned ? (
                        <Badge tone="neutral">domain aligned</Badge>
                      ) : (
                        <Badge tone="outline">domain mismatch</Badge>
                      )}
                      {trust.duplicateConfidence !== "none" ? (
                        <Badge tone="outline">
                          dup {trust.duplicateConfidence}
                          {trust.duplicateHint ? ` — ${trust.duplicateHint}` : ""}
                        </Badge>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FieldBlock label="Description" value={submission.description} />
                      <FieldBlock label="Website" value={submission.websiteUrl} />
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-[12px] text-[var(--muted)] sm:grid-cols-3">
                      <span>
                        Submitter: {submission.submitterName ?? "anonymous"}
                      </span>
                      <span>Email: {submission.submitterEmail ?? "—"}</span>
                      <span>Prior approvals: {trust.priorApprovals}</span>
                    </div>

                    {submission.status === "merged" && submission.mergedIntoItemSlug ? (
                      <p className="text-[13px] text-[var(--muted)]">
                        Merged into{" "}
                        <Link
                          href={`/d/${submission.directorySlug}/${submission.mergedIntoItemSlug}`}
                          className="underline"
                        >
                          /d/{submission.directorySlug}/{submission.mergedIntoItemSlug}
                        </Link>
                      </p>
                    ) : null}

                    {submission.status === "pending" ? (
                      <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-4">
                        <div className="flex flex-wrap gap-2">
                          <form action={moderateItemSubmission}>
                            <input type="hidden" name="token" value={token} />
                            <input type="hidden" name="id" value={submission.id} />
                            <input
                              type="hidden"
                              name="directorySlug"
                              value={submission.directorySlug}
                            />
                            <input type="hidden" name="intent" value="approve" />
                            <button className="h-9 rounded-[var(--radius-sm)] bg-[var(--foreground)] px-4 text-[13px] font-medium text-[var(--background)]">
                              Approve
                            </button>
                          </form>
                          <form action={moderateItemSubmission}>
                            <input type="hidden" name="token" value={token} />
                            <input type="hidden" name="id" value={submission.id} />
                            <input
                              type="hidden"
                              name="directorySlug"
                              value={submission.directorySlug}
                            />
                            <input type="hidden" name="intent" value="merge" />
                            <button className="h-9 rounded-[var(--radius-sm)] border border-[var(--border)] px-4 text-[13px] font-medium">
                              Merge duplicate
                            </button>
                          </form>
                        </div>
                        <form
                          action={moderateItemSubmission}
                          className="flex flex-col gap-2 sm:flex-row"
                        >
                          <input type="hidden" name="token" value={token} />
                          <input type="hidden" name="id" value={submission.id} />
                          <input
                            type="hidden"
                            name="directorySlug"
                            value={submission.directorySlug}
                          />
                          <input type="hidden" name="intent" value="reject" />
                          <input
                            name="note"
                            placeholder="Reason for rejection"
                            className="min-h-9 flex-1 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 text-[13px] outline-none"
                          />
                          <button className="h-9 rounded-[var(--radius-sm)] border border-[var(--border)] px-4 text-[13px] font-medium">
                            Reject
                          </button>
                        </form>
                      </div>
                    ) : submission.status === "approved" ? (
                      <form
                        action={moderateItemSubmission}
                        className="flex flex-col gap-2 border-t border-[var(--border)] pt-4 sm:flex-row"
                      >
                        <input type="hidden" name="token" value={token} />
                        <input type="hidden" name="id" value={submission.id} />
                        <input
                          type="hidden"
                          name="directorySlug"
                          value={submission.directorySlug}
                        />
                        <input type="hidden" name="intent" value="rollback" />
                        <input
                          name="note"
                          placeholder="Rollback note (removes item if no ratings)"
                          className="min-h-9 flex-1 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 text-[13px] outline-none"
                        />
                        <button className="h-9 rounded-[var(--radius-sm)] border border-[var(--border-strong)] px-4 text-[13px] font-medium">
                          Roll back
                        </button>
                      </form>
                    ) : submission.moderatorNote ? (
                      <NoteBlock note={submission.moderatorNote} />
                    ) : null}
                  </CardBody>
                </Card>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

function SubmissionHeader({
  name,
  status,
  meta,
  createdAt,
}: {
  name: string;
  status: string;
  meta: string;
  createdAt: Date;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-[20px] font-semibold tracking-tight">{name}</h3>
          <Badge tone={statusTone(status)}>{status}</Badge>
        </div>
        <p className="mt-1 text-[12px] text-[var(--muted)]">{meta}</p>
      </div>
      <p className="text-[12px] text-[var(--muted)]">{createdAt.toLocaleDateString()}</p>
    </div>
  );
}

function FieldBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.08em] text-[var(--muted-2)]">
        {label}
      </div>
      <p className="mt-1 text-[13px] leading-[1.55] text-[var(--muted)]">{value}</p>
    </div>
  );
}

function ModerationActions({
  token,
  id,
  action,
}: {
  token: string;
  id: string;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-4 sm:flex-row">
      <form action={action}>
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="intent" value="approve" />
        <button className="h-9 rounded-[var(--radius-sm)] bg-[var(--foreground)] px-4 text-[13px] font-medium text-[var(--background)]">
          Approve
        </button>
      </form>
      <form action={action} className="flex flex-1 flex-col gap-2 sm:flex-row">
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="intent" value="reject" />
        <input
          name="note"
          placeholder="Reason for rejection"
          className="min-h-9 flex-1 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 text-[13px] outline-none"
        />
        <button className="h-9 rounded-[var(--radius-sm)] border border-[var(--border)] px-4 text-[13px] font-medium">
          Reject
        </button>
      </form>
    </div>
  );
}

function NoteBlock({ note }: { note: string }) {
  return (
    <p className="border-t border-[var(--border)] pt-4 text-[12px] text-[var(--muted)]">
      {note}
    </p>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-strong)] p-10 text-center text-[var(--muted)]">
      {message}
    </div>
  );
}

function StatusMessage({ message }: { message: string }) {
  return (
    <div className="mt-6 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[13px] text-[var(--muted)]">
      {message}
    </div>
  );
}
