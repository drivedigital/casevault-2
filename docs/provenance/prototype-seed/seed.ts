/* eslint-disable no-console */
import "dotenv/config";
import { db, pool } from "@/db";
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

async function truncateAll() {
  await db.execute(`
    truncate table
      activity_log, tasks, deadlines, fact_links, claim_elements, claims,
      chronology_events, ai_proposals, document_tags, docket_entries, documents,
      dockets, source_connectors, contact_relationships, contact_roles,
      contact_aliases, contacts, matters
    restart identity cascade
  `);
}

async function main() {
  console.log("Seeding CaseVault 2.0 sample data...");
  await truncateAll();

  // ---------------- MATTERS ----------------
  const [matterSupreme, matterHousing] = await db
    .insert(matters)
    .values([
      {
        name: "Meridian Holdings LLC v. 440 Clove Road Tenants",
        caseNumber: "153243/2026",
        court: "Supreme Court, Richmond County",
        status: "active",
        description:
          "RPAPL 853 forcible entry & detainer and conversion claims arising from a disputed self-help lockout and removal of tenant personal property at 440 Clove Road.",
      },
      {
        name: "George v. Vasquez — Holdover Proceeding",
        caseNumber: "LT-316530/2026",
        court: "Civil Court of the City of New York, Richmond County — Housing Part",
        status: "active",
        description:
          "Holdover summary proceeding following expiration of a notice to cure for alleged lease violations at 440 Clove Road, Unit 3R.",
      },
    ])
    .returning();

  // ---------------- CONTACTS (Converge Identity) ----------------
  const [
    danielGeorge,
    meridianHoldings,
    elenaVasquez,
    marcusBoyd,
    kesslerBoydFirm,
    priyaNair,
    legalAidSociety,
    chrisDoyle,
    courtRichmond,
    courtHousing,
    sandraLin,
    notaryOffice,
  ] = await db
    .insert(contacts)
    .values([
      {
        type: "individual",
        displayName: "Daniel R. George",
        primaryEmail: "dgeorge@meridianholdingsllc.com",
        primaryPhone: "(718) 555-0142",
        notes:
          "Principal of Meridian Holdings LLC. Appears in filings both individually and in representative capacity as Managing Member.",
        avatarColor: "#6366f1",
        isCanonical: true,
      },
      {
        type: "organization",
        displayName: "Meridian Holdings LLC",
        primaryEmail: "info@meridianholdingsllc.com",
        notes: "Property holding company; record owner of 440 Clove Road.",
        avatarColor: "#0ea5e9",
        isCanonical: true,
      },
      {
        type: "individual",
        displayName: "Elena M. Vasquez",
        primaryEmail: "elena.vasquez@gmail.com",
        primaryPhone: "(347) 555-0198",
        notes: "Tenant of record, Unit 3R, 440 Clove Road since 2019.",
        avatarColor: "#f97316",
        isCanonical: true,
      },
      {
        type: "individual",
        displayName: "Marcus Boyd, Esq.",
        primaryEmail: "mboyd@kesslerboydlaw.com",
        primaryPhone: "(212) 555-7731",
        notes: "Counsel for Petitioner / Plaintiff Meridian Holdings LLC.",
        avatarColor: "#8b5cf6",
        isCanonical: true,
      },
      {
        type: "law_firm",
        displayName: "Kessler & Boyd LLP",
        primaryEmail: "contact@kesslerboydlaw.com",
        notes: "Outside counsel representing Meridian Holdings LLC / Daniel George.",
        avatarColor: "#8b5cf6",
        isCanonical: true,
      },
      {
        type: "individual",
        displayName: "Priya Nair, Esq.",
        primaryEmail: "pnair@legalaidnyc.org",
        primaryPhone: "(212) 555-4420",
        notes: "Counsel for Respondent / Defendant Elena Vasquez.",
        avatarColor: "#10b981",
        isCanonical: true,
      },
      {
        type: "law_firm",
        displayName: "The Legal Aid Society",
        primaryEmail: "housing@legalaidnyc.org",
        notes: "Represents Elena Vasquez in the holdover proceeding.",
        avatarColor: "#10b981",
        isCanonical: true,
      },
      {
        type: "individual",
        displayName: "Chris Doyle",
        primaryEmail: "cdoyle@apexpropertymgmt.com",
        primaryPhone: "(718) 555-3321",
        notes: "On-site property manager for Meridian Holdings LLC; fact witness to the lockout.",
        avatarColor: "#eab308",
        isCanonical: true,
      },
      {
        type: "court",
        displayName: "Supreme Court, Richmond County",
        notes: "Index No. 153243/2026 assigned to Hon. part 12.",
        avatarColor: "#475569",
        isCanonical: true,
      },
      {
        type: "court",
        displayName: "Civil Court, Richmond County — Housing Part",
        notes: "LT-316530/2026 holdover docket.",
        avatarColor: "#475569",
        isCanonical: true,
      },
      {
        type: "individual",
        displayName: "Sandra Lin",
        primaryEmail: "slin@lincertifiedlocksmith.com",
        notes: "Locksmith who re-keyed Unit 3R on 02/14/2026 per invoice #4471.",
        avatarColor: "#ec4899",
        isCanonical: true,
      },
      {
        type: "organization",
        displayName: "Richmond County Clerk — NYSCEF Office",
        notes: "Electronic filing registrar for Supreme Court matter.",
        avatarColor: "#475569",
        isCanonical: true,
      },
    ])
    .returning();

  // Unresolved / needs-review contact awaiting alias merge (fuzzy match candidate)
  const [dannyGeorgeDupe] = await db
    .insert(contacts)
    .values([
      {
        type: "individual",
        displayName: "Danny George",
        notes: "Auto-extracted from OCR of Exhibit F invoice signature block. Possible duplicate of Daniel R. George.",
        avatarColor: "#6366f1",
        isCanonical: false,
      },
    ])
    .returning();

  await db.insert(contactAliases).values([
    { contactId: danielGeorge.id, aliasName: "Dan George", source: "Verified Petition", confidence: 0.97 },
    { contactId: danielGeorge.id, aliasName: "D. George", source: "Affidavit of Service", confidence: 0.91 },
    { contactId: danielGeorge.id, aliasName: "Daniel George", source: "NYSCEF Docket Caption", confidence: 0.99 },
    { contactId: danielGeorge.id, aliasName: "Danny George", source: "Exhibit F — Locksmith Invoice #4471", confidence: 0.74, resolved: false },
    { contactId: meridianHoldings.id, aliasName: "Meridian Holdings, LLC", source: "Deed of Record", confidence: 0.98 },
    { contactId: meridianHoldings.id, aliasName: "440 Clove Road Realty", source: "Housing Court Caption", confidence: 0.68, resolved: false },
    { contactId: elenaVasquez.id, aliasName: "E. Vasquez", source: "Notice to Cure", confidence: 0.95 },
    { contactId: elenaVasquez.id, aliasName: "Elena Vasquez", source: "Lease Agreement", confidence: 0.99 },
    { contactId: elenaVasquez.id, aliasName: "Elena M. Vasquez-Ortiz", source: "Utility Bill Exhibit", confidence: 0.62, resolved: false },
  ]);

  await db.insert(contactRoles).values([
    { contactId: danielGeorge.id, matterId: matterSupreme.id, capacity: "Individual", roleLabel: "Plaintiff", side: "petitioner" },
    { contactId: danielGeorge.id, matterId: matterSupreme.id, capacity: "Managing Member, Meridian Holdings LLC", roleLabel: "Plaintiff (Representative Capacity)", side: "petitioner" },
    { contactId: danielGeorge.id, matterId: matterHousing.id, capacity: "Managing Member, Meridian Holdings LLC", roleLabel: "Petitioner", side: "petitioner" },
    { contactId: meridianHoldings.id, matterId: matterSupreme.id, capacity: "Record Owner", roleLabel: "Plaintiff", side: "petitioner" },
    { contactId: meridianHoldings.id, matterId: matterHousing.id, capacity: "Record Owner", roleLabel: "Petitioner", side: "petitioner" },
    { contactId: elenaVasquez.id, matterId: matterSupreme.id, capacity: "Individual", roleLabel: "Defendant", side: "respondent" },
    { contactId: elenaVasquez.id, matterId: matterHousing.id, capacity: "Tenant of Record", roleLabel: "Respondent", side: "respondent" },
    { contactId: marcusBoyd.id, matterId: matterSupreme.id, capacity: "Attorney of Record", roleLabel: "Counsel for Plaintiff", side: "petitioner" },
    { contactId: marcusBoyd.id, matterId: matterHousing.id, capacity: "Attorney of Record", roleLabel: "Counsel for Petitioner", side: "petitioner" },
    { contactId: priyaNair.id, matterId: matterHousing.id, capacity: "Attorney of Record", roleLabel: "Counsel for Respondent", side: "respondent" },
    { contactId: priyaNair.id, matterId: matterSupreme.id, capacity: "Attorney of Record", roleLabel: "Counsel for Defendant", side: "respondent" },
    { contactId: chrisDoyle.id, matterId: matterSupreme.id, capacity: "Fact Witness", roleLabel: "Property Manager", side: "petitioner" },
    { contactId: sandraLin.id, matterId: matterSupreme.id, capacity: "Fact Witness", roleLabel: "Locksmith / Third Party", side: "neutral" },
  ]);

  await db.insert(contactRelationships).values([
    { fromContactId: danielGeorge.id, toContactId: meridianHoldings.id, relationshipType: "Managing Member of", notes: "Signs filings in representative capacity." },
    { fromContactId: marcusBoyd.id, toContactId: kesslerBoydFirm.id, relationshipType: "Partner at", notes: null },
    { fromContactId: priyaNair.id, toContactId: legalAidSociety.id, relationshipType: "Staff Attorney at", notes: null },
    { fromContactId: chrisDoyle.id, toContactId: meridianHoldings.id, relationshipType: "Employed by", notes: "On-site property manager." },
    { fromContactId: sandraLin.id, toContactId: danielGeorge.id, relationshipType: "Retained by", notes: "Invoice #4471 — re-key service." },
    { fromContactId: dannyGeorgeDupe.id, toContactId: danielGeorge.id, relationshipType: "Possible duplicate of", notes: "Pending alias merge review." },
  ]);

  // ---------------- SOURCE CONNECTORS ----------------
  const now = new Date();
  await db.insert(sourceConnectors).values([
    {
      name: "NYSCEF Desktop Runner",
      kind: "docket_key_webhook",
      status: "connected",
      detail: "Local Playwright runner authenticated against NYSCEF; pushes docket snapshots + filings via webhook.",
      lastSyncAt: new Date(now.getTime() - 1000 * 60 * 24),
    },
    {
      name: "Google Drive — Case Folder /440 Clove Road",
      kind: "google_drive",
      status: "connected",
      detail: "Service account access to shared Drive folder; polling every 15 minutes for new or modified PDFs.",
      lastSyncAt: new Date(now.getTime() - 1000 * 60 * 52),
    },
    {
      name: "Cloudflare R2 — case-vault-exhibits",
      kind: "object_storage",
      status: "connected",
      detail: "Zero-egress bucket storing original PDFs, exhibits, and attachments referenced by presigned URL.",
      lastSyncAt: new Date(now.getTime() - 1000 * 60 * 5),
    },
    {
      name: "Shared Mailbox — intake@casevault",
      kind: "email",
      status: "disconnected",
      detail: "Not yet configured. Connect to auto-ingest emailed exhibits.",
      lastSyncAt: null,
    },
  ]);

  // ---------------- DOCKETS ----------------
  const [docketSupreme, docketHousing] = await db
    .insert(dockets)
    .values([
      {
        matterId: matterSupreme.id,
        indexNumber: "153243/2026",
        court: "Supreme Court, Richmond County",
        caption: "Daniel R. George and Meridian Holdings LLC v. Elena M. Vasquez",
        status: "active",
      },
      {
        matterId: matterHousing.id,
        indexNumber: "LT-316530/2026",
        court: "Civil Court, Richmond County — Housing Part",
        caption: "Meridian Holdings LLC v. Elena M. Vasquez",
        status: "active",
      },
    ])
    .returning();

  // ---------------- DOCUMENTS ----------------
  const docRows = await db
    .insert(documents)
    .values([
      // --- Docket filings: Supreme Court ---
      {
        matterId: matterSupreme.id,
        docketId: docketSupreme.id,
        title: "Summons and Verified Complaint",
        fileName: "153243-2026_001_summons-complaint.pdf",
        sourceType: "docket_filing",
        sourceSystem: "NYSCEF",
        status: "verified",
        sha256: "a13f...9c02",
        pageCount: 18,
        fileUrl: "/sample-pdfs/summons-complaint.pdf",
        ocrText:
          "SUPREME COURT OF THE STATE OF NEW YORK COUNTY OF RICHMOND... Plaintiffs Daniel R. George, individually, and Meridian Holdings LLC, by Daniel R. George, as Managing Member, allege upon information and belief: 1. That at all relevant times Plaintiff Meridian Holdings LLC was and is the record owner of the premises known as 440 Clove Road... 14. That on or about February 14, 2026, Defendant Elena M. Vasquez changed the locks to the common storage area without authorization and removed fixtures belonging to Plaintiff, constituting conversion under New York law...",
        aiSummary:
          "Verified complaint asserting conversion and RPAPL 853 claims against Elena Vasquez arising from a February 14, 2026 lock change and removal of storage-area fixtures. Names Daniel R. George both individually and as Managing Member of Meridian Holdings LLC.",
        keyConcepts: ["conversion", "RPAPL 853", "lock change", "storage fixtures", "representative capacity"],
        isFlagged: true,
        flagReason: "Pleading names plaintiff in two legal capacities — verify capacity separation in Converge before use in claims matrix.",
        filedDate: "2026-02-20",
      },
      {
        matterId: matterSupreme.id,
        docketId: docketSupreme.id,
        title: "Affidavit of Service — Summons and Complaint",
        fileName: "153243-2026_002_aos.pdf",
        sourceType: "docket_filing",
        sourceSystem: "NYSCEF",
        status: "indexed",
        sha256: "b874...1e4d",
        pageCount: 2,
        fileUrl: "/sample-pdfs/affidavit-of-service.pdf",
        ocrText:
          "AFFIDAVIT OF SERVICE... I, Robert Kinsey, being duly sworn, depose and say I am over 18 years of age and not a party to this action. On February 22, 2026 at 440 Clove Road, Staten Island, NY, I served the within Summons and Verified Complaint upon Elena M. Vasquez by personally delivering a true copy to D. George, who identified himself as authorized to accept...",
        aiSummary: "Process server affidavit confirming substitute service of the summons and complaint on February 22, 2026; curiously references 'D. George' accepting on behalf of the defendant, which warrants review.",
        keyConcepts: ["service of process", "substitute service"],
        isFlagged: true,
        flagReason: "Service recipient 'D. George' is the plaintiff's alias — possible drafting error in affidavit; flag for attorney review.",
        filedDate: "2026-02-23",
      },
      {
        matterId: matterSupreme.id,
        docketId: docketSupreme.id,
        title: "Verified Answer with Affirmative Defenses",
        fileName: "153243-2026_003_answer.pdf",
        sourceType: "docket_filing",
        sourceSystem: "NYSCEF",
        status: "indexed",
        sha256: "c912...7aa1",
        pageCount: 9,
        fileUrl: "/sample-pdfs/verified-answer.pdf",
        ocrText:
          "Defendant Elena M. Vasquez, by her attorney Priya Nair, Esq. of The Legal Aid Society, answers the Verified Complaint and asserts as a First Affirmative Defense that Plaintiff engaged in an illegal self-help eviction in violation of RPAPL 853, and as a Second Affirmative Defense that the purported storage-area fixtures were in fact Defendant's personal property including a bicycle, tools, and seasonal furniture...",
        aiSummary: "Answer denies conversion allegations and raises an illegal lockout / self-help eviction affirmative defense under RPAPL 853, asserting the removed items were Vasquez's personal property.",
        keyConcepts: ["affirmative defense", "RPAPL 853", "self-help eviction", "personal property"],
        isFlagged: false,
        filedDate: "2026-03-10",
      },
      {
        matterId: matterSupreme.id,
        docketId: docketSupreme.id,
        title: "Notice of Motion to Dismiss (CPLR 3211)",
        fileName: "153243-2026_004_motion-to-dismiss.pdf",
        sourceType: "docket_filing",
        sourceSystem: "NYSCEF",
        status: "pending_review",
        sha256: "d561...44bc",
        pageCount: 6,
        fileUrl: "/sample-pdfs/motion-to-dismiss.pdf",
        ocrText:
          "PLEASE TAKE NOTICE that upon the annexed affirmation of Priya Nair, Esq., dated March 24, 2026, and all prior pleadings and proceedings, Defendant will move this Court for an Order pursuant to CPLR 3211(a)(7) dismissing the First Cause of Action for failure to state a claim, returnable April 15, 2026 at 9:30 a.m...",
        aiSummary: "Motion to dismiss the conversion cause of action under CPLR 3211(a)(7); return date April 15, 2026.",
        keyConcepts: ["CPLR 3211", "motion to dismiss", "conversion"],
        isFlagged: false,
        filedDate: "2026-03-24",
      },
      {
        matterId: matterSupreme.id,
        docketId: docketSupreme.id,
        title: "Affirmation in Opposition to Motion to Dismiss",
        fileName: "153243-2026_005_affirmation-opposition.pdf",
        sourceType: "docket_filing",
        sourceSystem: "NYSCEF",
        status: "pending_review",
        sha256: null,
        pageCount: 11,
        fileUrl: "/sample-pdfs/affirmation-opposition.pdf",
        ocrText: null,
        aiSummary: null,
        keyConcepts: [],
        isFlagged: false,
        filedDate: "2026-04-05",
      },
      // --- Docket filings: Housing Court ---
      {
        matterId: matterHousing.id,
        docketId: docketHousing.id,
        title: "Notice of Petition and Petition (Holdover)",
        fileName: "LT-316530-2026_001_petition.pdf",
        sourceType: "docket_filing",
        sourceSystem: "NYSCEF",
        status: "verified",
        sha256: "e221...0091",
        pageCount: 7,
        fileUrl: "/sample-pdfs/holdover-petition.pdf",
        ocrText:
          "CIVIL COURT OF THE CITY OF NEW YORK COUNTY OF RICHMOND, HOUSING PART... Petitioner Meridian Holdings LLC, by its Managing Member Daniel George, alleges that Respondent Elena Vasquez has failed to cure violations set forth in the Ten-Day Notice to Cure dated January 20, 2026, including unauthorized subletting and storage of personal property in common areas...",
        aiSummary: "Holdover petition alleging failure to cure lease violations (unauthorized subletting, common-area storage) per a January 20, 2026 notice to cure.",
        keyConcepts: ["holdover", "notice to cure", "unauthorized subletting"],
        isFlagged: false,
        filedDate: "2026-02-02",
      },
      {
        matterId: matterHousing.id,
        docketId: docketHousing.id,
        title: "Ten-Day Notice to Cure",
        fileName: "LT-316530-2026_002_notice-to-cure.pdf",
        sourceType: "docket_filing",
        sourceSystem: "NYSCEF",
        status: "verified",
        sha256: "f330...22cd",
        pageCount: 2,
        fileUrl: "/sample-pdfs/notice-to-cure.pdf",
        ocrText:
          "NOTICE TO CURE... YOU ARE HEREBY REQUIRED to cure the following violations of your lease within ten (10) days of service of this notice: (1) unauthorized subletting of a portion of Unit 3R; (2) storage of personal property including a bicycle and furniture in the common storage area without authorization...",
        aiSummary: "Predicate ten-day notice to cure served January 20, 2026 identifying subletting and common-area storage violations; statutory predicate for the holdover petition.",
        keyConcepts: ["notice to cure", "predicate notice", "lease violation"],
        isFlagged: false,
        filedDate: "2026-01-20",
      },
      {
        matterId: matterHousing.id,
        docketId: docketHousing.id,
        title: "Tenant's Verified Answer (Pro Se, later amended)",
        fileName: "LT-316530-2026_003_answer.pdf",
        sourceType: "docket_filing",
        sourceSystem: "NYSCEF",
        status: "pending_review",
        sha256: null,
        pageCount: 4,
        fileUrl: "/sample-pdfs/tenant-answer.pdf",
        ocrText: null,
        aiSummary: null,
        keyConcepts: [],
        isFlagged: false,
        filedDate: "2026-02-18",
      },
      // --- Drive-synced source documents ---
      {
        matterId: matterSupreme.id,
        docketId: null,
        title: "Residential Lease Agreement — Unit 3R",
        fileName: "Lease_440CloveRoad_Unit3R_2019.pdf",
        sourceType: "drive",
        sourceSystem: "Google Drive — /440 Clove Road/Leases",
        status: "verified",
        sha256: "11aa...bb22",
        pageCount: 14,
        fileUrl: "/sample-pdfs/lease-agreement.pdf",
        ocrText:
          "RESIDENTIAL LEASE AGREEMENT entered into this 1st day of June, 2019 between Meridian Holdings LLC ('Landlord') and Elena Vasquez ('Tenant') for premises known as 440 Clove Road, Unit 3R... Section 12: Tenant shall not sublet any portion of the premises without prior written consent of Landlord. Section 18: Common storage areas are provided for Landlord's use only absent separate written agreement...",
        aiSummary: "Original 2019 lease between Meridian Holdings LLC and Elena Vasquez; Section 12 bars subletting without consent, Section 18 restricts common-area storage — directly relevant predicate for the notice to cure.",
        keyConcepts: ["lease terms", "subletting clause", "common storage"],
        isFlagged: false,
        filedDate: "2019-06-01",
      },
      {
        matterId: matterSupreme.id,
        docketId: null,
        title: "Property Damage & Lockout Photo Log",
        fileName: "Photos_Lockout_02-14-2026.pdf",
        sourceType: "drive",
        sourceSystem: "Google Drive — /440 Clove Road/Evidence",
        status: "pending_review",
        sha256: "22bb...cc33",
        pageCount: 6,
        fileUrl: "/sample-pdfs/photo-log.pdf",
        ocrText:
          "Photo log compiled by C. Doyle, time-stamped 02/14/2026 2:47 PM through 3:10 PM, depicting re-keyed storage closet padlock, removed bicycle, and stacked furniture in the building hallway outside Unit 3R.",
        aiSummary: "Time-stamped photo documentation of the February 14, 2026 lockout and property removal, authored by property manager Chris Doyle.",
        keyConcepts: ["lockout", "photo evidence", "timestamp"],
        isFlagged: true,
        flagReason: "Potential key evidence corroborating or undermining self-help eviction defense — route to human review for authentication.",
        filedDate: "2026-02-14",
      },
      {
        matterId: matterSupreme.id,
        docketId: null,
        title: "Locksmith Invoice #4471 — Re-Key Service",
        fileName: "Invoice_4471_LinCertifiedLocksmith.pdf",
        sourceType: "drive",
        sourceSystem: "Google Drive — /440 Clove Road/Invoices",
        status: "pending_review",
        sha256: "33cc...dd44",
        pageCount: 1,
        fileUrl: "/sample-pdfs/locksmith-invoice.pdf",
        ocrText:
          "Lin Certified Locksmith — Invoice #4471. Billed to: Danny George, 440 Clove Road. Service: re-key storage closet door, Unit 3R common area. Date: 02/14/2026. Amount: $185.00. Authorized by: D. George (signature on file).",
        aiSummary: "Invoice confirming a locksmith re-key at the storage closet on the lockout date, billed to 'Danny George' — likely the same person as Daniel R. George.",
        keyConcepts: ["lockout", "re-key", "billing record"],
        isFlagged: false,
        filedDate: "2026-02-14",
      },
      {
        matterId: matterSupreme.id,
        docketId: null,
        title: "Email Chain — Notice to Cure Discussion",
        fileName: "Emails_NoticeToCure_Jan2026.pdf",
        sourceType: "drive",
        sourceSystem: "Google Drive — /440 Clove Road/Correspondence",
        status: "indexed",
        sha256: "44dd...ee55",
        pageCount: 5,
        fileUrl: "/sample-pdfs/email-chain.pdf",
        ocrText:
          "From: dgeorge@meridianholdingsllc.com To: elena.vasquez@gmail.com Subject: Storage Area — Please Advise... I need you to clear your things from the storage closet by the end of the month or I'll have to change the lock and we can discuss getting your things back...",
        aiSummary: "Pre-litigation email from Daniel George warning Elena Vasquez that he would change the storage closet lock if items were not removed — directly probative of intent/self-help eviction issue.",
        keyConcepts: ["pre-litigation notice", "self-help eviction", "intent"],
        isFlagged: true,
        flagReason: "Email language ('I'll have to change the lock') may support Defendant's self-help eviction defense — flagged for concept mapping against RPAPL 853 claim element.",
        filedDate: "2026-01-25",
      },
      // --- Manual uploads ---
      {
        matterId: matterHousing.id,
        docketId: null,
        title: "Client Intake Memo — Initial Consultation",
        fileName: "Intake_Memo_DanielGeorge.pdf",
        sourceType: "upload",
        sourceSystem: "Manual Upload",
        status: "indexed",
        sha256: "55ee...ff66",
        pageCount: 3,
        fileUrl: "/sample-pdfs/intake-memo.pdf",
        ocrText:
          "Intake memo: Client Daniel George reports tenant Elena Vasquez has not paid a storage fee and has sublet a room to an unknown third party. Client wants to proceed with eviction. Client mentioned he 'already swapped the lock on the closet' prior to retaining counsel...",
        aiSummary: "Internal intake memo reflecting that the lockout occurred before counsel was retained, which is material to the self-help eviction defense timeline.",
        keyConcepts: ["intake", "timeline", "self-help eviction"],
        isFlagged: true,
        flagReason: "Client admission that lock was changed before retaining counsel contradicts proposed litigation narrative — high-priority human review.",
        filedDate: "2026-01-18",
      },
      {
        matterId: matterSupreme.id,
        docketId: null,
        title: "Witness Statement — Chris Doyle (Property Manager)",
        fileName: "WitnessStatement_Doyle.pdf",
        sourceType: "upload",
        sourceSystem: "Manual Upload",
        status: "pending_review",
        sha256: null,
        pageCount: 2,
        fileUrl: "/sample-pdfs/witness-statement-doyle.pdf",
        ocrText: null,
        aiSummary: null,
        keyConcepts: [],
        isFlagged: false,
        filedDate: "2026-03-02",
      },
      {
        matterId: null,
        docketId: null,
        title: "RPAPL 853 Memorandum of Law (Research Draft)",
        fileName: "Memo_RPAPL853_Research.pdf",
        sourceType: "upload",
        sourceSystem: "Manual Upload",
        status: "pending_review",
        sha256: null,
        pageCount: 4,
        fileUrl: "/sample-pdfs/rpapl-853-memo.pdf",
        ocrText: null,
        aiSummary: null,
        keyConcepts: [],
        isFlagged: false,
        filedDate: "2026-03-28",
      },
    ])
    .returning();

  const byTitle = (t: string) => docRows.find((d) => d.title === t)!;

  // ---------------- DOCKET ENTRIES ----------------
  await db.insert(docketEntries).values([
    { docketId: docketSupreme.id, sequenceNumber: 1, filedDate: "2026-02-20", docType: "Summons & Complaint", description: "Summons and Verified Complaint filed.", status: "verified", documentId: byTitle("Summons and Verified Complaint").id },
    { docketId: docketSupreme.id, sequenceNumber: 2, filedDate: "2026-02-23", docType: "Affidavit of Service", description: "Affidavit of service of summons and complaint.", status: "indexed", documentId: byTitle("Affidavit of Service — Summons and Complaint").id },
    { docketId: docketSupreme.id, sequenceNumber: 3, filedDate: "2026-03-10", docType: "Answer", description: "Verified answer with affirmative defenses.", status: "indexed", documentId: byTitle("Verified Answer with Affirmative Defenses").id },
    { docketId: docketSupreme.id, sequenceNumber: 4, filedDate: "2026-03-24", docType: "Motion", description: "Notice of motion to dismiss pursuant to CPLR 3211.", status: "pending_review", documentId: byTitle("Notice of Motion to Dismiss (CPLR 3211)").id },
    { docketId: docketSupreme.id, sequenceNumber: 5, filedDate: "2026-04-05", docType: "Affirmation", description: "Affirmation in opposition to motion to dismiss.", status: "pending_review", documentId: byTitle("Affirmation in Opposition to Motion to Dismiss").id },
    { docketId: docketSupreme.id, sequenceNumber: 6, filedDate: "2026-04-15", docType: "Decision", description: "Oral argument scheduled; decision reserved.", status: "pending_review", documentId: null },
    { docketId: docketHousing.id, sequenceNumber: 1, filedDate: "2026-01-20", docType: "Predicate Notice", description: "Ten-day notice to cure served.", status: "verified", documentId: byTitle("Ten-Day Notice to Cure").id },
    { docketId: docketHousing.id, sequenceNumber: 2, filedDate: "2026-02-02", docType: "Petition", description: "Notice of petition and petition (holdover) filed.", status: "verified", documentId: byTitle("Notice of Petition and Petition (Holdover)").id },
    { docketId: docketHousing.id, sequenceNumber: 3, filedDate: "2026-02-18", docType: "Answer", description: "Tenant's verified answer filed pro se.", status: "pending_review", documentId: byTitle("Tenant's Verified Answer (Pro Se, later amended)").id },
    { docketId: docketHousing.id, sequenceNumber: 4, filedDate: "2026-04-22", docType: "Hearing", description: "Trial calendar call scheduled.", status: "pending_review", documentId: null },
  ]);

  // ---------------- DOCUMENT TAGS ----------------
  const summons = byTitle("Summons and Verified Complaint");
  const aos = byTitle("Affidavit of Service — Summons and Complaint");
  const answerSupreme = byTitle("Verified Answer with Affirmative Defenses");
  const lease = byTitle("Residential Lease Agreement — Unit 3R");
  const photoLog = byTitle("Property Damage & Lockout Photo Log");
  const invoice = byTitle("Locksmith Invoice #4471 — Re-Key Service");
  const emailChain = byTitle("Email Chain — Notice to Cure Discussion");
  const intakeMemo = byTitle("Client Intake Memo — Initial Consultation");
  const noticeToCure = byTitle("Ten-Day Notice to Cure");
  const holdoverPetition = byTitle("Notice of Petition and Petition (Holdover)");

  await db.insert(documentTags).values([
    { documentId: summons.id, tagType: "matter", tagValue: "Meridian Holdings LLC v. 440 Clove Road Tenants", matterId: matterSupreme.id },
    { documentId: summons.id, tagType: "party", tagValue: "Daniel R. George", contactId: danielGeorge.id },
    { documentId: summons.id, tagType: "party", tagValue: "Meridian Holdings LLC", contactId: meridianHoldings.id },
    { documentId: summons.id, tagType: "party", tagValue: "Elena M. Vasquez", contactId: elenaVasquez.id },
    { documentId: summons.id, tagType: "concept", tagValue: "conversion" },
    { documentId: summons.id, tagType: "concept", tagValue: "RPAPL 853" },

    { documentId: aos.id, tagType: "matter", tagValue: "Meridian Holdings LLC v. 440 Clove Road Tenants", matterId: matterSupreme.id },
    { documentId: aos.id, tagType: "party", tagValue: "Elena M. Vasquez", contactId: elenaVasquez.id },
    { documentId: aos.id, tagType: "concept", tagValue: "service of process" },

    { documentId: answerSupreme.id, tagType: "matter", tagValue: "Meridian Holdings LLC v. 440 Clove Road Tenants", matterId: matterSupreme.id },
    { documentId: answerSupreme.id, tagType: "party", tagValue: "Elena M. Vasquez", contactId: elenaVasquez.id },
    { documentId: answerSupreme.id, tagType: "party", tagValue: "Priya Nair, Esq.", contactId: priyaNair.id },
    { documentId: answerSupreme.id, tagType: "concept", tagValue: "self-help eviction" },

    { documentId: lease.id, tagType: "matter", tagValue: "Meridian Holdings LLC v. 440 Clove Road Tenants", matterId: matterSupreme.id },
    { documentId: lease.id, tagType: "party", tagValue: "Elena M. Vasquez", contactId: elenaVasquez.id },
    { documentId: lease.id, tagType: "party", tagValue: "Meridian Holdings LLC", contactId: meridianHoldings.id },
    { documentId: lease.id, tagType: "concept", tagValue: "lease terms" },

    { documentId: photoLog.id, tagType: "matter", tagValue: "Meridian Holdings LLC v. 440 Clove Road Tenants", matterId: matterSupreme.id },
    { documentId: photoLog.id, tagType: "party", tagValue: "Chris Doyle", contactId: chrisDoyle.id },
    { documentId: photoLog.id, tagType: "concept", tagValue: "lockout" },

    { documentId: invoice.id, tagType: "matter", tagValue: "Meridian Holdings LLC v. 440 Clove Road Tenants", matterId: matterSupreme.id },
    { documentId: invoice.id, tagType: "party", tagValue: "Danny George", contactId: dannyGeorgeDupe.id },
    { documentId: invoice.id, tagType: "party", tagValue: "Sandra Lin", contactId: sandraLin.id },

    { documentId: emailChain.id, tagType: "matter", tagValue: "Meridian Holdings LLC v. 440 Clove Road Tenants", matterId: matterSupreme.id },
    { documentId: emailChain.id, tagType: "party", tagValue: "Daniel R. George", contactId: danielGeorge.id },
    { documentId: emailChain.id, tagType: "party", tagValue: "Elena M. Vasquez", contactId: elenaVasquez.id },
    { documentId: emailChain.id, tagType: "concept", tagValue: "self-help eviction" },

    { documentId: intakeMemo.id, tagType: "matter", tagValue: "George v. Vasquez — Holdover Proceeding", matterId: matterHousing.id },
    { documentId: intakeMemo.id, tagType: "party", tagValue: "Daniel R. George", contactId: danielGeorge.id },
    { documentId: intakeMemo.id, tagType: "concept", tagValue: "timeline" },

    { documentId: noticeToCure.id, tagType: "matter", tagValue: "George v. Vasquez — Holdover Proceeding", matterId: matterHousing.id },
    { documentId: noticeToCure.id, tagType: "party", tagValue: "Elena M. Vasquez", contactId: elenaVasquez.id },
    { documentId: noticeToCure.id, tagType: "concept", tagValue: "predicate notice" },

    { documentId: holdoverPetition.id, tagType: "matter", tagValue: "George v. Vasquez — Holdover Proceeding", matterId: matterHousing.id },
    { documentId: holdoverPetition.id, tagType: "party", tagValue: "Meridian Holdings LLC", contactId: meridianHoldings.id },
    { documentId: holdoverPetition.id, tagType: "party", tagValue: "Elena M. Vasquez", contactId: elenaVasquez.id },
  ]);

  // ---------------- AI PROPOSALS ----------------
  await db.insert(aiProposals).values([
    {
      documentId: summons.id,
      type: "review_flag",
      severity: "high",
      title: "Dual capacity pleading detected",
      description: "Daniel R. George is named individually and as Managing Member of Meridian Holdings LLC in the same complaint. Confirm Converge capacity records are split correctly before mapping facts to claim elements.",
      payload: { contactId: danielGeorge.id },
      status: "proposed",
    },
    {
      documentId: aos.id,
      type: "review_flag",
      severity: "high",
      title: "Service recipient name collision",
      description: "Affidavit of service states the complaint was accepted by 'D. George' — the plaintiff's own alias — rather than the defendant. Likely a scrivener error; recommend flagging for attorney review before relying on this affidavit.",
      payload: {},
      status: "proposed",
    },
    {
      documentId: photoLog.id,
      type: "concept_map",
      severity: "medium",
      title: "Map lockout photo timestamps to chronology",
      description: "Photo log timestamps (2:47–3:10 PM on 2/14/2026) align closely with the locksmith invoice time window. Suggest linking both into the chronology as corroborating evidence of the lockout event.",
      payload: { eventTitle: "Storage closet re-keyed / lockout occurs" },
      status: "proposed",
    },
    {
      documentId: invoice.id,
      type: "alias_merge",
      severity: "medium",
      title: "Merge 'Danny George' into Daniel R. George",
      description: "OCR-extracted signatory 'Danny George' on locksmith invoice #4471 shares phone/address metadata and signature pattern with canonical contact Daniel R. George (confidence 0.74). Recommend merging aliases.",
      payload: { duplicateContactId: dannyGeorgeDupe.id, canonicalContactId: danielGeorge.id, confidence: 0.74 },
      status: "proposed",
    },
    {
      documentId: emailChain.id,
      type: "review_flag",
      severity: "high",
      title: "Pre-litigation admission undercuts pleading",
      description: "January 25, 2026 email from Daniel George threatens to change the lock, and the client intake memo confirms the lock was changed before counsel was retained. This may support Defendant's self-help eviction affirmative defense and should be weighed before further motion practice.",
      payload: { relatedDocumentId: intakeMemo.id },
      status: "proposed",
    },
    {
      documentId: intakeMemo.id,
      type: "summary",
      severity: "low",
      title: "Confirm AI summary of intake memo",
      description: "Proposed summary: 'Client admits lock was changed before retaining counsel, which is material to the self-help eviction timeline.' Accept to publish to the document record.",
      payload: {},
      status: "proposed",
    },
    {
      documentId: byTitle("Notice of Motion to Dismiss (CPLR 3211)").id,
      type: "entity_suggestion",
      severity: "low",
      title: "Tag Priya Nair, Esq. as filer",
      description: "OCR detected signature block for Priya Nair, Esq. on the motion to dismiss affirmation. Suggest tagging as party/attorney.",
      payload: { contactId: priyaNair.id },
      status: "accepted",
    },
    {
      documentId: null,
      contactId: dannyGeorgeDupe.id,
      type: "duplicate",
      severity: "medium",
      title: "Possible duplicate contact record",
      description: "'Danny George' and 'Daniel R. George' may represent the same individual across two matters. Review relationship graph before merging.",
      payload: {},
      status: "proposed",
    },
  ]);

  // ---------------- CHRONOLOGY ----------------
  const [evLease, evEmailWarning, evIntake, evNoticeToCure, evLockout, evPetitionFiled, evComplaintFiled, evAnswer, evMotion] =
    await db
      .insert(chronologyEvents)
      .values([
        { matterId: matterSupreme.id, eventDate: "2019-06-01", precision: "exact", title: "Lease executed", description: "Elena Vasquez signs residential lease for Unit 3R.", documentId: lease.id, pageCite: "p.1" },
        { matterId: matterSupreme.id, eventDate: "2026-01-25", precision: "exact", title: "Daniel George warns he will change the lock", description: "Email to Vasquez threatening to change storage closet lock if items are not removed.", documentId: emailChain.id, pageCite: "p.1" },
        { matterId: matterSupreme.id, eventDate: "2026-01-18", precision: "approx", title: "Client intake — lock already changed", description: "Intake memo reflects lock had already been swapped prior to retaining counsel.", documentId: intakeMemo.id, pageCite: "p.2" },
        { matterId: matterHousing.id, eventDate: "2026-01-20", precision: "exact", title: "Ten-day notice to cure served", description: "Predicate notice alleging subletting and common-area storage violations.", documentId: noticeToCure.id, pageCite: "p.1" },
        { matterId: matterSupreme.id, eventDate: "2026-02-14", precision: "exact", title: "Storage closet re-keyed / lockout occurs", description: "Locksmith re-keys storage closet; photo log documents removed items.", documentId: invoice.id, pageCite: "p.1" },
        { matterId: matterHousing.id, eventDate: "2026-02-02", precision: "exact", title: "Holdover petition filed", description: "Meridian Holdings LLC files notice of petition and petition.", documentId: holdoverPetition.id, pageCite: "p.1" },
        { matterId: matterSupreme.id, eventDate: "2026-02-20", precision: "exact", title: "Summons and complaint filed", description: "Plaintiffs file conversion / RPAPL 853 complaint.", documentId: summons.id, pageCite: "p.1" },
        { matterId: matterSupreme.id, eventDate: "2026-03-10", precision: "exact", title: "Verified answer served", description: "Vasquez answers, raises self-help eviction affirmative defense.", documentId: answerSupreme.id, pageCite: "p.3" },
        { matterId: matterSupreme.id, eventDate: "2026-03-24", precision: "exact", title: "Motion to dismiss filed", description: "Defendant moves to dismiss conversion claim under CPLR 3211(a)(7).", documentId: byTitle("Notice of Motion to Dismiss (CPLR 3211)").id, pageCite: "p.1" },
      ])
      .returning();

  // ---------------- CLAIMS MATRIX ----------------
  const [claimConversion, claimRpapl853] = await db
    .insert(claims)
    .values([
      { matterId: matterSupreme.id, title: "Conversion", statute: "New York common law", description: "Unauthorized exercise of dominion over Defendant's personal property inconsistent with her rights." },
      { matterId: matterSupreme.id, title: "Illegal Lockout / Self-Help Eviction", statute: "RPAPL § 853", description: "Statutory treble damages claim for forcible or unlawful entry and detainer — asserted here as an affirmative defense / counterclaim theory." },
    ])
    .returning();

  const [elConvOwnership, elConvDominion, elConvDamages, elRpaplPossession, elRpaplForce, elRpaplDamages] =
    await db
      .insert(claimElements)
      .values([
        { claimId: claimConversion.id, title: "Plaintiff's superior right to property", description: "Meridian Holdings LLC must show it, not Vasquez, held rights to the storage area contents." },
        { claimId: claimConversion.id, title: "Unauthorized exercise of dominion", description: "Defendant exercised control over property inconsistent with Plaintiff's rights." },
        { claimId: claimConversion.id, title: "Damages", description: "Value of property converted." },
        { claimId: claimRpapl853.id, title: "Respondent was in actual possession", description: "Vasquez was lawfully in possession of the storage area/unit at the time of the lockout." },
        { claimId: claimRpapl853.id, title: "Petitioner used force, unlawful means, or re-entry without judicial process", description: "Re-keying the lock without a warrant of eviction." },
        { claimId: claimRpapl853.id, title: "Treble damages", description: "Statutory treble damages for the unlawful eviction." },
      ])
      .returning();

  await db.insert(factLinks).values([
    { claimElementId: elConvOwnership.id, chronologyEventId: evLease.id, documentId: lease.id, polarity: "context", notes: "Lease Section 18 restricts common storage to Landlord absent written agreement." },
    { claimElementId: elConvDominion.id, chronologyEventId: evLockout.id, documentId: invoice.id, polarity: "supporting", notes: "Invoice documents re-key of storage closet on 2/14/2026." },
    { claimElementId: elConvDominion.id, chronologyEventId: evLockout.id, documentId: photoLog.id, polarity: "supporting", notes: "Photo log corroborates timing and removed items." },
    { claimElementId: elConvDamages.id, documentId: photoLog.id, polarity: "supporting", notes: "Photos document the specific items removed (bicycle, tools, furniture)." },
    { claimElementId: elRpaplPossession.id, chronologyEventId: evLease.id, documentId: lease.id, polarity: "supporting", notes: "Lease confirms Vasquez's tenancy and possession rights." },
    { claimElementId: elRpaplForce.id, chronologyEventId: evEmailWarning.id, documentId: emailChain.id, polarity: "adverse", notes: "Email shows pre-meditated intent to self-help evict rather than seek judicial process." },
    { claimElementId: elRpaplForce.id, chronologyEventId: evIntake.id, documentId: intakeMemo.id, polarity: "adverse", notes: "Intake memo confirms lock changed before any court order." },
    { claimElementId: elRpaplDamages.id, documentId: photoLog.id, polarity: "context", notes: "Supports valuation of removed personal property for treble damages calculation." },
  ]);

  // ---------------- DEADLINES ----------------
  await db.insert(deadlines).values([
    { matterId: matterSupreme.id, title: "Oral argument — motion to dismiss", dueDate: "2026-04-15", type: "court_appearance", status: "upcoming", notes: "Part 12, 9:30 a.m." },
    { matterId: matterSupreme.id, title: "Deadline to oppose motion to dismiss", dueDate: "2026-04-05", type: "motion_response", status: "completed", notes: "Affirmation in opposition filed timely." },
    { matterId: matterSupreme.id, title: "RPAPL 853 statute of limitations (1-year analogy)", dueDate: "2027-02-14", type: "statute_of_limitations", status: "upcoming", notes: "Tracks one year from the 2/14/2026 lockout." },
    { matterId: matterHousing.id, title: "Trial calendar call", dueDate: "2026-04-22", type: "court_appearance", status: "upcoming", notes: "Housing Part, Room 410." },
    { matterId: matterHousing.id, title: "Discovery responses due", dueDate: "2026-04-01", type: "discovery", status: "missed", notes: "Respondent's discovery demands outstanding." },
    { matterId: matterSupreme.id, title: "Expert disclosure deadline", dueDate: "2026-05-30", type: "discovery", status: "upcoming", notes: "Property valuation expert." },
  ]);

  // ---------------- TASKS ----------------
  await db.insert(tasks).values([
    { matterId: matterSupreme.id, title: "Reconcile 'D. George' name in affidavit of service with process server", status: "open", dueDate: "2026-04-10", linkedDocumentId: aos.id },
    { matterId: matterSupreme.id, title: "Confirm alias merge: Danny George → Daniel R. George", status: "in_progress", dueDate: "2026-04-08", linkedDocumentId: invoice.id },
    { matterId: matterSupreme.id, title: "Prepare rebuttal re: pre-litigation lockout email", status: "open", dueDate: "2026-04-12", linkedDocumentId: emailChain.id },
    { matterId: matterHousing.id, title: "Serve outstanding discovery demands", status: "open", dueDate: "2026-04-05", linkedDocumentId: null },
    { matterId: matterSupreme.id, title: "OCR + review witness statement from Chris Doyle", status: "open", dueDate: "2026-04-09", linkedDocumentId: byTitle("Witness Statement — Chris Doyle (Property Manager)").id },
    { matterId: null, title: "Finish RPAPL 853 treble damages research memo", status: "in_progress", dueDate: "2026-04-18", linkedDocumentId: byTitle("RPAPL 853 Memorandum of Law (Research Draft)").id },
    { matterId: matterSupreme.id, title: "Confirm Google Drive sync picked up new exhibits folder", status: "done", dueDate: "2026-03-30", linkedDocumentId: null },
  ]);

  // ---------------- ACTIVITY LOG ----------------
  await db.insert(activityLog).values([
    { message: "NYSCEF Desktop Runner pushed 2 new filings for Index No. 153243/2026.", category: "ingest" },
    { message: "Google Drive sync found 1 new file in /440 Clove Road/Evidence.", category: "ingest" },
    { message: "AI flagged 'Affidavit of Service' for a service recipient name collision.", category: "ai" },
    { message: "AI proposed merging 'Danny George' into canonical contact Daniel R. George.", category: "ai" },
    { message: "Fact link added: pre-litigation email mapped to RPAPL 853 claim element (adverse).", category: "claims" },
    { message: "Document 'Motion to Dismiss' entity suggestion accepted: Priya Nair, Esq. tagged as filer.", category: "review" },
    { message: "Deadline added: RPAPL 853 statute of limitations clock (1-year analogy) — due 2027-02-14.", category: "deadlines" },
  ]);

  console.log("Seed complete:");
  console.log(`  matters: 2, contacts: ${13}, documents: ${docRows.length}`);
}

main()
  .then(async () => {
    await pool.end();
    console.log("Done.");
    process.exit(0);
  })
  .catch(async (err) => {
    console.error(err);
    await pool.end();
    process.exit(1);
  });
