# PACER & NextGen CM/ECF Connector: Session Handoff & Architecture Guide

## 1. Executive Summary & Goals
This project implements a production-ready connector for the Federal Courts PACER system (Authentication API v2.0 & Case Locator PCL REST API) and Court NextGen CM/ECF systems (`ecf.{court}.uscourts.gov`).

**Target Case Executed & Verified**:
- **Court**: U.S. Bankruptcy Court for the Eastern District of New York (`nyeb`)
- **Case Number**: `1:26-bk-44227-jmm` (Internal PACER Case ID: `542916`)
- **Debtor**: Ian Simpson Reisner (Chapter 11 Voluntary Petition)
- **Judge**: Hon. Jil M. Mazer-Marino
- **Debtor Counsel**: Salvatore LaMonica (*LaMonica Herbst & Maniscalco, LLP*)
- **Permanent Property Guardian**: Andre K. Cizmarik (*Mintz Levin*)
- **Local Documents Directory**: `/Users/dangeorge/Downloads/IR Bankruptcy (1-26-44227-jmm-2)` (41 PDFs)

---

## 2. File Manifest in this Archive

| File / Path | Description |
| :--- | :--- |
| `HANDOFF.md` | This document: Comprehensive architecture, security rules, and state guide. |
| `pacer_connector.py` | Complete Python connector module supporting QA, Prod, and Mock modes. |
| `test_pacer_connector.py` | Full test suite (5 unit tests covering token rotation, parsing, QA API). |
| `edny_1_26_44227_reisner_docket.json` | Extracted 31 docket entries with 42 sub-documents/exhibits, `filed_by` column, and linked local PDFs. |
| `edny_1_26_44227_reisner_deadlines.json` | 14 extracted court deadlines & scheduled hearings from `SchedQry.pl`. |
| `nyeb_542916_exhibits_report.html` | Raw HTML dump of the live CM/ECF `DktRpt.pl` with all exhibits expanded. |
| `auth_api.txt` & `pcl_api.txt` | Cleaned reference specs for PACER Authentication API v2.0 & PCL REST API. |

---

## 3. Core Architecture & Endpoints

### 3.1 Authentication & Token Rotation (`Authentication API v2.0`)
- **Prod URL**: `https://pacer.login.uscourts.gov/services/cso-auth`
- **QA URL**: `https://qa-login.uscourts.gov/services/cso-auth`
- **Mechanism**:
  - Request: POST JSON `{"loginId": "...", "password": "...", "clientCode": "..."}`.
  - Response: CSO 128-byte session token (`nextGenCSO` cookie).
  - 2FA/TOTP: Fully supported via `otp_code` or `otp_secret` using `pyotp`.
  - Token is automatically attached to session cookies (`nextGenCSO` and `PCL_SESSION`).

### 3.2 Nationwide Case Discovery (`PACER Case Locator - PCL REST API`)
- **Prod Endpoint**: `https://pcl.uscourts.gov/pcl-public-api/rest/cases/find`
- **QA Endpoint**: `https://qa-pcl.uscourts.gov/pcl-public-api/rest/cases/find`
- **Payload**: JSON querying `courtId`, `caseNumber`, `caseTitle`, etc.
- **Cost**: $0.10 per search page (waived under the $30/quarter rule).

### 3.3 Court NextGen CM/ECF Retrieval (`ecf.{court}.uscourts.gov`)
NextGen courts require passing the `nextGenCSO` cookie to internal CGI Perl scripts:
- **Docket Sheet**: `/cgi-bin/DktRpt.pl`
  - Parameters used: `case_id=542916`, `view_multi_docs=on`, `view_all_attachments=on`, `sort1=oldest_first`.
  - Automatically parses docket text, filing date, entry numbers, exhibits, page counts, and filers.
- **Deadlines & Hearings**: `/cgi-bin/SchedQry.pl`
  - Parameters: `caseid=542916`, `schedule_type=all`.
  - Returns structured hearings, § 341 creditor meeting dates, plan due dates, and discharge objection deadlines.
- **Associated Cases / Adversary Proceedings**: `/cgi-bin/qryAscCases.pl`
  - Returns linked lawsuits, joint cases, or confirmed "There Are No Case Associations".
- **Free Metadata Feeds (Zero-Cost Sentinel)**: `/cgi-bin/rss_outside.pl`
  - Unauthenticated public RSS feed streaming the latest filings across the district.

---

## 4. Key Findings & Insights for This Case

### 4.1 "Filed By" Attribution
The parser extracts the specific filing party or court actor for every entry using regex rules:
- `Filed by [Name] on behalf of [Client]` -> formats as `Filer Name (for Client Name)`.
- Orders, scheduling directs -> `Court / Judge (Hon. Jil M. Mazer-Marino)`.
- BNC Certificates of Notice -> `Bankruptcy Noticing Center (BNC)`.
- Clerk / Treasury / Admin entries -> mapped to respective court entities.

### 4.2 Adversary Proceedings Check
- Checked `qryAscCases.pl` for Case `542916`.
- **Result**: Confirmed **no adversary proceedings or associated case filings** exist on file to date.

### 4.3 Deadlines & Hearings Schedule Summary
From [`edny_1_26_44227_reisner_deadlines.json`](./edny_1_26_44227_reisner_deadlines.json):
- **341 Meeting of Creditors**: Adjourned to `10/19/2026 at 10:00 AM`.
- **Status Hearing**: `11/04/2026 at 10:00 AM` before Judge Mazer-Marino.
- **General Claims Bar Date**: `12/03/2026`.
- **Deadline to Object to Discharge**: `12/04/2026`.
- **Chapter 11 Plan & Disclosure Statement Due**: `01/06/2027`.
- **Governmental Claims Bar Date**: `03/08/2027`.

### 4.4 Local PDF Reconciliation Engine
Local folder `/Users/dangeorge/Downloads/IR Bankruptcy (1-26-44227-jmm-2)` contains 41 PDFs.
**Discovery**: 100% (41 of 41) of downloaded PACER PDFs contain the official federal judiciary CM/ECF header stamp digitally printed across the top of Page 1:
```
Case 1-26-44227-jmm    Doc 15-1    Filed 09/24/26    Entered 09/24/26
```
The implemented reconciliation engine uses a **4-tier strategy**:
1. **Tier 1 (Page-1 Header Stamp)**: Uses `pypdf` to extract `Case ... Doc (\d+)(?:-(\d+))?`. Matches with 100% confidence even if files were renamed to arbitrary names (e.g. `Scan_001.pdf`).
2. **Tier 2 (Filename Pattern)**: Matches `(\d+)(?:-(\d+))?\.pdf`.
3. **Tier 3 (Page Count & Title Alignment)**: Matches attachment page lengths from `view_all_attachments="on"`.
4. **Tier 4 (SHA-256 Hash Caching)**: Caches hashes locally to eliminate redundant disk scans.

---

## 5. Security & Billing Guardrails

> [!IMPORTANT]
> **Keychain Storage Rule (`BUILD_SPEC.md §4.3`)**:
> PACER credentials must NEVER be committed to Git or stored in database tables.
> They are stored in the macOS Keychain under service `pacer` (`keyring.set_password("pacer", "dgeorgemsp", ...)`).
> The connector loads credentials dynamically via `load_credentials_from_keychain()`.

> [!NOTE]
> **Fee Avoidance & The $30/Quarter Rule**:
> PACER waives all charges if total usage across a calendar quarter is $\le \$30.00$.
> All calls made in this session totaled under $\$1.50$, resulting in an effective cost of **\$0.00**.
> Use the free court RSS feed (`rss_outside.pl`) as a zero-cost sentinel daemon for real-time monitoring to prevent recurring polling charges.

---

## 6. How Another Agent Can Resume Work

```bash
# 1. Run unit test suite
python3 -m unittest scraper.test_pacer_connector

# 2. Test live PACER connector with local PDF reconciliation
python3 -c "
from scraper.pacer_connector import PacerConnector
c = PacerConnector(environment='prod')
# Load credentials from Keychain
creds = c.load_credentials_from_keychain('dgeorgemsp')
c.authenticate(creds)
# Retrieve docket with exhibits and reconcile local files
report = c.get_case_docket('nyeb', '542916', '1:26-bk-44227-jmm', view_all_attachments=True)
matched = c.link_local_documents(report, '/Users/dangeorge/Downloads/IR Bankruptcy (1-26-44227-jmm-2)')
print(f'Retrieved {len(report.docket_items)} docket items; matched {matched} local document groups.')
"
```
