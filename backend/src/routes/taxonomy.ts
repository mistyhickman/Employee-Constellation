import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { TAXONOMY_TYPES, browseTaxonomy, proposeTaxonomyEntry, searchTaxonomy, type TaxonomyType } from "../services/taxonomyService.js";
import { getTaxonomyNetwork } from "../services/taxonomyNetworkService.js";

export const taxonomyRouter = Router();

function isTaxonomyType(value: string): value is TaxonomyType {
  return (TAXONOMY_TYPES as string[]).includes(value);
}

taxonomyRouter.get("/:type", requireAuth, async (req, res) => {
  const { type } = req.params;
  if (!isTaxonomyType(type)) {
    res.status(404).json({ error: "Unknown taxonomy type" });
    return;
  }

  const q = typeof req.query.q === "string" ? req.query.q : "";
  const kind = req.query.kind === "personal" || req.query.kind === "professional" ? req.query.kind : undefined;

  const results = await searchTaxonomy(type, q, kind);
  res.json(results);
});

taxonomyRouter.get("/:type/browse", requireAuth, async (req, res) => {
  const { type } = req.params;
  if (!isTaxonomyType(type)) {
    res.status(404).json({ error: "Unknown taxonomy type" });
    return;
  }

  const kind = req.query.kind === "personal" || req.query.kind === "professional" ? req.query.kind : undefined;
  const results = await browseTaxonomy(type, kind);
  res.json(results);
});

const proposeSchema = z.object({
  canonicalName: z.string().min(1),
  kind: z.enum(["professional", "personal"]).optional(),
});

taxonomyRouter.post("/:type/propose", requireAuth, async (req, res) => {
  const { type } = req.params;
  if (!isTaxonomyType(type)) {
    res.status(404).json({ error: "Unknown taxonomy type" });
    return;
  }

  const parsed = proposeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "canonicalName is required" });
    return;
  }

  if (type !== "interests" && parsed.data.kind) {
    res.status(400).json({ error: "kind is only applicable to interests" });
    return;
  }

  const entry = await proposeTaxonomyEntry(type, parsed.data.canonicalName, parsed.data.kind);
  res.status(201).json(entry);
});

taxonomyRouter.get("/:type/:id/network", requireAuth, async (req, res) => {
  const { type, id } = req.params;
  if (!isTaxonomyType(type)) {
    res.status(404).json({ error: "Unknown taxonomy type" });
    return;
  }

  const network = await getTaxonomyNetwork(type, id);
  if (!network) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }
  res.json(network);
});
