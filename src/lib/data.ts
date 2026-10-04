import { db } from "@/db";
import { cache } from "react";
import { desc, asc } from "drizzle-orm";
import {
  matters,
  contacts,
  contactAliases,
  contactRoles,
  contactRelationships,
  sourceConnectors,
  dockets,
  documents,
  docketEntries,
  documentTags,
  aiProposals,
  chronologyEvents,
  claims,
  claimElements,
  factLinks,
  deadlines,
  tasks,
  activityLog,
} from "@/db/schema";

// Centralized, cached-per-request data loaders. Dataset is small (prototype),
// so we load full tables and compose relationships in JS for clarity.

export const getAllData = cache(async () => {
  const [
    mattersRows,
    contactsRows,
    aliasesRows,
    rolesRows,
    relationshipsRows,
    connectorsRows,
    docketsRows,
    documentsRows,
    docketEntriesRows,
    tagsRows,
    proposalsRows,
    chronologyRows,
    claimsRows,
    claimElementsRows,
    factLinksRows,
    deadlinesRows,
    tasksRows,
    activityRows,
  ] = await Promise.all([
    db.select().from(matters).orderBy(asc(matters.id)),
    db.select().from(contacts).orderBy(asc(contacts.id)),
    db.select().from(contactAliases).orderBy(asc(contactAliases.id)),
    db.select().from(contactRoles).orderBy(asc(contactRoles.id)),
    db.select().from(contactRelationships).orderBy(asc(contactRelationships.id)),
    db.select().from(sourceConnectors).orderBy(asc(sourceConnectors.id)),
    db.select().from(dockets).orderBy(asc(dockets.id)),
    db.select().from(documents).orderBy(desc(documents.uploadedAt)),
    db.select().from(docketEntries).orderBy(asc(docketEntries.sequenceNumber)),
    db.select().from(documentTags).orderBy(asc(documentTags.id)),
    db.select().from(aiProposals).orderBy(desc(aiProposals.createdAt)),
    db.select().from(chronologyEvents).orderBy(asc(chronologyEvents.eventDate)),
    db.select().from(claims).orderBy(asc(claims.id)),
    db.select().from(claimElements).orderBy(asc(claimElements.id)),
    db.select().from(factLinks).orderBy(asc(factLinks.id)),
    db.select().from(deadlines).orderBy(asc(deadlines.dueDate)),
    db.select().from(tasks).orderBy(asc(tasks.dueDate)),
    db.select().from(activityLog).orderBy(desc(activityLog.createdAt)),
  ]);

  return {
    matters: mattersRows,
    contacts: contactsRows,
    aliases: aliasesRows,
    roles: rolesRows,
    relationships: relationshipsRows,
    connectors: connectorsRows,
    dockets: docketsRows,
    documents: documentsRows,
    docketEntries: docketEntriesRows,
    tags: tagsRows,
    proposals: proposalsRows,
    chronology: chronologyRows,
    claims: claimsRows,
    claimElements: claimElementsRows,
    factLinks: factLinksRows,
    deadlines: deadlinesRows,
    tasks: tasksRows,
    activity: activityRows,
  };
});

export type AllData = Awaited<ReturnType<typeof getAllData>>;
