import type { ConnectionType } from "../types";

export const CONNECTION_TYPE_LABELS: Record<ConnectionType, string> = {
  worked_together: "Worked together",
  mentor: "They mentor me",
  mentee: "I mentor them",
  sme_known: "Subject-matter expert I know",
  professional_contact: "Professional contact",
  community: "Community connection",
  client_industry: "Client / industry connection",
};
