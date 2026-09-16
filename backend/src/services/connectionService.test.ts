import { describe, expect, it } from "vitest";
import { isSymmetric } from "./connectionService.js";

describe("isSymmetric", () => {
  it.each(["worked_together", "professional_contact", "community", "client_industry"] as const)(
    "%s is symmetric (mirrored on both sides)",
    (type) => {
      expect(isSymmetric(type)).toBe(true);
    },
  );

  it.each(["mentor", "mentee", "sme_known"] as const)(
    "%s is asymmetric (not mirrored)",
    (type) => {
      expect(isSymmetric(type)).toBe(false);
    },
  );
});
