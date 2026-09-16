import { Router } from "express";
import { z } from "zod";
import { identityProvider } from "../lib/identityProvider.js";
import { loginWithExternalId, SESSION_COOKIE } from "../services/authService.js";

export const authRouter = Router();

/** Lists the seeded identities for the mock login picker UI. */
authRouter.get("/mock-identities", async (_req, res) => {
  const identities = await identityProvider.listAvailableIdentities();
  res.json(identities.map((i) => ({ externalId: i.externalId, name: i.name, jobTitle: i.jobTitle })));
});

const loginSchema = z.object({ externalId: z.string().min(1) });

authRouter.post("/mock-login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "externalId is required" });
    return;
  }

  try {
    const token = await loginWithExternalId(parsed.data.externalId);
    res.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      // Off by default so local/plain-HTTP deployments still work — a
      // secure cookie is silently dropped by the browser over non-HTTPS
      // origins. Set COOKIE_SECURE=true once the hosted deployment has TLS.
      secure: process.env.COOKIE_SECURE === "true",
      maxAge: 8 * 60 * 60 * 1000,
    });
    res.json({ ok: true });
  } catch {
    res.status(401).json({ error: "Unknown identity" });
  }
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(SESSION_COOKIE);
  res.json({ ok: true });
});
