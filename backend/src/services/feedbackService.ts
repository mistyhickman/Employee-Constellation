import { prisma } from "../lib/prisma.js";
import type { FeedbackType } from "@prisma/client";

export async function submitFeedback(personId: string, type: FeedbackType, message: string) {
  return prisma.feedback.create({ data: { personId, type, message } });
}

export async function listFeedback() {
  return prisma.feedback.findMany({
    include: { person: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
}
