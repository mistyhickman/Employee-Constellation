import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { browseProjects, getProjectNetwork } from "../services/projectService.js";

export const projectsRouter = Router();

projectsRouter.get("/", requireAuth, async (_req, res) => {
  const projects = await browseProjects();
  res.json(projects);
});

projectsRouter.get("/:id/network", requireAuth, async (req, res) => {
  const network = await getProjectNetwork(req.params.id);
  if (!network) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json(network);
});
