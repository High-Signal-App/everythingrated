import Link from "next/link";

import { Badge } from "@/components/atoms/badge";
import { Card, CardBody } from "@/components/atoms/card";
import { DirectorySubmissionForm } from "@/components/organisms/directory-submission-form";

export const dynamic = "force-dynamic";

export default function SubmitDirectoryPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-14">
      <Link
        href="/"
        className="text-[12px] text-[var(--muted)] hover:text-[var(--foreground)]"
      >
        ← All directories
      </Link>
      <div className="mt-6">
        <Badge tone="outline">Community queue</Badge>
        <h1 className="mt-4 text-[36px] font-semibold tracking-tight">
          Suggest a directory
        </h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-[1.6] text-[var(--muted)]">
          Submit a focused category and the axes people should compare. Approved
          directories appear publicly with empty item lists so the owner can seed
          entries next.
        </p>
      </div>

      <Card className="mt-8">
        <CardBody>
          <DirectorySubmissionForm />
        </CardBody>
      </Card>
    </div>
  );
}
