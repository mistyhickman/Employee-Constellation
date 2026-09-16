import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getMentorshipFeed } from "../services/mentorshipService.js";

export const mentorshipRouter = Router();

mentorshipRouter.get("/", requireAuth, async (req, res) => {
  const feed = await getMentorshipFeed(req.session!.personId);
  if (!feed) {
    res.status(404).json({ error: "Person not found" });
    return;
  }
  res.json(feed);
});
