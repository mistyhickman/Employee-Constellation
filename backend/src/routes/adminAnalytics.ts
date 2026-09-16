import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { getOrgAnalytics } from "../services/analyticsService.js";

export const adminAnalyticsRouter = Router();
adminAnalyticsRouter.use(requireAuth, requireRole("Admin"));

adminAnalyticsRouter.get("/", async (_req, res) => {
  res.json(await getOrgAnalytics());
});
