import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { TAXONOMY_TYPES, type TaxonomyType } from "../services/taxonomyService.js";
import {
  ADMIN_MANAGED_TYPES,
  approveTaxonomyEntry,
  createManagedEntry,
  listTaxonomy,
  mergeTaxonomyEntries,
  renameTaxonomyEntry,
  setTaxonomyActive,
  type AdminManagedType,
} from "../services/adminTaxonomyService.js";

export const adminTaxonomyRouter = Router();
adminTaxonomyRouter.use(requireAuth, requireRole("Admin"));

function isTaxonomyType(value: string): value is TaxonomyType {
  return (TAXONOMY_TYPES as string[]).includes(value);
}

function isAdminManagedType(value: string): value is AdminManagedType {
  return (ADMIN_MANAGED_TYPES as string[]).includes(value);
}

function isCreatableType(value: string): value is "projects" | "communities" {
  return value === "projects" || value === "communities";
}

adminTaxonomyRouter.get("/:type", async (req, res) => {
  if (!isAdminManagedType(req.params.type)) {
    res.status(404).json({ error: "Unknown taxonomy type" });
    return;
  }
  res.json(await listTaxonomy(req.params.type));
});

const createSchema = z.object({ canonicalName: z.string().min(1) });

adminTaxonomyRouter.post("/:type", async (req, res) => {
  if (!isCreatableType(req.params.type)) {
    res.status(400).json({ error: "Only projects and communities can be created directly by an admin" });
    return;
  }
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "canonicalName is required" });
    return;
  }
  const created = await createManagedEntry(req.session!.personId, req.params.type, parsed.data.canonicalName);
  res.status(201).json(created);
});

adminTaxonomyRouter.post("/:type/:id/approve", async (req, res) => {
  if (!isTaxonomyType(req.params.type)) {
    res.status(404).json({ error: "Unknown taxonomy type" });
    return;
  }
  const updated = await approveTaxonomyEntry(req.session!.personId, req.params.type, req.params.id);
  res.json(updated);
});

const activeSchema = z.object({ active: z.boolean() });

adminTaxonomyRouter.patch("/:type/:id/active", async (req, res) => {
  if (!isAdminManagedType(req.params.type)) {
    res.status(404).json({ error: "Unknown taxonomy type" });
    return;
  }
  const parsed = activeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "active (boolean) is required" });
    return;
  }
  const updated = await setTaxonomyActive(req.session!.personId, req.params.type, req.params.id, parsed.data.active);
  res.json(updated);
});

const renameSchema = z.object({ canonicalName: z.string().min(1) });

adminTaxonomyRouter.patch("/:type/:id", async (req, res) => {
  if (!isAdminManagedType(req.params.type)) {
    res.status(404).json({ error: "Unknown taxonomy type" });
    return;
  }
  const parsed = renameSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "canonicalName is required" });
    return;
  }
  const updated = await renameTaxonomyEntry(req.session!.personId, req.params.type, req.params.id, parsed.data.canonicalName);
  res.json(updated);
});

const mergeSchema = z.object({ sourceId: z.string().min(1), targetId: z.string().min(1) });

adminTaxonomyRouter.post("/:type/merge", async (req, res) => {
  if (!isAdminManagedType(req.params.type)) {
    res.status(404).json({ error: "Unknown taxonomy type" });
    return;
  }
  const parsed = mergeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "sourceId and targetId are required" });
    return;
  }
  try {
    await mergeTaxonomyEntries(req.session!.personId, req.params.type, parsed.data.sourceId, parsed.data.targetId);
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});
