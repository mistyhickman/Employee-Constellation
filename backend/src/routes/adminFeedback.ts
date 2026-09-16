import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { listFeedback } from "../services/feedbackService.js";

export const adminFeedbackRouter = Router();
adminFeedbackRouter.use(requireAuth, requireRole("Admin"));

adminFeedbackRouter.get("/", async (_req, res) => {
  res.json(await listFeedback());
});
