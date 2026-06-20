"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { trackActivated, trackCoreAction } from "@/lib/analytics";
import {
  approveDirectorySubmission,
  rejectDirectorySubmission,
  submitDirectorySuggestion,
} from "@/lib/directory-submissions";
import {
  approveItemSubmission,
  mergeItemSubmission,
  rejectItemSubmission,
  rollbackApprovedItemSubmission,
  submitItemSuggestion,
} from "@/lib/item-submissions";
import { getModerationToken } from "@/lib/moderation";
import { countVisitorRatings, rate } from "@/lib/ratings";
import { ensureVisitorId } from "@/lib/visitor";

export async function submitRating(input: {
  directorySlug: string;
  itemSlug: string;
  itemId: string;
  aspectId: string;
  score: number;
}) {
  const visitorId = await ensureVisitorId();

  // Is this the visitor's first-ever rating? If so, the rating below also
  // counts as `activated` (first real product value). Checked before the
  // upsert so a re-rate of the same aspect doesn't re-trigger it.
  const priorRatings = await countVisitorRatings(visitorId);

  await rate({
    itemId: input.itemId,
    aspectId: input.aspectId,
    visitorId,
    score: input.score,
  });

  // Analytics — best-effort, never blocks the action.
  if (priorRatings === 0) {
    trackActivated(visitorId);
  }
  trackCoreAction("rating_submitted", visitorId);

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

  let result;
  try {
    result = await submitDirectorySuggestion({
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
      heroCopy: String(formData.get("heroCopy") ?? ""),
      aspectLabels: aspects,
      submitterName: String(formData.get("submitterName") ?? ""),
      submitterEmail: String(formData.get("submitterEmail") ?? ""),
    });
  } catch (error) {
    // A raw infra failure (e.g. D1 unavailable) — never blank the form.
    console.error("submitDirectory failed", error);
    return {
      ok: false,
      message:
        "Something went wrong saving your submission. Please try again in a moment.",
    };
  }

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

export type SubmitItemState = {
  ok: boolean;
  message: string;
  existingItemSlug?: string;
};

export async function submitItem(
  _prevState: SubmitItemState,
  formData: FormData,
): Promise<SubmitItemState> {
  let result;
  try {
    result = await submitItemSuggestion({
      directorySlug: String(formData.get("directorySlug") ?? ""),
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
      websiteUrl: String(formData.get("websiteUrl") ?? ""),
      submitterName: String(formData.get("submitterName") ?? ""),
      submitterEmail: String(formData.get("submitterEmail") ?? ""),
    });
  } catch (error) {
    console.error("submitItem failed", error);
    return {
      ok: false,
      message:
        "Something went wrong saving your submission. Please try again in a moment.",
    };
  }

  if (!result.ok) {
    return {
      ok: false,
      message: result.error,
      existingItemSlug: result.existingItemSlug,
    };
  }

  revalidatePath(`/d/${formData.get("directorySlug")}`);
  revalidatePath("/moderation");
  return {
    ok: true,
    message:
      "Thanks — queued for review. You can still rate existing tools while we review.",
  };
}

export async function moderateItemSubmission(formData: FormData): Promise<void> {
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

  const handlers: Record<string, () => Promise<{ ok: boolean; error?: string }>> = {
    approve: () => approveItemSubmission(id),
    reject: () => rejectItemSubmission(id, note),
    merge: () => mergeItemSubmission(id),
    rollback: () => rollbackApprovedItemSubmission(id, note),
  };

  const handler = handlers[intent];
  if (!handler) {
    params.set("error", "invalid-action");
    redirect(`/moderation?${params.toString()}`);
  }

  const result = await handler();
  if (result.ok) {
    params.set("itemModerated", intent);
    revalidatePath("/");
    const directorySlug = String(formData.get("directorySlug") ?? "ai-dev-tools");
    revalidatePath(`/d/${directorySlug}`);
    revalidatePath(`/d/${directorySlug}/submit`);
  } else {
    params.set("error", result.error ?? "Action failed.");
  }

  revalidatePath("/moderation");
  redirect(`/moderation?${params.toString()}`);
}
