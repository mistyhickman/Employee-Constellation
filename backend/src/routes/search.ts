import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { searchPeople } from "../services/searchService.js";

export const searchRouter = Router();

function parseIds(value: unknown): string[] {
  if (typeof value !== "string" || value.trim().length === 0) return [];
  return value.split(",").map((v) => v.trim()).filter(Boolean);
}

searchRouter.get("/", requireAuth, async (req, res) => {
  const results = await searchPeople({
    q: typeof req.query.q === "string" ? req.query.q : undefined,
    skillIds: parseIds(req.query.skillIds),
    industryIds: parseIds(req.query.industryIds),
    organizationIds: parseIds(req.query.organizationIds),
    interestIds: parseIds(req.query.interestIds),
  });

  res.json(results);
});
