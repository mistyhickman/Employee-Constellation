import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { browseProjects, getProjectNetwork } from "../services/projectService.js";

export const projectsRouter = Router();

projectsRouter.get("/", requireAuth, async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q : "";
  const projects = await browseProjects(q);
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
