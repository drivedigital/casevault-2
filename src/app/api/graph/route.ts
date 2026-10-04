import { NextResponse } from "next/server";
import { getAllData } from "@/lib/data";

type GraphNode = {
  id: string;
  type: "matter" | "contact" | "document" | "claim" | "concept";
  label: string;
  sublabel?: string;
  position: { x: number; y: number };
};

type GraphEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
  kind: string;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const matterIdParam = searchParams.get("matterId");
  const matterId = matterIdParam ? Number(matterIdParam) : null;

  const data = await getAllData();

  const matters = matterId ? data.matters.filter((m) => m.id === matterId) : data.matters;
  const matterIds = new Set(matters.map((m) => m.id));

  const documents = data.documents.filter((d) => !matterId || d.matterId === matterId);
  const documentIds = new Set(documents.map((d) => d.id));

  const tags = data.tags.filter((t) => documentIds.has(t.documentId));

  const contactIdsInScope = new Set<number>();
  tags.forEach((t) => t.contactId && contactIdsInScope.add(t.contactId));
  data.roles.forEach((r) => {
    if (!matterId || r.matterId === matterId) contactIdsInScope.add(r.contactId);
  });
  const contacts = data.contacts.filter((c) => c.isCanonical && contactIdsInScope.has(c.id));

  const claims = data.claims.filter((c) => !matterId || c.matterId === matterId);
  const claimIds = new Set(claims.map((c) => c.id));
  const claimElements = data.claimElements.filter((ce) => claimIds.has(ce.claimId));
  const claimElementIds = new Set(claimElements.map((ce) => ce.id));
  const factLinks = data.factLinks.filter((fl) => claimElementIds.has(fl.claimElementId));

  const conceptValues = Array.from(
    new Set(tags.filter((t) => t.tagType === "concept").map((t) => t.tagValue)),
  );

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  matters.forEach((m, i) => {
    nodes.push({
      id: `matter-${m.id}`,
      type: "matter",
      label: m.name,
      sublabel: m.caseNumber ?? undefined,
      position: { x: 0, y: i * 220 },
    });
  });

  contacts.forEach((c, i) => {
    nodes.push({
      id: `contact-${c.id}`,
      type: "contact",
      label: c.displayName,
      sublabel: c.type.replace("_", " "),
      position: { x: 320, y: i * 110 },
    });
  });

  documents.forEach((d, i) => {
    nodes.push({
      id: `document-${d.id}`,
      type: "document",
      label: d.title,
      sublabel: d.sourceType.replace("_", " "),
      position: { x: 640, y: i * 95 },
    });
  });

  claims.forEach((cl, i) => {
    nodes.push({
      id: `claim-${cl.id}`,
      type: "claim",
      label: cl.title,
      sublabel: cl.statute ?? undefined,
      position: { x: 960, y: i * 180 },
    });
  });

  conceptValues.forEach((concept, i) => {
    nodes.push({
      id: `concept-${concept}`,
      type: "concept",
      label: concept,
      position: { x: 1260, y: i * 80 },
    });
  });

  // matter <-> contact (via roles)
  data.roles
    .filter((r) => matterIds.has(r.matterId ?? -1) && contactIdsInScope.has(r.contactId))
    .forEach((r) => {
      edges.push({
        id: `role-${r.id}`,
        source: `matter-${r.matterId}`,
        target: `contact-${r.contactId}`,
        label: r.roleLabel,
        kind: "role",
      });
    });

  // contact <-> contact relationships
  data.relationships
    .filter((rel) => contactIdsInScope.has(rel.fromContactId) && contactIdsInScope.has(rel.toContactId))
    .forEach((rel) => {
      edges.push({
        id: `rel-${rel.id}`,
        source: `contact-${rel.fromContactId}`,
        target: `contact-${rel.toContactId}`,
        label: rel.relationshipType,
        kind: "relationship",
      });
    });

  // document <-> contact (party tags) & document <-> concept
  tags.forEach((t) => {
    if (t.tagType === "party" && t.contactId && contactIdsInScope.has(t.contactId)) {
      edges.push({
        id: `tag-${t.id}`,
        source: `document-${t.documentId}`,
        target: `contact-${t.contactId}`,
        label: "mentions",
        kind: "mentions",
      });
    }
    if (t.tagType === "concept") {
      edges.push({
        id: `tag-${t.id}`,
        source: `document-${t.documentId}`,
        target: `concept-${t.tagValue}`,
        label: "concept",
        kind: "concept",
      });
    }
  });

  // matter <-> document
  documents.forEach((d) => {
    if (d.matterId) {
      edges.push({
        id: `matter-doc-${d.id}`,
        source: `matter-${d.matterId}`,
        target: `document-${d.id}`,
        label: "evidence",
        kind: "evidence",
      });
    }
  });

  // matter <-> claim
  claims.forEach((cl) => {
    edges.push({
      id: `matter-claim-${cl.id}`,
      source: `matter-${cl.matterId}`,
      target: `claim-${cl.id}`,
      label: "asserts",
      kind: "asserts",
    });
  });

  // claim <-> document (via fact links)
  factLinks.forEach((fl) => {
    if (fl.documentId && documentIds.has(fl.documentId)) {
      const ce = claimElements.find((c) => c.id === fl.claimElementId);
      if (ce) {
        edges.push({
          id: `factlink-${fl.id}`,
          source: `claim-${ce.claimId}`,
          target: `document-${fl.documentId}`,
          label: fl.polarity,
          kind: `fact-${fl.polarity}`,
        });
      }
    }
  });

  return NextResponse.json({ nodes, edges });
}
