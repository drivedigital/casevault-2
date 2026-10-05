/**
 * Pure claims-matrix logic shared by server routes, UI and tests.
 * Gap detection and health use ONLY accepted evidence links.
 */
import { z } from "zod";

export const PROOF_STRENGTHS = ["strong", "moderate", "weak", "gap"] as const;
export const ELEMENT_STATUSES = ["unreviewed", "in_progress", "supported", "disputed", "gap"] as const;
export const EVIDENCE_KINDS = ["document", "testimony", "chronology", "note"] as const;
export const POLARITIES = ["supporting", "adverse", "context"] as const;
export const REVIEW_STATES = ["proposed", "accepted", "rejected"] as const;
export const WITNESS_TYPES = ["fact", "expert", "adverse", "party", "custodian"] as const;

export type ProofStrength = (typeof PROOF_STRENGTHS)[number];
export type ElementStatus = (typeof ELEMENT_STATUSES)[number];
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];
export type Polarity = (typeof POLARITIES)[number];
export type ReviewState = (typeof REVIEW_STATES)[number];
export type WitnessType = (typeof WITNESS_TYPES)[number];

export interface MatrixLink {
  id: number;
  kind: EvidenceKind;
  polarity: Polarity;
  reviewState: ReviewState;
  documentId: number | null;
  documentTitle: string | null;
  chronologyEventId: number | null;
  chronologyTitle: string | null;
  contactId: number | null;
  contactName: string | null;
  pageCite: string | null;
  quote: string | null;
  exhibitLabel: string | null;
  notes: string | null;
}

export interface MatrixWitness {
  id: number;
  contactId: number;
  displayName: string;
  witnessType: WitnessType;
  notes: string | null;
}

export interface MatrixElement {
  id: number;
  claimId: number;
  position: number;
  title: string;
  description: string | null;
  proofStrength: ProofStrength;
  status: ElementStatus;
  authorityCitation: string | null;
  citationStatus: string;
  notes: string | null;
  links: MatrixLink[];
  witnesses: MatrixWitness[];
}

export interface MatrixClaim {
  id: number;
  matterId: number;
  title: string;
  statute: string | null;
  description: string | null;
  causeOfAction: string | null;
  jurisdiction: string | null;
  burdenOfProof: string;
  templateSlug: string | null;
  position: number;
  elements: MatrixElement[];
}

export interface ElementHint {
  suggested: ProofStrength;
  reason: string;
  differsFromRating: boolean;
}

/**
 * Advisory hint shown beside the attorney's rating. Never persisted, never overrides.
 */
export function computeElementHint(
  el: Pick<MatrixElement, "proofStrength" | "links" | "witnesses">,
): ElementHint {
  const accepted = el.links.filter((l) => l.reviewState === "accepted");
  const supporting = accepted.filter((l) => l.polarity === "supporting");
  const adverse = accepted.filter((l) => l.polarity === "adverse");
  const pinpointed = supporting.filter((l) => l.pageCite || l.quote);
  const proposed = el.links.filter((l) => l.reviewState === "proposed").length;

  let suggested: ProofStrength;
  let reason: string;
  if (supporting.length === 0) {
    suggested = "gap";
    reason = "No accepted supporting evidence";
  } else if (adverse.length >= supporting.length) {
    suggested = "weak";
    reason = `${adverse.length} adverse vs ${supporting.length} supporting`;
  } else if (supporting.length >= 2 && pinpointed.length >= 1 && (el.witnesses.length > 0 || supporting.length >= 3)) {
    suggested = "strong";
    reason = `${supporting.length} supporting (${pinpointed.length} pinpoint-cited)${el.witnesses.length ? `, ${el.witnesses.length} witness(es)` : ""}`;
  } else {
    suggested = supporting.length >= 2 || pinpointed.length >= 1 ? "moderate" : "weak";
    reason = `${supporting.length} supporting, ${pinpointed.length} pinpoint-cited`;
  }
  if (proposed) reason += ` · ${proposed} proposed awaiting review`;
  return { suggested, reason, differsFromRating: suggested !== el.proofStrength };
}

const STRENGTH_WEIGHT: Record<ProofStrength, number> = { strong: 1, moderate: 2 / 3, weak: 1 / 3, gap: 0 };

/** Claim health 0–100 from attorney ratings. */
export function claimHealth(elements: Pick<MatrixElement, "proofStrength">[]): number {
  if (!elements.length) return 0;
  const total = elements.reduce((s, e) => s + STRENGTH_WEIGHT[e.proofStrength], 0);
  return Math.round((total / elements.length) * 100);
}

export function isGap(el: Pick<MatrixElement, "proofStrength" | "status" | "links">): boolean {
  return (
    el.proofStrength === "gap" ||
    el.status === "gap" ||
    !el.links.some((l) => l.reviewState === "accepted" && l.polarity === "supporting")
  );
}

export function needsReview(el: Pick<MatrixElement, "status" | "links" | "citationStatus">): boolean {
  return el.status === "unreviewed" || el.links.some((l) => l.reviewState === "proposed");
}

export type MatrixFilter = "all" | "gaps" | "needs_review" | "supported";

export function filterElements(
  elements: MatrixElement[],
  opts: { filter: MatrixFilter; witnessContactId?: number | null; query?: string },
): MatrixElement[] {
  const q = opts.query?.trim().toLowerCase();
  return elements.filter((el) => {
    if (opts.filter === "gaps" && !isGap(el)) return false;
    if (opts.filter === "needs_review" && !needsReview(el)) return false;
    if (opts.filter === "supported" && isGap(el)) return false;
    if (opts.witnessContactId && !el.witnesses.some((w) => w.contactId === opts.witnessContactId)) return false;
    if (q) {
      const hay = [
        el.title,
        el.description,
        el.notes,
        el.authorityCitation,
        ...el.links.flatMap((l) => [l.quote, l.documentTitle, l.notes, l.exhibitLabel]),
        ...el.witnesses.map((w) => w.displayName),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

// ---------- Mutation payload schemas ----------
const optText = z.string().trim().max(20000).nullable().optional();
const optShort = (n: number) => z.string().trim().max(n).nullable().optional();

export const createClaimSchema = z.union([
  z.object({ templateSlug: z.string().trim().min(1).max(128) }),
  z.object({
    title: z.string().trim().min(1).max(500),
    statute: optShort(256),
    description: optText,
    causeOfAction: optText,
    jurisdiction: optShort(128),
    burdenOfProof: z.enum(["preponderance", "clear-and-convincing"]).optional(),
  }),
]);

export const updateClaimSchema = z.object({
  title: z.string().trim().min(1).max(500).optional(),
  statute: optShort(256),
  description: optText,
  causeOfAction: optText,
  jurisdiction: optShort(128),
  burdenOfProof: z.enum(["preponderance", "clear-and-convincing"]).optional(),
  position: z.number().int().optional(),
});

export const createElementSchema = z.object({
  title: z.string().trim().min(1).max(1000),
  description: optText,
  authorityCitation: optText,
});

export const reorderElementsSchema = z.object({
  order: z.array(z.number().int().positive()).min(1),
});

export const updateElementSchema = z.object({
  title: z.string().trim().min(1).max(1000).optional(),
  description: optText,
  proofStrength: z.enum(PROOF_STRENGTHS).optional(),
  status: z.enum(ELEMENT_STATUSES).optional(),
  authorityCitation: optText,
  citationStatus: z.enum(["verify", "verified"]).optional(),
  notes: optText,
});

export const createLinkSchema = z
  .object({
    kind: z.enum(EVIDENCE_KINDS).default("document"),
    polarity: z.enum(POLARITIES).default("supporting"),
    documentId: z.number().int().positive().nullable().optional(),
    chronologyEventId: z.number().int().positive().nullable().optional(),
    contactId: z.number().int().positive().nullable().optional(),
    pageCite: optShort(64),
    quote: optText,
    exhibitLabel: optShort(64),
    notes: optText,
  })
  .refine(
    (v) =>
      v.kind === "note"
        ? Boolean(v.notes)
        : v.kind === "chronology"
          ? Boolean(v.chronologyEventId)
          : Boolean(v.documentId),
    { message: "document/testimony links need documentId; chronology needs chronologyEventId; note needs notes" },
  );

export const updateLinkSchema = z.object({
  polarity: z.enum(POLARITIES).optional(),
  reviewState: z.enum(REVIEW_STATES).optional(),
  pageCite: optShort(64),
  quote: optText,
  exhibitLabel: optShort(64),
  notes: optText,
  contactId: z.number().int().positive().nullable().optional(),
});

export const addWitnessSchema = z.object({
  contactId: z.number().int().positive(),
  witnessType: z.enum(WITNESS_TYPES).default("fact"),
  notes: optText,
});

/** Parse "12", "p. 12", "12-14" → first page number, for deep links into the document viewer. */
export function firstPage(pageCite: string | null | undefined): number | null {
  const m = pageCite?.match(/\d+/);
  return m ? Number(m[0]) : null;
}
