import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authRouter } from "./routes/auth.js";
import { meRouter } from "./routes/me.js";
import { taxonomyRouter } from "./routes/taxonomy.js";
import { peopleRouter } from "./routes/people.js";
import { searchRouter } from "./routes/search.js";
import { discoverRouter } from "./routes/discover.js";
import { projectsRouter } from "./routes/projects.js";
import { communitiesRouter } from "./routes/communities.js";
import { mentorshipRouter } from "./routes/mentorship.js";
import { adminTaxonomyRouter } from "./routes/adminTaxonomy.js";
import { adminAuditRouter } from "./routes/adminAudit.js";
import { adminAnalyticsRouter } from "./routes/adminAnalytics.js";
import { feedbackRouter } from "./routes/feedback.js";
import { adminFeedbackRouter } from "./routes/adminFeedback.js";

const app = express();
const PORT = process.env.PORT ?? 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:5173";

app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/me", meRouter);
app.use("/api/taxonomy", taxonomyRouter);
app.use("/api/people", peopleRouter);
app.use("/api/search", searchRouter);
app.use("/api/discover", discoverRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/communities", communitiesRouter);
app.use("/api/mentorship", mentorshipRouter);
app.use("/api/admin/taxonomy", adminTaxonomyRouter);
app.use("/api/admin/audit", adminAuditRouter);
app.use("/api/admin/analytics", adminAnalyticsRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/admin/feedback", adminFeedbackRouter);

app.listen(PORT, () => {
  console.log(`DocMe360 backend listening on http://localhost:${PORT}`);
});
