"use server";

import { revalidatePath } from "next/cache";
import { rate } from "@/lib/ratings";
import { ensureVisitorId } from "@/lib/visitor";

export async function submitRating(input: {
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
  revalidatePath(`/${input.itemSlug}`);
  revalidatePath("/");
}
