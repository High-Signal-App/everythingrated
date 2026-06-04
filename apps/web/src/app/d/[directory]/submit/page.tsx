import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/atoms/badge";
import { Card, CardBody } from "@/components/atoms/card";
import { ItemSubmissionForm } from "@/components/organisms/item-submission-form";
import { PILOT_DIRECTORY_SLUG } from "@/lib/item-submissions";
import { getDirectoryBySlug } from "@/lib/ratings";

export const dynamic = "force-dynamic";

export default async function SubmitItemPage({
  params,
}: {
  params: Promise<{ directory: string }>;
}) {
  const { directory: dirSlug } = await params;
  if (dirSlug !== PILOT_DIRECTORY_SLUG) notFound();

  const directory = await getDirectoryBySlug(dirSlug);
  if (!directory) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-14">
      <Link
        href={`/d/${directory.slug}`}
        className="text-[12px] text-[var(--muted)] hover:text-[var(--foreground)]"
      >
        ← {directory.name}
      </Link>
      <div className="mt-6">
        <Badge tone="outline">Community queue</Badge>
        <h1 className="mt-4 text-[36px] font-semibold tracking-tight">Suggest a tool</h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-[1.6] text-[var(--muted)]">
          Propose a missing AI dev tool for owner review. Approved suggestions become
          rateable items; duplicates are merged or blocked. You can keep rating existing
          tools while we review.
        </p>
      </div>

      <Card className="mt-8">
        <CardBody>
          <ItemSubmissionForm
            directorySlug={directory.slug}
            directoryName={directory.name}
          />
        </CardBody>
      </Card>
    </div>
  );
}
