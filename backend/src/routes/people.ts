import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { getPersonDetail, getSharedContext } from "../services/personService.js";

export const peopleRouter = Router();

peopleRouter.get("/", requireAuth, async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q : "";
  if (q.trim().length === 0) {
    res.json([]);
    return;
  }

  const people = await prisma.person.findMany({
    where: {
      id: { not: req.session!.personId },
      name: { contains: q, mode: "insensitive" },
    },
    select: { id: true, name: true, jobTitle: true, department: true, photoUrl: true },
    take: 20,
    orderBy: { name: "asc" },
  });

  res.json(people);
});

peopleRouter.get("/:id", requireAuth, async (req, res) => {
  const person = await getPersonDetail(req.session!.personId, req.session!.roles, req.params.id);
  if (!person) {
    res.status(404).json({ error: "Person not found" });
    return;
  }
  res.json(person);
});

peopleRouter.get("/:id/shared-context", requireAuth, async (req, res) => {
  const context = await getSharedContext(req.session!.personId, req.session!.roles, req.params.id);
  if (!context) {
    res.status(404).json({ error: "Person not found" });
    return;
  }
  res.json(context);
});
