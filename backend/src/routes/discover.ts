import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getDiscoverFeed } from "../services/discoverService.js";

export const discoverRouter = Router();

discoverRouter.get("/", requireAuth, async (req, res) => {
  const feed = await getDiscoverFeed(req.session!.personId, req.session!.roles);
  if (!feed) {
    res.status(404).json({ error: "Person not found" });
    return;
  }
  res.json(feed);
});
