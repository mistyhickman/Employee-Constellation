import { describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import { verifySession } from "./authService.js";

describe("verifySession", () => {
  it("returns the payload for a validly signed token", () => {
    const token = jwt.sign({ personId: "abc", roles: ["Employee"] }, "dev-only-secret-change-me");
    expect(verifySession(token)).toMatchObject({ personId: "abc", roles: ["Employee"] });
  });

  it("returns null for a tampered token", () => {
    const token = jwt.sign({ personId: "abc", roles: ["Employee"] }, "wrong-secret");
    expect(verifySession(token)).toBeNull();
  });
});
