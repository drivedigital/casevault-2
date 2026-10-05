import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { Pool } from "pg";
import { PDFDocument } from "pdf-lib";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

function sanitizeFilename(text) {
  return text.replace(/[\r\n\t]+/g, " ").replace(/[^\w\s-]/g, "").replace(/\s+/g, "_").trim().slice(0, 60);
}

function parseUsDate(str) {
  if (!str) return null;
  const m = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return null;
  const month = m[1].padStart(2, "0");
  const day = m[2].padStart(2, "0");
  return `${m[3]}-${month}-${day}`;
}

async function ingestNyscef(client) {
  console.log("\n=== 1. Ingesting NYSCEF Case 450551/2025 ===");
  const nyscefJsonPath = "bridges/nyscef_browser/nyscef_450551_2025_results.json";
  const downloadsDir = "bridges/nyscef_browser/downloads/450551_2025";

  if (!fs.existsSync(nyscefJsonPath)) {
    throw new Error(`NYSCEF JSON manifest missing at ${nyscefJsonPath}`);
  }

  const raw = JSON.parse(fs.readFileSync(nyscefJsonPath, "utf8"));
  const entries = raw.entries || [];
  console.log(`Loaded ${entries.length} NYSCEF docket entries.`);

  // 1. Upsert Matter
  const matterRes = await client.query(`
    INSERT INTO "casevault2"."matters" (name, case_number, court, status, description, external_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (external_id) DO UPDATE SET name = EXCLUDED.name
    RETURNING id;
  `, [
    "The City of New York v. 512 West 42nd Street Owner LLC et al",
    "450551/2025",
    "Supreme Court of the State of New York, County of New York",
    "active",
    "NYSCEF enforcement and commercial tenancy litigation concerning short-term rentals and building operations.",
    "matter-nyscef-450551-2025"
  ]);
  const matterId = matterRes.rows[0].id;
  console.log(`Matter ID: ${matterId}`);

  // 2. Upsert Docket
  const docketRes = await client.query(`
    INSERT INTO "casevault2"."dockets" (matter_id, index_number, court, caption, source_url, external_id, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (external_id) DO UPDATE SET caption = EXCLUDED.caption, source_url = EXCLUDED.source_url
    RETURNING id;
  `, [
    matterId,
    "450551/2025",
    "New York County Supreme Court",
    "The City of New York v. 512 West 42nd Street Owner LLC et al",
    raw.source_url,
    "docket-nyscef-450551-2025",
    "active"
  ]);
  const docketId = docketRes.rows[0].id;
  console.log(`Docket ID: ${docketId}`);

  // 3. Process each document and entry
  let docsIngested = 0;
  let entriesIngested = 0;

  for (const entry of entries) {
    const rawDocNum = entry.doc_number || "1";
    const docNumInt = parseInt(rawDocNum, 10) || 1;
    const docNumPadded = String(docNumInt).padStart(3, "0");
    const rawTitle = (entry.description || "Court Document").replace(/\r\n|\r|\n/g, " ").replace(/\s+/g, " ").trim();
    const docType = rawTitle.slice(0, 256) || "Court Filing";
    const filerInfo = (entry.doc_type || "").replace(/\r\n|\r|\n/g, " ").replace(/\s+/g, " ").trim();
    const fullDesc = filerInfo ? `${rawTitle} — ${filerInfo}` : rawTitle;

    // Parse date from raw_columns[2] or filed_date
    const col2 = entry.raw_columns?.[2] || "";
    const dateMatch = col2.match(/Filed:\s*(\d{2})\/(\d{2})\/(\d{4})/) || entry.filed_date?.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    const filedDate = dateMatch ? `${dateMatch[3]}-${dateMatch[1]}-${dateMatch[2]}` : "2025-01-27";

    // Check if downloaded PDF exists
    let pdfFilename = null;
    let fileHash = null;
    let pageCount = 1;
    let fileSize = 0;

    // Search downloads directory for matching doc number
    if (fs.existsSync(downloadsDir)) {
      const files = fs.readdirSync(downloadsDir);
      const matchFile = files.find(f => f.startsWith(`450551_2025_doc_${docNumPadded}_`) && f.endsWith(".pdf"));
      if (matchFile) {
        pdfFilename = matchFile;
        const filePath = path.join(downloadsDir, matchFile);
        const buf = fs.readFileSync(filePath);
        fileSize = buf.length;
        fileHash = crypto.createHash("sha256").update(buf).digest("hex");
        try {
          const pdfDoc = await PDFDocument.load(buf, { ignoreEncryption: true });
          pageCount = pdfDoc.getPageCount();
        } catch {
          pageCount = 1;
        }
      }
    }

    let documentId = null;
    if (pdfFilename && fileHash) {
      const docRes = await client.query(`
        INSERT INTO "casevault2"."documents" (
          matter_id, docket_id, title, file_name, source_type, source_system,
          status, sha256, object_key, object_bucket, page_count, filed_date, external_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (external_id) DO UPDATE SET
          title = EXCLUDED.title, sha256 = EXCLUDED.sha256, page_count = EXCLUDED.page_count
        RETURNING id;
      `, [
        matterId,
        docketId,
        rawTitle.slice(0, 200),
        pdfFilename,
        "docket_filing",
        "nyscef",
        "indexed",
        fileHash,
        `casevault-2/originals/${fileHash}`,
        "legal-evidence-arena",
        pageCount,
        filedDate,
        `doc-nyscef-450551-2025-${docNumPadded}`
      ]);
      documentId = docRes.rows[0].id;
      docsIngested++;
    }

    // Insert docket entry
    await client.query(`
      INSERT INTO "casevault2"."docket_entries" (
        docket_id, sequence_number, external_id, availability,
        source_status, source_url, filed_date, doc_type, description, status, document_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (external_id) DO UPDATE SET
        doc_type = EXCLUDED.doc_type, description = EXCLUDED.description, document_id = EXCLUDED.document_id;
    `, [
      docketId,
      docNumInt,
      `entry-nyscef-450551-2025-${docNumPadded}`,
      entry.pdf_url ? "public_pdf" : "metadata_only",
      entry.raw_columns?.[3] || "Processed",
      entry.pdf_url || raw.source_url,
      filedDate,
      docType,
      fullDesc,
      "indexed",
      documentId
    ]);
    entriesIngested++;
  }

  console.log(`[+] NYSCEF: Ingested ${entriesIngested} docket entries and ${docsIngested} linked PDF documents.`);
}

async function ingestPacer(client) {
  console.log("\n=== 2. Ingesting PACER Bankruptcy Case 1:26-bk-44227-jmm ===");
  const pacerDocketPath = "bridges/pacer/edny_1_26_44227_reisner_docket.json";
  const pacerDeadlinesPath = "bridges/pacer/edny_1_26_44227_reisner_deadlines.json";
  const pacerPdfsDir = "/Users/dangeorge/Downloads/IR Bankruptcy (1-26-44227-jmm-2)";

  if (!fs.existsSync(pacerDocketPath)) {
    console.log("[-] PACER docket JSON not found, skipping.");
    return;
  }

  const raw = JSON.parse(fs.readFileSync(pacerDocketPath, "utf8"));
  const items = raw.docket_items || [];
  console.log(`Loaded ${items.length} PACER docket items.`);

  // 1. Upsert Matter
  const matterRes = await client.query(`
    INSERT INTO "casevault2"."matters" (name, case_number, court, status, description, external_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (external_id) DO UPDATE SET name = EXCLUDED.name
    RETURNING id;
  `, [
    "In re Ian Simpson Reisner",
    "1:26-bk-44227-jmm",
    "U.S. Bankruptcy Court for the Eastern District of New York (nyeb)",
    "active",
    "Chapter 11 Voluntary Petition for Individuals before Hon. Jil M. Mazer-Marino.",
    "matter-pacer-1-26-bk-44227-jmm"
  ]);
  const matterId = matterRes.rows[0].id;

  // 2. Upsert Docket
  const docketRes = await client.query(`
    INSERT INTO "casevault2"."dockets" (matter_id, index_number, court, caption, source_url, external_id, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (external_id) DO UPDATE SET caption = EXCLUDED.caption
    RETURNING id;
  `, [
    matterId,
    "1:26-bk-44227-jmm",
    "U.S. Bankruptcy Court EDNY",
    "In re Ian Simpson Reisner (Debtor)",
    "https://ecf.nyeb.uscourts.gov/cgi-bin/DktRpt.pl?542916",
    "docket-pacer-1-26-bk-44227-jmm",
    "active"
  ]);
  const docketId = docketRes.rows[0].id;

  // 3. Process entries and link local PDFs
  let docsIngested = 0;
  let entriesIngested = 0;

  for (const item of items) {
    const entryNum = item.entry_number;
    const filedDate = parseUsDate(item.date_filed) || "2026-09-08";
    const desc = item.description || "Bankruptcy Docket Entry";
    const docType = (item.filed_by || "Court Notice").slice(0, 256);

    // Look for matching local PDF in downloads
    let documentId = null;
    if (fs.existsSync(pacerPdfsDir)) {
      const targetPdfName = `${entryNum}.pdf`;
      const targetPath = path.join(pacerPdfsDir, targetPdfName);
      if (fs.existsSync(targetPath)) {
        const buf = fs.readFileSync(targetPath);
        const hash = crypto.createHash("sha256").update(buf).digest("hex");
        let pageCount = 1;
        try {
          const pdfDoc = await PDFDocument.load(buf, { ignoreEncryption: true });
          pageCount = pdfDoc.getPageCount();
        } catch {
          pageCount = 1;
        }

        const docRes = await client.query(`
          INSERT INTO "casevault2"."documents" (
            matter_id, docket_id, title, file_name, source_type, source_system,
            status, sha256, object_key, object_bucket, page_count, filed_date, external_id
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (external_id) DO UPDATE SET
            title = EXCLUDED.title, sha256 = EXCLUDED.sha256, page_count = EXCLUDED.page_count
          RETURNING id;
        `, [
          matterId,
          docketId,
          desc.slice(0, 200),
          targetPdfName,
          "docket_filing",
          "pacer",
          "indexed",
          hash,
          `casevault-2/originals/${hash}`,
          "legal-evidence-arena",
          pageCount,
          filedDate,
          `doc-pacer-542916-${entryNum}`
        ]);
        documentId = docRes.rows[0].id;
        docsIngested++;
      }
    }

    await client.query(`
      INSERT INTO "casevault2"."docket_entries" (
        docket_id, sequence_number, external_id, availability,
        source_status, source_url, filed_date, doc_type, description, status, document_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (external_id) DO UPDATE SET
        doc_type = EXCLUDED.doc_type, description = EXCLUDED.description, document_id = EXCLUDED.document_id;
    `, [
      docketId,
      entryNum,
      `entry-pacer-542916-${entryNum}`,
      documentId ? "public_pdf" : "metadata_only",
      item.filed_by || "PACER CM/ECF",
      "https://ecf.nyeb.uscourts.gov/cgi-bin/DktRpt.pl?542916",
      filedDate,
      docType,
      desc,
      "indexed",
      documentId
    ]);
    entriesIngested++;
  }

  // 4. Ingest Deadlines
  let deadlinesIngested = 0;
  if (fs.existsSync(pacerDeadlinesPath)) {
    const deadlines = JSON.parse(fs.readFileSync(pacerDeadlinesPath, "utf8"));
    for (const dl of deadlines) {
      const dueDate = parseUsDate(dl.due_set);
      if (dueDate) {
        await client.query(`
          INSERT INTO "casevault2"."deadlines" (matter_id, title, due_date, type, status, notes)
          VALUES ($1, $2, $3, $4, $5, $6);
        `, [
          matterId,
          dl.deadline_hearing,
          dueDate,
          "hearing",
          "upcoming",
          `Doc #${dl.doc_number} - Event Filed: ${dl.event_filed || "N/A"}`
        ]);
        deadlinesIngested++;
      }
    }
  }

  console.log(`[+] PACER: Ingested ${entriesIngested} entries, ${docsIngested} linked local PDFs, and ${deadlinesIngested} deadlines.`);
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN;");
    await ingestNyscef(client);
    await ingestPacer(client);
    await client.query("COMMIT;");
    console.log("\n[SUCCESS] Court dockets ingested and linked into CaseVault-2!");
  } catch (err) {
    await client.query("ROLLBACK;");
    console.error("\n[FAILED] Ingestion error:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
