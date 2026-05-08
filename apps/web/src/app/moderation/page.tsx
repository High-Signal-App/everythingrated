import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/atoms/badge";
import { Card, CardBody } from "@/components/atoms/card";
import { moderateDirectorySubmission } from "@/lib/actions";
import {
  listDirectorySubmissions,
  parseAspectLabels,
} from "@/lib/directory-submissions";
import { getModerationToken } from "@/lib/moderation";

export const dynamic = "force-dynamic";

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

  const submissions = await listDirectorySubmissions();
  const pending = submissions.filter((submission) => submission.status === "pending");

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
          <h1 className="mt-4 text-[36px] font-semibold tracking-tight">
            Directory submissions
          </h1>
          <p className="mt-2 max-w-2xl text-[14px] text-[var(--muted)]">
            Approve community suggestions into public directories, or reject
            ideas that are too broad, duplicate, or not useful yet.
          </p>
        </div>
        <Badge tone="neutral">
          {pending.length} pending
        </Badge>
      </header>

      {typeof query.moderated === "string" ? (
        <StatusMessage message={`Submission ${query.moderated}.`} />
      ) : null}
      {typeof query.error === "string" ? (
        <StatusMessage message={query.error} />
      ) : null}

      <section className="mt-8 grid grid-cols-1 gap-4">
        {submissions.length === 0 ? (
          <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-strong)] p-10 text-center text-[var(--muted)]">
            No directory submissions yet.
          </div>
        ) : (
          submissions.map((submission) => (
            <Card key={submission.id}>
              <CardBody className="space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[20px] font-semibold tracking-tight">
                        {submission.name}
                      </h2>
                      <Badge
                        tone={submission.status === "pending" ? "outline" : "neutral"}
                      >
                        {submission.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-[12px] text-[var(--muted)]">
                      /d/{submission.slug}
                    </p>
                  </div>
                  <p className="text-[12px] text-[var(--muted)]">
                    {submission.createdAt.toLocaleDateString()}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.08em] text-[var(--muted-2)]">
                      Description
                    </div>
                    <p className="mt-1 text-[13px] leading-[1.55] text-[var(--muted)]">
                      {submission.description}
                    </p>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.08em] text-[var(--muted-2)]">
                      Hero copy
                    </div>
                    <p className="mt-1 text-[13px] leading-[1.55] text-[var(--muted)]">
                      {submission.heroCopy}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {parseAspectLabels(submission).map((aspect) => (
                    <Badge key={aspect} tone="neutral">
                      {aspect}
                    </Badge>
                  ))}
                </div>

                {submission.status === "pending" ? (
                  <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-4 sm:flex-row">
                    <form action={moderateDirectorySubmission}>
                      <input type="hidden" name="token" value={token} />
                      <input type="hidden" name="id" value={submission.id} />
                      <input type="hidden" name="intent" value="approve" />
                      <button className="h-9 rounded-[var(--radius-sm)] bg-[var(--foreground)] px-4 text-[13px] font-medium text-[var(--background)]">
                        Approve
                      </button>
                    </form>
                    <form
                      action={moderateDirectorySubmission}
                      className="flex flex-1 flex-col gap-2 sm:flex-row"
                    >
                      <input type="hidden" name="token" value={token} />
                      <input type="hidden" name="id" value={submission.id} />
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
                ) : submission.moderatorNote ? (
                  <p className="border-t border-[var(--border)] pt-4 text-[12px] text-[var(--muted)]">
                    {submission.moderatorNote}
                  </p>
                ) : null}
              </CardBody>
            </Card>
          ))
        )}
      </section>
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
