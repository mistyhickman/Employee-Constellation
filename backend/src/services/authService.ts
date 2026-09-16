import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { identityProvider } from "../lib/identityProvider.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-only-secret-change-me";
const SESSION_COOKIE = "docme360_session";

export interface SessionPayload {
  personId: string;
  roles: string[];
}

/**
 * Logs a person in via the (currently mocked) identity provider, creating
 * or updating their Person record from directory data, and returns a signed
 * session token. The admin role is granted only to the seeded admin
 * identity for this prototype.
 */
export async function loginWithExternalId(externalId: string): Promise<string> {
  const identity = await identityProvider.resolveIdentity(externalId);
  if (!identity) {
    throw new Error("Unknown identity");
  }

  let manager = null;
  if (identity.managerExternalId) {
    manager = await prisma.person.findUnique({
      where: { entraObjectId: identity.managerExternalId },
    });
  }

  const person = await prisma.person.upsert({
    where: { entraObjectId: identity.externalId },
    // photoUrl is deliberately excluded here: it's user-customizable via
    // Edit Profile (an uploaded photo), not a directory-synced field like
    // name/title/department/manager — every mock identity has
    // photoUrl: null, so including it here would silently wipe out any
    // uploaded photo on every single login.
    update: {
      name: identity.name,
      workEmail: identity.email,
      jobTitle: identity.jobTitle,
      department: identity.department,
      managerId: manager?.id ?? null,
    },
    create: {
      entraObjectId: identity.externalId,
      name: identity.name,
      workEmail: identity.email,
      jobTitle: identity.jobTitle,
      department: identity.department,
      photoUrl: identity.photoUrl,
      managerId: manager?.id ?? null,
    },
  });

  const roleLinks = await prisma.personRole.findMany({
    where: { personId: person.id },
    include: { role: true },
  });
  const roles = roleLinks.map((r) => r.role.name);

  const payload: SessionPayload = { personId: person.id, roles };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

export { SESSION_COOKIE };
