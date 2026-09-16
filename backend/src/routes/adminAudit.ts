import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { getAuditLog } from "../services/auditService.js";

export const adminAuditRouter = Router();
adminAuditRouter.use(requireAuth, requireRole("Admin"));

adminAuditRouter.get("/", async (_req, res) => {
  res.json(await getAuditLog());
});
