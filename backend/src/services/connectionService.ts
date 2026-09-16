import { prisma } from "../lib/prisma.js";
import type { ConnectionType } from "@prisma/client";

const SYMMETRIC_TYPES: ConnectionType[] = ["worked_together", "professional_contact", "community", "client_industry"];

export function isSymmetric(relationshipType: ConnectionType): boolean {
  return SYMMETRIC_TYPES.includes(relationshipType);
}

export async function addConnection(personId: string, connectedPersonId: string, relationshipType: ConnectionType) {
  if (personId === connectedPersonId) {
    throw new Error("Cannot connect a person to themselves");
  }

  const connection = await prisma.personConnection.upsert({
    where: { personId_connectedPersonId_relationshipType: { personId, connectedPersonId, relationshipType } },
    update: {},
    create: { personId, connectedPersonId, relationshipType },
    include: { connectedPerson: { select: { id: true, name: true, jobTitle: true, photoUrl: true } } },
  });

  if (isSymmetric(relationshipType)) {
    await prisma.personConnection.upsert({
      where: {
        personId_connectedPersonId_relationshipType: {
          personId: connectedPersonId,
          connectedPersonId: personId,
          relationshipType,
        },
      },
      update: {},
      create: { personId: connectedPersonId, connectedPersonId: personId, relationshipType },
    });
  }

  return connection;
}
