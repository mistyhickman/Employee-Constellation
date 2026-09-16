import directory from "./mockDirectory.json" with { type: "json" };

export interface ResolvedIdentity {
  externalId: string;
  name: string;
  email: string;
  jobTitle: string | null;
  department: string | null;
  managerExternalId: string | null;
  photoUrl: string | null;
}

/**
 * Swap point for real Microsoft Entra ID / Graph integration:
 * an EntraIdentityProvider implementing this same interface (via
 * openid-client + Graph /me) replaces this without touching any
 * downstream auth/service code.
 */
export interface IdentityProvider {
  resolveIdentity(credential: string): Promise<ResolvedIdentity | null>;
  listAvailableIdentities(): Promise<ResolvedIdentity[]>;
}

export class MockIdentityProvider implements IdentityProvider {
  async resolveIdentity(externalId: string): Promise<ResolvedIdentity | null> {
    const entry = directory.find((d) => d.externalId === externalId);
    return entry ?? null;
  }

  async listAvailableIdentities(): Promise<ResolvedIdentity[]> {
    return directory;
  }
}

export const identityProvider: IdentityProvider = new MockIdentityProvider();
