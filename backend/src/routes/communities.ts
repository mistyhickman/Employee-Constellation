import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { browseCommunities, getCommunityDetail, joinCommunity, leaveCommunity } from "../services/communityService.js";

export const communitiesRouter = Router();

communitiesRouter.get("/", requireAuth, async (req, res) => {
  const communities = await browseCommunities(req.session!.personId);
  res.json(communities);
});

communitiesRouter.get("/:id", requireAuth, async (req, res) => {
  const community = await getCommunityDetail(req.params.id, req.session!.personId);
  if (!community) {
    res.status(404).json({ error: "Community not found" });
    return;
  }
  res.json(community);
});

communitiesRouter.post("/:id/join", requireAuth, async (req, res) => {
  await joinCommunity(req.session!.personId, req.params.id);
  res.status(204).end();
});

communitiesRouter.delete("/:id/join", requireAuth, async (req, res) => {
  await leaveCommunity(req.session!.personId, req.params.id);
  res.status(204).end();
});
