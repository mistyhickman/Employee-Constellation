import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { submitFeedback } from "../services/feedbackService.js";

export const feedbackRouter = Router();

const submitFeedbackSchema = z.object({
  type: z.enum(["bug", "feature", "question"]),
  message: z.string().min(1).max(2000),
});

feedbackRouter.post("/", requireAuth, async (req, res) => {
  const parsed = submitFeedbackSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid feedback payload" });
    return;
  }

  const feedback = await submitFeedback(req.session!.personId, parsed.data.type, parsed.data.message);
  res.status(201).json(feedback);
});
