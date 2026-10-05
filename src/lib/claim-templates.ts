/**
 * Code-defined claim templates (attorney-reviewable in version control).
 *
 * Copying a template into a matter creates ordinary claims/claim_elements rows.
 * Element text and authorities are DRAFT starting points for attorney review —
 * not legal advice and not a viability determination. Every authority is tagged
 * [VERIFY] and must be confirmed against current law before reliance.
 */

export interface ClaimTemplateElement {
  title: string;
  description?: string;
  /** Authority for the element itself; stored as authorityCitation with citationStatus "verify". */
  authority?: string;
  notes?: string;
}

export interface ClaimTemplate {
  slug: string;
  title: string;
  causeOfAction: string;
  statute?: string;
  jurisdiction: string;
  burdenOfProof: "preponderance" | "clear-and-convincing";
  description: string;
  elements: ClaimTemplateElement[];
}

const NY = "New York";

export const CLAIM_TEMPLATES: ClaimTemplate[] = [
  {
    slug: "ny-rpapl-768-unlawful-eviction",
    title: "Unlawful Eviction (RPAPL § 768)",
    causeOfAction: "Unlawful eviction",
    statute: "N.Y. RPAPL § 768",
    jurisdiction: NY,
    burdenOfProof: "preponderance",
    description:
      "Unlawful eviction of an occupant of a dwelling unit without a court order. [SME VERIFY: availability of a private right of action under § 768 versus enforcement via civil penalty; commonly pleaded with RPAPL § 853 for damages.]",
    elements: [
      {
        title: "Plaintiff lawfully occupied the dwelling unit",
        description: "Occupant who has lawfully occupied the dwelling unit for 30 consecutive days or longer, or a tenant.",
        authority: "RPAPL § 768(1) [VERIFY]",
      },
      {
        title: "Defendant evicted or attempted to evict plaintiff",
        authority: "RPAPL § 768(1) [VERIFY]",
      },
      {
        title: "By unlawful means",
        description:
          "Force or threat of force; or interfering with occupancy (e.g., removing possessions, removing the door, changing or plugging locks, removing/disabling furniture or essential services) intending to cause the occupant to vacate.",
        authority: "RPAPL § 768(1)(a)–(c) [VERIFY]",
      },
      {
        title: "Without a court order / warrant of eviction",
        description: "No judgment and warrant executed by a marshal, sheriff, or other authorized officer.",
        authority: "RPAPL § 768(1); RPAPL § 749 [VERIFY]",
      },
      {
        title: "Remedy / penalty",
        description: "Civil penalty per violation and per-day penalty for failure to restore; restoration to possession. Document dates of lockout and restoration requests.",
        authority: "RPAPL § 768(2) [VERIFY]",
        notes: "[SME VERIFY: penalty amounts and whether recoverable by occupant or government.]",
      },
    ],
  },
  {
    slug: "ny-rpapl-853-forcible-unlawful-entry",
    title: "Forcible or Unlawful Entry / Detainer — Treble Damages (RPAPL § 853)",
    causeOfAction: "Forcible or unlawful entry and detainer",
    statute: "N.Y. RPAPL § 853",
    jurisdiction: NY,
    burdenOfProof: "preponderance",
    description: "Treble damages where a person is put out of, or kept out of, real property in a forcible or unlawful manner.",
    elements: [
      {
        title: "Plaintiff was in possession of the real property",
        description: "Actual (peaceable) possession at the time of the ouster; title not required.",
        authority: "RPAPL § 853 [VERIFY]",
      },
      {
        title: "Defendant disseized, ejected, or put plaintiff out",
        description: "Or, after plaintiff was put out, held and kept plaintiff out.",
        authority: "RPAPL § 853 [VERIFY]",
      },
      {
        title: "In a forcible or unlawful manner",
        description: "By force, by putting plaintiff in fear of personal violence, or by unlawful means (e.g., self-help lockout without legal process).",
        authority: "RPAPL § 853 [VERIFY]",
        notes: "[SME VERIFY: interplay with RPAPL § 768 and 2019 HSTPA amendments.]",
      },
      {
        title: "Damages caused (subject to trebling)",
        description: "Actual damages — loss of use, property lost/damaged, relocation costs — supporting a treble award.",
        authority: "RPAPL § 853 [VERIFY]",
      },
    ],
  },
  {
    slug: "ny-breach-of-contract-written",
    title: "Breach of Contract — Written (NY)",
    causeOfAction: "Breach of contract (written)",
    jurisdiction: NY,
    burdenOfProof: "preponderance",
    description: "Breach of a written agreement. Identify the specific provisions breached.",
    elements: [
      {
        title: "Existence of a valid written contract",
        description: "Signed writing; parties; consideration; identify the operative document version.",
        authority: "Harris v. Seward Park Hous. Corp., 79 A.D.3d 425 (1st Dep't 2010) [VERIFY]",
      },
      {
        title: "Plaintiff's performance",
        description: "Plaintiff performed its obligations or was excused from performing.",
        authority: "Harris, 79 A.D.3d 425 [VERIFY]",
      },
      {
        title: "Defendant's breach",
        description: "Identify the specific contract provision(s) breached and the breaching conduct.",
        authority: "Harris, 79 A.D.3d 425 [VERIFY]",
      },
      {
        title: "Resulting damages",
        description: "Damages proximately caused by the breach and within the parties' contemplation.",
        authority: "Kenford Co. v. County of Erie, 67 N.Y.2d 257 (1986) [VERIFY]",
      },
    ],
  },
  {
    slug: "ny-breach-of-contract-oral",
    title: "Breach of Contract — Oral (NY)",
    causeOfAction: "Breach of contract (oral)",
    jurisdiction: NY,
    burdenOfProof: "preponderance",
    description: "Breach of an oral agreement. Check Statute of Frauds exposure early.",
    elements: [
      {
        title: "Oral agreement with sufficiently definite terms",
        description: "Offer, acceptance, consideration, mutual assent, and terms definite enough to enforce; who said what, when, and to whom.",
        authority: "Joseph Martin, Jr., Delicatessen v. Schumacher, 52 N.Y.2d 105 (1981) [VERIFY]",
      },
      {
        title: "Not barred by the Statute of Frauds",
        description: "Agreement capable of performance within one year, not an interest in real property, etc.; or an exception (part performance, admission) applies.",
        authority: "GOL § 5-701; GOL § 5-703 [VERIFY]",
      },
      {
        title: "Plaintiff's performance",
        authority: "Harris v. Seward Park Hous. Corp., 79 A.D.3d 425 [VERIFY]",
      },
      {
        title: "Defendant's breach",
        authority: "Harris, 79 A.D.3d 425 [VERIFY]",
      },
      {
        title: "Resulting damages",
        authority: "Harris, 79 A.D.3d 425 [VERIFY]",
      },
    ],
  },
  {
    slug: "ny-quantum-meruit",
    title: "Quantum Meruit (NY)",
    causeOfAction: "Quantum meruit",
    jurisdiction: NY,
    burdenOfProof: "preponderance",
    description: "Recovery for the reasonable value of services where no enforceable contract governs. Generally analyzed together with unjust enrichment.",
    elements: [
      {
        title: "Performance of services in good faith",
        authority: "Mid-Hudson Catskill Rural Migrant Ministry v. Fine Host Corp., 418 F.3d 168 (2d Cir. 2005) [VERIFY]",
      },
      {
        title: "Acceptance of the services by the defendant",
        authority: "Mid-Hudson, 418 F.3d 168 [VERIFY]",
      },
      {
        title: "Expectation of compensation",
        authority: "Mid-Hudson, 418 F.3d 168 [VERIFY]",
      },
      {
        title: "Reasonable value of the services",
        description: "Market rate, invoices, hours, expert valuation.",
        authority: "Mid-Hudson, 418 F.3d 168 [VERIFY]",
      },
      {
        title: "No valid, enforceable contract covers the same subject matter",
        authority: "Clark-Fitzpatrick, Inc. v. Long Island R.R. Co., 70 N.Y.2d 382 (1987) [VERIFY]",
      },
    ],
  },
  {
    slug: "ny-unjust-enrichment",
    title: "Unjust Enrichment (NY)",
    causeOfAction: "Unjust enrichment",
    jurisdiction: NY,
    burdenOfProof: "preponderance",
    description: "Quasi-contract claim; unavailable where it merely duplicates a conventional contract or tort claim.",
    elements: [
      {
        title: "Defendant was enriched",
        authority: "Mandarin Trading Ltd. v. Wildenstein, 16 N.Y.3d 173 (2011) [VERIFY]",
      },
      {
        title: "At plaintiff's expense",
        description: "Relationship between parties not too attenuated; defendant aware of plaintiff's role.",
        authority: "Georgia Malone & Co. v. Rieder, 19 N.Y.3d 511 (2012) [VERIFY]",
      },
      {
        title: "Equity and good conscience require restitution",
        authority: "Mandarin Trading, 16 N.Y.3d 173 [VERIFY]",
      },
      {
        title: "Not duplicative of a contract or tort claim",
        authority: "Corsello v. Verizon N.Y., Inc., 18 N.Y.3d 777 (2012); Clark-Fitzpatrick, 70 N.Y.2d 382 [VERIFY]",
      },
    ],
  },
  {
    slug: "common-law-trespass-to-possession",
    title: "Trespass (Interference with Possession)",
    causeOfAction: "Common law trespass to possession",
    jurisdiction: NY,
    burdenOfProof: "preponderance",
    description: "Intentional, unauthorized entry onto, or interference with, real property in plaintiff's possession.",
    elements: [
      {
        title: "Plaintiff's possession (actual or constructive) of the property",
        description: "Possessory interest suffices; tenant may sue owner.",
        authority: "[SME VERIFY: NY authority on possessory standing]",
      },
      {
        title: "Intentional entry or intrusion by defendant",
        description: "Defendant (or a thing defendant caused) entered the property; intent to enter, not intent to trespass.",
        authority: "Phillips v. Sun Oil Co., 307 N.Y. 328 (1954) [VERIFY]",
      },
      {
        title: "Without permission, license, or legal authority",
        authority: "[SME VERIFY]",
      },
      {
        title: "Damages",
        description: "Nominal damages presumed; document actual damages and any basis for punitive damages.",
        authority: "[SME VERIFY]",
      },
    ],
  },
  {
    slug: "ny-conversion",
    title: "Conversion (NY)",
    causeOfAction: "Conversion",
    jurisdiction: NY,
    burdenOfProof: "preponderance",
    description: "Unauthorized dominion over specific, identifiable personal property.",
    elements: [
      {
        title: "Plaintiff's possessory right or interest in the property",
        description: "Specific, identifiable property (money must be specifically identifiable/segregated).",
        authority: "Colavito v. N.Y. Organ Donor Network, Inc., 8 N.Y.3d 43 (2006) [VERIFY]",
      },
      {
        title: "Defendant's dominion over or interference with the property",
        description: "In derogation of plaintiff's rights.",
        authority: "Colavito, 8 N.Y.3d 43 [VERIFY]",
      },
      {
        title: "Demand and refusal (if defendant's initial possession was lawful)",
        authority: "[SME VERIFY]",
      },
      {
        title: "Damages (value at time of conversion)",
        authority: "[SME VERIFY]",
      },
    ],
  },
  {
    slug: "ny-promissory-estoppel",
    title: "Promissory Estoppel (NY)",
    causeOfAction: "Promissory estoppel",
    jurisdiction: NY,
    burdenOfProof: "preponderance",
    description: "Enforcement of a promise absent a contract. If used to avoid the Statute of Frauds, unconscionable injury is required.",
    elements: [
      {
        title: "Clear and unambiguous promise",
        authority: "Kaye v. Grossman, 202 F.3d 611 (2d Cir. 2000) [VERIFY]",
      },
      {
        title: "Reasonable and foreseeable reliance by plaintiff",
        authority: "Kaye, 202 F.3d 611 [VERIFY]",
      },
      {
        title: "Injury sustained in reliance",
        description: "Where the Statute of Frauds applies: unconscionable injury beyond ordinary reliance damages.",
        authority: "Kaye, 202 F.3d 611; Merex A.G. v. Fairchild Weston Sys., 29 F.3d 821 (2d Cir. 1994) [VERIFY]",
      },
    ],
  },
  {
    slug: "ny-breach-quiet-enjoyment",
    title: "Breach of Covenant of Quiet Enjoyment (NY)",
    causeOfAction: "Breach of covenant of quiet enjoyment",
    jurisdiction: NY,
    burdenOfProof: "preponderance",
    description: "Landlord's actual or constructive eviction of the tenant. Distinct from the warranty of habitability (RPL § 235-b).",
    elements: [
      {
        title: "Landlord–tenant relationship (lease)",
        authority: "[SME VERIFY]",
      },
      {
        title: "Actual or constructive eviction",
        description: "Landlord's wrongful acts substantially and materially deprived tenant of beneficial use and enjoyment of all or part of the premises.",
        authority: "Barash v. Pennsylvania Terminal Real Estate Corp., 26 N.Y.2d 77 (1970) [VERIFY]",
      },
      {
        title: "Tenant abandoned possession (constructive eviction) or was ousted (actual/partial eviction)",
        description: "Abandonment generally required for constructive eviction; not required for partial actual eviction.",
        authority: "Dave Herstein Co. v. Columbia Pictures Corp., 4 N.Y.2d 117 (1958) [VERIFY]",
      },
      {
        title: "Damages / rent abatement",
        authority: "[SME VERIFY]",
      },
    ],
  },
  {
    slug: "ny-negligent-hiring-supervision-retention",
    title: "Negligent Hiring, Supervision, or Retention (NY)",
    causeOfAction: "Negligent hiring/supervision/retention",
    jurisdiction: NY,
    burdenOfProof: "preponderance",
    description: "Direct employer negligence. Generally unavailable where the employee acted within the scope of employment (respondeat superior applies instead).",
    elements: [
      {
        title: "Employer–employee relationship",
        authority: "Ehrens v. Lutheran Church, 385 F.3d 232 (2d Cir. 2004) [VERIFY]",
      },
      {
        title: "Employer knew or should have known of the employee's propensity for the conduct that caused the injury",
        description: "Prior complaints, background check results, disciplinary history.",
        authority: "Ehrens, 385 F.3d 232 [VERIFY]",
      },
      {
        title: "Tort committed on employer's premises or with employer's chattels",
        authority: "Ehrens, 385 F.3d 232 [VERIFY]",
      },
      {
        title: "Employee acted outside the scope of employment",
        authority: "[SME VERIFY: Department-specific rule]",
      },
      {
        title: "Proximate cause and damages",
        authority: "[SME VERIFY]",
      },
    ],
  },
  {
    slug: "ny-negligent-premises-safety",
    title: "Premises Liability / Negligent Premises Safety (NY)",
    causeOfAction: "Negligent premises safety",
    jurisdiction: NY,
    burdenOfProof: "preponderance",
    description: "Failure to maintain premises in a reasonably safe condition (including negligent security variants).",
    elements: [
      {
        title: "Defendant owned, occupied, controlled, or made special use of the premises",
        authority: "[SME VERIFY]",
      },
      {
        title: "A dangerous or defective condition existed",
        description: "For negligent security: foreseeability of criminal conduct from prior similar incidents.",
        authority: "Basso v. Miller, 40 N.Y.2d 233 (1976) [VERIFY]",
      },
      {
        title: "Defendant created the condition or had actual or constructive notice",
        description: "Constructive notice: visible and apparent, existing long enough to discover and remedy.",
        authority: "Gordon v. Am. Museum of Natural History, 67 N.Y.2d 836 (1986) [VERIFY]",
      },
      {
        title: "Failure to remedy within a reasonable time",
        authority: "[SME VERIFY]",
      },
      {
        title: "Proximate cause",
        authority: "[SME VERIFY]",
      },
      {
        title: "Damages",
        authority: "[SME VERIFY]",
      },
    ],
  },
  {
    slug: "ny-crl-50-51-name-likeness",
    title: "Unauthorized Use of Name or Likeness (NY Civil Rights Law §§ 50–51)",
    causeOfAction: "Statutory right of privacy",
    statute: "N.Y. Civ. Rights Law §§ 50–51",
    jurisdiction: NY,
    burdenOfProof: "preponderance",
    description: "Statutory privacy claim; NY recognizes no common-law privacy tort. Check the one-year limitations period.",
    elements: [
      {
        title: "Use of plaintiff's name, portrait, picture, likeness, or voice",
        authority: "Civ. Rights Law § 51 [VERIFY]",
      },
      {
        title: "Within the State of New York",
        authority: "Civ. Rights Law § 51 [VERIFY]",
      },
      {
        title: "For advertising purposes or for the purposes of trade",
        description: "Not newsworthy / public-interest use.",
        authority: "Messenger v. Gruner + Jahr Printing & Publ'g, 94 N.Y.2d 436 (2000) [VERIFY]",
      },
      {
        title: "Without written consent",
        authority: "Civ. Rights Law § 50 [VERIFY]",
      },
      {
        title: "Damages; knowing use (exemplary damages)",
        authority: "Civ. Rights Law § 51 [VERIFY]",
        notes: "[SME VERIFY: CPLR 215(3) one-year limitations period; single-publication rule.]",
      },
    ],
  },
  {
    slug: "ny-defamation",
    title: "Defamation — Libel / Slander (NY)",
    causeOfAction: "Defamation",
    jurisdiction: NY,
    burdenOfProof: "preponderance",
    description: "Exact words must be pleaded (CPLR 3016(a)). One-year limitations period (CPLR 215(3)). Actual malice by clear and convincing evidence for public figures.",
    elements: [
      {
        title: "A false statement of fact about plaintiff",
        description: "Exact words; of and concerning plaintiff; fact, not opinion.",
        authority: "Dillon v. City of New York, 261 A.D.2d 34 (1st Dep't 1999) [VERIFY]",
      },
      {
        title: "Published to a third party without privilege or authorization",
        authority: "Dillon, 261 A.D.2d 34 [VERIFY]",
      },
      {
        title: "Fault — at least negligence (actual malice for public figures)",
        authority: "Dillon, 261 A.D.2d 34 [VERIFY]",
      },
      {
        title: "Special damages or defamation per se",
        description: "Per se categories: serious crime, trade/profession, loathsome disease, unchastity.",
        authority: "Liberman v. Gelstein, 80 N.Y.2d 429 (1992) [VERIFY]",
      },
    ],
  },
  {
    slug: "ny-tortious-interference-contract",
    title: "Tortious Interference with Contract (NY)",
    causeOfAction: "Tortious interference with contract",
    jurisdiction: NY,
    burdenOfProof: "preponderance",
    description: "Intentional procurement of a third party's breach of an existing contract.",
    elements: [
      {
        title: "Valid contract between plaintiff and a third party",
        authority: "Lama Holding Co. v. Smith Barney Inc., 88 N.Y.2d 413 (1996) [VERIFY]",
      },
      {
        title: "Defendant's knowledge of the contract",
        authority: "Lama Holding, 88 N.Y.2d 413 [VERIFY]",
      },
      {
        title: "Intentional procurement of the third party's breach without justification",
        authority: "Lama Holding, 88 N.Y.2d 413 [VERIFY]",
      },
      {
        title: "Actual breach of the contract",
        authority: "Lama Holding, 88 N.Y.2d 413 [VERIFY]",
      },
      {
        title: "Resulting damages",
        authority: "Lama Holding, 88 N.Y.2d 413 [VERIFY]",
      },
    ],
  },
  {
    slug: "ny-tortious-interference-prospective",
    title: "Tortious Interference with Prospective Economic Advantage (NY)",
    causeOfAction: "Tortious interference with prospective business relations",
    jurisdiction: NY,
    burdenOfProof: "preponderance",
    description: "Interference with non-contractual business relations by wrongful means.",
    elements: [
      {
        title: "Business relations with a third party",
        authority: "Carvel Corp. v. Noonan, 3 N.Y.3d 182 (2004) [VERIFY]",
      },
      {
        title: "Defendant interfered with those relations",
        authority: "Carvel, 3 N.Y.3d 182 [VERIFY]",
      },
      {
        title: "Defendant acted solely out of malice or used dishonest, unfair, or improper (wrongful) means",
        description: "Generally conduct amounting to a crime or independent tort.",
        authority: "Carvel, 3 N.Y.3d 182 [VERIFY]",
      },
      {
        title: "Injury to the relationship",
        authority: "Carvel, 3 N.Y.3d 182 [VERIFY]",
      },
    ],
  },
  {
    slug: "ny-fraud",
    title: "Fraud (NY)",
    causeOfAction: "Fraud",
    jurisdiction: NY,
    burdenOfProof: "clear-and-convincing",
    description: "Must be pleaded with particularity (CPLR 3016(b)); each element proved by clear and convincing evidence.",
    elements: [
      {
        title: "Material misrepresentation or omission of fact",
        description: "Who, what, when, where; omission requires duty to disclose.",
        authority: "Eurycleia Partners, LP v. Seward & Kissel, LLP, 12 N.Y.3d 553 (2009) [VERIFY]",
      },
      {
        title: "Knowledge of falsity (scienter)",
        authority: "Eurycleia, 12 N.Y.3d 553 [VERIFY]",
      },
      {
        title: "Intent to induce reliance",
        authority: "Eurycleia, 12 N.Y.3d 553 [VERIFY]",
      },
      {
        title: "Justifiable reliance",
        authority: "Eurycleia, 12 N.Y.3d 553 [VERIFY]",
      },
      {
        title: "Resulting injury (out-of-pocket damages)",
        authority: "Lama Holding Co. v. Smith Barney Inc., 88 N.Y.2d 413 [VERIFY]",
      },
    ],
  },
];

export function findClaimTemplate(slug: string): ClaimTemplate | undefined {
  return CLAIM_TEMPLATES.find((t) => t.slug === slug);
}
