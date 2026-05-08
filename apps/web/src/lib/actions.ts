"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  approveDirectorySubmission,
  rejectDirectorySubmission,
  submitDirectorySuggestion,
} from "@/lib/directory-submissions";
import { getModerationToken } from "@/lib/moderation";
import { rate } from "@/lib/ratings";
import { ensureVisitorId } from "@/lib/visitor";

export async function submitRating(input: {
  directorySlug: string;
  itemSlug: string;
  itemId: string;
  aspectId: string;
  score: number;
}) {
  const visitorId = await ensureVisitorId();
  await rate({
    itemId: input.itemId,
    aspectId: input.aspectId,
    visitorId,
    score: input.score,
  });
  revalidatePath(`/d/${input.directorySlug}/${input.itemSlug}`);
  revalidatePath(`/d/${input.directorySlug}`);
  revalidatePath("/");
}

export type SubmitDirectoryState = {
  ok: boolean;
  message: string;
};

export async function submitDirectory(
  _prevState: SubmitDirectoryState,
  formData: FormData,
): Promise<SubmitDirectoryState> {
  const aspects = formData
    .getAll("aspectLabels")
    .map((value) => String(value));
  const result = await submitDirectorySuggestion({
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    heroCopy: String(formData.get("heroCopy") ?? ""),
    aspectLabels: aspects,
    submitterName: String(formData.get("submitterName") ?? ""),
    submitterEmail: String(formData.get("submitterEmail") ?? ""),
  });

  if (!result.ok) {
    return { ok: false, message: result.error };
  }

  revalidatePath("/");
  return {
    ok: true,
    message: "Thanks. Your directory is queued for moderation.",
  };
}

export async function moderateDirectorySubmission(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const id = String(formData.get("id") ?? "");
  const intent = String(formData.get("intent") ?? "");
  const note = String(formData.get("note") ?? "");
  const expectedToken = await getModerationToken();
  const params = new URLSearchParams({ token });

  if (!expectedToken || token !== expectedToken) {
    params.set("error", "invalid-token");
    redirect(`/moderation?${params.toString()}`);
  }

  if (intent !== "approve" && intent !== "reject") {
    params.set("error", "invalid-action");
    redirect(`/moderation?${params.toString()}`);
  }

  const result =
    intent === "approve"
      ? await approveDirectorySubmission(id)
      : await rejectDirectorySubmission(id, note);

  if (result.ok) {
    params.set("moderated", intent === "approve" ? "approved" : "rejected");
    revalidatePath("/");
  } else {
    params.set("error", result.error);
  }

  revalidatePath("/moderation");
  redirect(`/moderation?${params.toString()}`);
}
