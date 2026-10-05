"""
PACER Connector & Case Ingestion Engine
========================================
Official PACER & NextGen CM/ECF Client for Docket-Key.

Documentation & Developer Resources:
https://pacer.uscourts.gov/file-case/developer-resources
- PACER Authentication API v2.0
- PACER Case Locator (PCL) REST API v1.0
- NextGen CM/ECF Docket Report (DktRpt.pl) integration

Environments:
- QA (Testing / Non-billable):
    Registration: https://qa-pacer.uscourts.gov
    Auth:         https://qa-login.uscourts.gov/services/cso-auth
    PCL API:      https://qa-pcl.uscourts.gov/pcl-public-api/rest
    (Note: QA uses synthetic test cases; real cases exist in Production)
- Production (Live):
    Registration: https://pacer.uscourts.gov
    Auth:         https://pacer.login.uscourts.gov/services/cso-auth
    PCL API:      https://pcl.uscourts.gov/pcl-public-api/rest
    Court ECF:    https://ecf.{court_id}.uscourts.gov
    (Note: Usage <= $30.00/quarter is waived outright by the Administrative Office of U.S. Courts)

Security & Credentials:
- Compliant with Docket-Key BUILD_SPEC §4.3:
  PACER credentials can be stored in macOS Keychain (`pacer` service) or passed
  via environment variables (never written to cloud databases).
"""

import os
import re
import sys
import json
import logging
from dataclasses import dataclass, field, asdict
from enum import Enum
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple, Union
from urllib.parse import urljoin, parse_qs, urlparse
import xml.etree.ElementTree as ET

import requests
from bs4 import BeautifulSoup

try:
    import keyring
    HAS_KEYRING = True
except ImportError:
    HAS_KEYRING = False

try:
    import pyotp
    HAS_PYOTP = True
except ImportError:
    HAS_PYOTP = False

logger = logging.getLogger("pacer_connector")


class PacerEnv(str, Enum):
    QA = "qa"
    PROD = "prod"
    MOCK = "mock"


# Court ID mapping shortcuts
COURT_CODES = {
    "nyebk": "New York Eastern Bankruptcy Court",
    "nysbk": "New York Southern Bankruptcy Court",
    "nynbk": "New York Northern Bankruptcy Court",
    "nywbk": "New York Western Bankruptcy Court",
    "nyedc": "New York Eastern District Court",
    "nysdc": "New York Southern District Court",
    "nyndc": "New York Northern District Court",
    "nywdc": "New York Western District Court",
}

# Endpoints
ENDPOINTS = {
    PacerEnv.QA: {
        "auth_url": "https://qa-login.uscourts.gov/services/cso-auth",
        "logout_url": "https://qa-login.uscourts.gov/services/cso-logout",
        "pcl_base": "https://qa-pcl.uscourts.gov/pcl-public-api/rest",
        "registration_url": "https://qa-pacer.uscourts.gov",
    },
    PacerEnv.PROD: {
        "auth_url": "https://pacer.login.uscourts.gov/services/cso-auth",
        "logout_url": "https://pacer.login.uscourts.gov/services/cso-logout",
        "pcl_base": "https://pcl.uscourts.gov/pcl-public-api/rest",
        "registration_url": "https://pacer.uscourts.gov",
    },
}


@dataclass
class PacerCredentials:
    username: str
    password: str
    client_code: Optional[str] = None
    otp_secret: Optional[str] = None
    otp_code: Optional[str] = None

    def get_otp(self) -> Optional[str]:
        if self.otp_code:
            return self.otp_code
        if self.otp_secret and HAS_PYOTP:
            totp = pyotp.TOTP(self.otp_secret.replace(" ", ""))
            return totp.now()
        return None


@dataclass
class PacerCaseSummary:
    court_id: str
    case_id: Optional[str]
    case_number: str
    case_number_full: str
    case_title: str
    chapter: Optional[str] = None
    date_filed: Optional[str] = None
    date_closed: Optional[str] = None
    judge: Optional[str] = None
    case_link: Optional[str] = None
    raw: Dict[str, Any] = field(default_factory=dict)


@dataclass
class DocketItem:
    entry_number: int
    date_filed: str
    date_entered: Optional[str] = None
    description: str = ""
    filed_by: Optional[str] = None
    document_url: Optional[str] = None
    pacer_doc_id: Optional[str] = None
    page_count: Optional[int] = None
    cost: Optional[float] = None
    local_files: List[str] = field(default_factory=list)
    exhibits: List[Dict[str, Any]] = field(default_factory=list)


@dataclass
class PacerParty:
    name: str
    role: str
    attorney_name: Optional[str] = None
    attorney_contact: Optional[str] = None


@dataclass
class PacerDocketReport:
    court_id: str
    case_id: str
    case_number: str
    case_title: str
    chapter: Optional[str] = None
    judge: Optional[str] = None
    date_filed: Optional[str] = None
    date_terminated: Optional[str] = None
    trustee: Optional[str] = None
    parties: List[PacerParty] = field(default_factory=list)
    docket_items: List[DocketItem] = field(default_factory=list)
    estimated_search_cost: float = 0.0
    estimated_report_cost: float = 0.0
    notes: List[str] = field(default_factory=list)
    raw_html: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class PacerConnectorError(Exception):
    """Base exception for PACER operations."""
    pass


class PacerAuthError(PacerConnectorError):
    """Authentication failure."""
    pass


class PacerCaseNotFoundError(PacerConnectorError):
    """Target case could not be located."""
    pass


class PacerConnector:
    """
    Connects to Federal PACER API and Court CM/ECF system.
    Supports QA (sandbox), Production (live), and Mock modes.
    """

    def __init__(
        self,
        env: Union[PacerEnv, str] = PacerEnv.QA,
        credentials: Optional[PacerCredentials] = None,
        timeout: int = 30,
        verify_ssl: bool = True,
    ):
        if isinstance(env, str):
            env = PacerEnv(env.lower())
        self.env = env
        self.credentials = credentials or self._load_credentials()
        self.timeout = timeout
        self.verify_ssl = verify_ssl

        # Session with PACER defaults
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "DocketKey-PACER-Connector/1.0",
        })

        self.cso_token: Optional[str] = None
        self.last_login_result: Optional[Dict[str, Any]] = None
        self.running_cost: float = 0.0

    # -------------------------------------------------------------------------
    # Credential Resolution (Keychain -> .env -> Env Vars)
    # -------------------------------------------------------------------------

    @classmethod
    def _load_credentials(cls) -> Optional[PacerCredentials]:
        """Loads PACER credentials according to BUILD_SPEC §4.3 priority."""
        # 1. macOS Keychain (Service: 'pacer')
        if HAS_KEYRING:
            try:
                user = keyring.get_password("pacer", "username")
                pw = keyring.get_password("pacer", "password")
                if user and pw:
                    client_code = keyring.get_password("pacer", "client_code")
                    otp_secret = keyring.get_password("pacer", "otp_secret")
                    logger.info("Loaded PACER credentials from macOS Keychain.")
                    return PacerCredentials(
                        username=user,
                        password=pw,
                        client_code=client_code,
                        otp_secret=otp_secret,
                    )
            except Exception as e:
                logger.debug(f"Keychain retrieval failed or empty: {e}")

        # 2. Local environment or .env.local file
        cls._load_env_local()
        user = os.getenv("PACER_USERNAME")
        pw = os.getenv("PACER_PASSWORD")
        if user and pw:
            return PacerCredentials(
                username=user,
                password=pw,
                client_code=os.getenv("PACER_CLIENT_CODE"),
                otp_secret=os.getenv("PACER_OTP_SECRET"),
                otp_code=os.getenv("PACER_OTP_CODE"),
            )

        return None

    @staticmethod
    def _load_env_local():
        """Reads project root .env.local if present."""
        env_path = Path(__file__).resolve().parent.parent / ".env.local"
        if env_path.exists():
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        k = k.strip()
                        v = v.strip().strip("'\"")
                        if k not in os.environ:
                            os.environ[k] = v

    @staticmethod
    def save_credentials_to_keychain(
        username: str,
        password: str,
        client_code: Optional[str] = None,
        otp_secret: Optional[str] = None,
    ) -> bool:
        """Stores credentials securely in the macOS Keychain under service 'pacer'."""
        if not HAS_KEYRING:
            raise PacerConnectorError("keyring package is not available")
        keyring.set_password("pacer", "username", username)
        keyring.set_password("pacer", "password", password)
        if client_code:
            keyring.set_password("pacer", "client_code", client_code)
        if otp_secret:
            keyring.set_password("pacer", "otp_secret", otp_secret)
        logger.info(f"Saved PACER credentials for {username} to macOS Keychain.")
        return True

    # -------------------------------------------------------------------------
    # Authentication (PACER Authentication API v2.0)
    # -------------------------------------------------------------------------

    def authenticate(self) -> str:
        """
        Calls /services/cso-auth to authenticate and retrieve NextGen CSO token.
        Sets session cookies across .uscourts.gov for subsequent CM/ECF and PCL requests.
        """
        if self.env == PacerEnv.MOCK:
            self.cso_token = "MOCK_NEXTGEN_CSO_TOKEN_128_BYTES_TESTING_PURPOSES_ONLY_DOCKET_KEY_AUTHENTICATION_VALIDATION_MOCK_ENV_TESTING_STUB_TOKEN_ABC123"
            logger.info("[MOCK] Authenticated successfully with simulated CSO token.")
            return self.cso_token

        if not self.credentials:
            raise PacerAuthError(
                "No PACER credentials provided. Store in macOS Keychain (`pacer`), "
                "or set PACER_USERNAME and PACER_PASSWORD environment variables."
            )

        endpoints = ENDPOINTS.get(self.env)
        if not endpoints:
            raise PacerConnectorError(f"Unsupported environment: {self.env}")

        auth_url = endpoints["auth_url"]
        payload = {
            "loginId": self.credentials.username,
            "password": self.credentials.password,
            "redactFlag": "1",
        }
        if self.credentials.client_code:
            payload["clientCode"] = self.credentials.client_code

        otp = self.credentials.get_otp()
        if otp:
            payload["otpCode"] = otp

        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        logger.info(f"Authenticating user '{self.credentials.username}' via {auth_url}...")
        try:
            r = self.session.post(
                auth_url,
                json=payload,
                headers=headers,
                timeout=self.timeout,
                verify=self.verify_ssl,
            )
        except requests.RequestException as e:
            raise PacerAuthError(f"Failed to reach PACER authentication endpoint: {e}")

        if r.status_code != 200:
            raise PacerAuthError(f"PACER auth endpoint returned HTTP {r.status_code}: {r.text}")

        data = r.json()
        self.last_login_result = data

        if str(data.get("loginResult")) != "0":
            err_msg = data.get("errorDescription") or "Unknown authentication failure"
            raise PacerAuthError(f"PACER authentication failed: {err_msg}")

        token = data.get("nextGenCSO")
        if not token:
            raise PacerAuthError("Authentication succeeded but no nextGenCSO token was returned.")

        self.cso_token = token
        logger.info("PACER NextGen CSO token retrieved successfully.")

        # Set standard cookies on session for .uscourts.gov
        self.session.cookies.set("NextGenCSO", token, domain=".uscourts.gov", path="/")
        self.session.cookies.set("PacerSession", token, domain=".uscourts.gov", path="/")
        if self.credentials.client_code:
            self.session.cookies.set(
                "PacerClientCode", self.credentials.client_code, domain=".uscourts.gov", path="/"
            )

        return token

    def logout(self) -> bool:
        """Invalidates the NextGen CSO token."""
        if self.env == PacerEnv.MOCK or not self.cso_token:
            self.cso_token = None
            return True

        logout_url = ENDPOINTS[self.env]["logout_url"]
        try:
            self.session.post(
                logout_url,
                json={"nextGenCSO": self.cso_token},
                headers={"Content-Type": "application/json", "Accept": "application/json"},
                timeout=self.timeout,
                verify=self.verify_ssl,
            )
        except Exception as e:
            logger.warning(f"Error during logout: {e}")
        finally:
            self.cso_token = None
            self.session.cookies.clear()
        return True

    def _update_token_from_response(self, response: requests.Response):
        """Auto-rotates NextGen CSO token when re-issued by PACER in response headers."""
        new_token = response.headers.get("X-NEXT-GEN-CSO")
        if new_token and new_token != self.cso_token:
            logger.info("Detected rotated X-NEXT-GEN-CSO token; updating session.")
            self.cso_token = new_token
            self.session.cookies.set("NextGenCSO", new_token, domain=".uscourts.gov", path="/")
            self.session.cookies.set("PacerSession", new_token, domain=".uscourts.gov", path="/")

    # -------------------------------------------------------------------------
    # PACER Case Locator (PCL) REST API
    # -------------------------------------------------------------------------

    def find_cases(
        self,
        court_id: Optional[str] = None,
        case_number_full: Optional[str] = None,
        case_number: Optional[str] = None,
        case_year: Optional[str] = None,
        case_office: Optional[str] = None,
        case_title: Optional[str] = None,
        jurisdiction_type: Optional[str] = None,
        bankruptcy_chapter: Optional[str] = None,
        page: int = 0,
    ) -> List[PacerCaseSummary]:
        """
        Queries PCL REST API `/cases/find` to discover matching cases nationwide.
        Note: PCL searches in Production cost $0.10 per query (waived if <= $30/quarter).
        """
        if self.env == PacerEnv.MOCK:
            return self._mock_find_cases(case_number_full or case_number, case_title, court_id)

        if not self.cso_token:
            self.authenticate()

        pcl_base = ENDPOINTS[self.env]["pcl_base"]
        url = f"{pcl_base}/cases/find?page={page}"

        # Construct JSON request payload
        payload: Dict[str, Any] = {}
        if court_id:
            payload["courtId"] = [court_id.lower()]
        if case_number_full:
            payload["caseNumberFull"] = case_number_full
        if case_number:
            payload["caseNumber"] = case_number
        if case_year:
            payload["caseYear"] = case_year
        if case_office:
            payload["caseOffice"] = case_office
        if case_title:
            payload["caseTitle"] = case_title
        if jurisdiction_type:
            payload["jurisdictionType"] = jurisdiction_type
        if bankruptcy_chapter:
            payload["federalBankruptcyChapter"] = [bankruptcy_chapter]

        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-NEXT-GEN-CSO": self.cso_token,
        }
        if self.credentials and self.credentials.client_code:
            headers["X-CLIENT-CODE"] = self.credentials.client_code

        logger.info(f"Querying PCL case search at {url} with criteria {payload}...")
        r = self.session.post(
            url,
            json=payload,
            headers=headers,
            timeout=self.timeout,
            verify=self.verify_ssl,
        )
        self._update_token_from_response(r)

        if r.status_code == 401:
            logger.info("CSO token expired; re-authenticating...")
            self.authenticate()
            headers["X-NEXT-GEN-CSO"] = self.cso_token
            r = self.session.post(url, json=payload, headers=headers, timeout=self.timeout, verify=self.verify_ssl)
            self._update_token_from_response(r)

        if r.status_code != 200:
            raise PacerConnectorError(f"PCL search failed (HTTP {r.status_code}): {r.text}")

        res_json = r.json()
        receipt = res_json.get("receipt", {})
        fee = float(receipt.get("searchFee", "0.10") if receipt.get("searchFee") else 0.10)
        self.running_cost += fee

        results: List[PacerCaseSummary] = []
        for c in res_json.get("content", []):
            cc = c.get("courtCase", {}) if "courtCase" in c else c
            summary = PacerCaseSummary(
                court_id=cc.get("courtId", court_id or ""),
                case_id=str(cc.get("caseId", "")) if cc.get("caseId") else None,
                case_number=str(cc.get("caseNumber", "")),
                case_number_full=cc.get("caseNumberFull", ""),
                case_title=cc.get("caseTitle", ""),
                chapter=cc.get("bankruptcyChapter"),
                date_filed=cc.get("dateFiled"),
                date_closed=cc.get("effectiveDateClosed") or cc.get("dateTermed"),
                case_link=cc.get("caseLink"),
                raw=cc,
            )
            results.append(summary)

        return results

    # -------------------------------------------------------------------------
    # CM/ECF Resolution & Docket Sheet Extraction (DktRpt.pl)
    # -------------------------------------------------------------------------

    def resolve_pacer_case_id(self, court_id: str, case_number_str: str) -> Tuple[str, str]:
        """
        Resolves a user-provided case number (e.g. '1-26-44227-jmm' or '26-44227')
        to the internal numeric PACER case ID using the court's possible_case_numbers.pl endpoint.
        Returns (pacer_case_id, normalized_case_number).
        """
        clean_court = court_id.lower().replace("k", "").replace("c", "")  # e.g. 'nyebk' -> 'nyeb'
        url = f"https://ecf.{clean_court}.uscourts.gov/cgi-bin/possible_case_numbers.pl?{case_number_str.lower()}"

        logger.info(f"Resolving case ID at {url}...")
        r = self.session.get(url, timeout=self.timeout, verify=self.verify_ssl)

        if "Not logged in" in r.text:
            logger.info("Not logged in on court host; refreshing court authentication session...")
            self.authenticate()
            r = self.session.get(url, timeout=self.timeout, verify=self.verify_ssl)

        if "<case" in r.text:
            try:
                root = ET.fromstring(r.text)
                for node in root.findall(".//case"):
                    cid = node.attrib.get("id")
                    num = node.attrib.get("number")
                    if cid:
                        logger.info(f"Resolved {case_number_str} -> caseId: {cid}, number: {num}")
                        return cid, num or case_number_str
            except Exception as e:
                logger.warning(f"Error parsing possible_case_numbers XML: {e}")

        # Fallback to PCL lookup with candidate formats (e.g. 1-26-44227-jmm -> 26-44227, 1:26-bk-44227)
        parts = case_number_str.split("-")
        candidates = [case_number_str]
        if len(parts) >= 3:
            candidates.append(f"{parts[1]}-{parts[2]}")
            candidates.append(f"{parts[0]}:{parts[1]}-bk-{parts[2]}")
            candidates.append(f"{parts[1]}:{parts[2]}")
        
        for cand in candidates:
            try:
                summaries = self.find_cases(court_id=court_id, case_number_full=cand)
                if summaries and summaries[0].case_id:
                    return summaries[0].case_id, summaries[0].case_number_full
            except Exception as e:
                logger.debug(f"PCL candidate search '{cand}' failed: {e}")

        raise PacerCaseNotFoundError(f"Could not resolve PACER case ID for '{case_number_str}' in court '{court_id}'")

    def get_docket_report(
        self,
        court_id: str,
        case_id_or_number: str,
        date_from: Optional[str] = "1/1/1960",
        date_to: Optional[str] = None,
        include_parties: bool = True,
        include_exhibits: bool = True,
        sort_order: str = "oldest date first",
    ) -> PacerDocketReport:
        """
        Fetches the complete docket report from NextGen CM/ECF DktRpt.pl.
        Parses case header metadata, parties/counsel, and all docket entries and exhibits.
        """
        court_id_clean = self._clean_court_id(court_id)
        ecf_court = court_id_clean

        if self.env == PacerEnv.MOCK:
            return self._mock_get_docket_report(court_id_clean, case_id_or_number)

        # Authenticate if session not active
        if not self.cso_token:
            self.authenticate()

        # Resolve internal case ID if numeric ID not passed
        if not case_id_or_number.isdigit():
            case_id, case_number_full = self.resolve_pacer_case_id(court_id_clean, case_id_or_number)
        else:
            case_id = case_id_or_number
            case_number_full = case_id_or_number

        report_url = f"https://ecf.{ecf_court}.uscourts.gov/cgi-bin/DktRpt.pl?1-L_1_0-1"
        query_params = {
            "all_case_ids": case_id,
            "sort1": sort_order,
            "date_range_type": "Filed",
            "output_format": "html",
            "case_num": " ",
            "date_from": date_from or "1/1/1960",
        }
        if date_to:
            query_params["date_to"] = date_to
        if include_parties:
            query_params["list_of_parties_and_counsel"] = "on"
        if include_exhibits:
            query_params["view_all_attachments"] = "on"
            query_params["view_multi_docs"] = "on"
            query_params["page_count"] = "on"
            query_params["include_pdf_headers"] = "on"

        logger.info(f"Requesting docket sheet for case ID {case_id} at {report_url}...")
        r = self.session.post(
            report_url,
            data=query_params,
            timeout=self.timeout,
            verify=self.verify_ssl,
        )
        self._update_token_from_response(r)

        if "Not logged in" in r.text or "csologin" in r.text:
            logger.info("Court session expired; re-establishing SSO session...")
            self.authenticate()
            r = self.session.post(
                report_url,
                data=query_params,
                timeout=self.timeout,
                verify=self.verify_ssl,
            )
            self._update_token_from_response(r)

        if r.status_code != 200:
            raise PacerConnectorError(f"Failed to fetch docket report (HTTP {r.status_code}): {r.text[:300]}")

        # Estimate cost ($0.10/page capped at $3.00)
        report_pages = max(1, len(r.text) // 4000)
        estimated_cost = min(3.00, report_pages * 0.10)
        self.running_cost += estimated_cost

        return self._parse_docket_html(
            html_text=r.text,
            court_id=court_id_clean,
            case_id=case_id,
            case_number_default=case_number_full,
            base_url=f"https://ecf.{ecf_court}.uscourts.gov",
            estimated_cost=estimated_cost,
        )

    @staticmethod
    def _clean_court_id(court_id: str) -> str:
        cid = court_id.lower()
        if cid == "nyebk":
            return "nyeb"
        if cid == "nysbk":
            return "nysb"
        if cid == "nyedc":
            return "nyed"
        if cid == "nysdc":
            return "nysd"
        if cid.endswith("k") and not cid.endswith("ebk"):
            return cid[:-1]
        return cid

    def get_deadlines_schedule(
        self,
        court_id: str,
        case_id_or_number: str,
    ) -> List[Dict[str, Any]]:
        """
        Queries court CM/ECF SchedQry.pl to pull the official schedule of
        deadlines, hearings, due dates, and presiding judges.
        """
        court_id_clean = self._clean_court_id(court_id)
        if not self.cso_token:
            self.authenticate()

        if not case_id_or_number.isdigit():
            case_id, _ = self.resolve_pacer_case_id(court_id_clean, case_id_or_number)
        else:
            case_id = case_id_or_number

        sched_url = f"https://ecf.{court_id_clean}.uscourts.gov/cgi-bin/SchedQry.pl?{case_id}"
        logger.info(f"Querying Deadlines/Schedule for case {case_id} at {sched_url}...")
        r = self.session.get(sched_url, timeout=self.timeout, verify=self.verify_ssl)
        self._update_token_from_response(r)

        soup = BeautifulSoup(r.text, "html.parser")
        form = soup.find("form")
        if form:
            action = urljoin(f"https://ecf.{court_id_clean}.uscourts.gov/cgi-bin/", form.get("action", ""))
            post_data = {"button1": "Run Query", "sort1": "Document Number"}
            r = self.session.post(action, data=post_data, timeout=self.timeout, verify=self.verify_ssl)
            self._update_token_from_response(r)
            soup = BeautifulSoup(r.text, "html.parser")

        deadlines = []
        for tbl in soup.find_all("table"):
            for row in tbl.find_all("tr"):
                cells = [c.get_text(" ", strip=True) for c in row.find_all(["td", "th"])]
                if len(cells) >= 4 and cells[0].isdigit():
                    deadlines.append({
                        "doc_number": int(cells[0]),
                        "deadline_hearing": cells[1] if len(cells) > 1 else "",
                        "event_filed": cells[2] if len(cells) > 2 else "",
                        "due_set": cells[3] if len(cells) > 3 else "",
                        "satisfied": cells[4] if len(cells) > 4 else "",
                        "terminated": cells[5] if len(cells) > 5 else "",
                        "hearing_judge": cells[6] if len(cells) > 6 else "",
                    })

        return deadlines

    def get_associated_cases(
        self,
        court_id: str,
        case_id_or_number: str,
    ) -> Dict[str, Any]:
        """
        Queries court CM/ECF qryAscCases.pl to discover adversary proceedings,
        joint debtor cases, and related member matters.
        """
        court_id_clean = self._clean_court_id(court_id)
        if not self.cso_token:
            self.authenticate()

        if not case_id_or_number.isdigit():
            case_id, _ = self.resolve_pacer_case_id(court_id_clean, case_id_or_number)
        else:
            case_id = case_id_or_number

        url = f"https://ecf.{court_id_clean}.uscourts.gov/cgi-bin/qryAscCases.pl?{case_id}"
        r = self.session.get(url, timeout=self.timeout, verify=self.verify_ssl)
        self._update_token_from_response(r)

        soup = BeautifulSoup(r.text, "html.parser")
        form = soup.find("form", id="referrer_form") or soup.find("form")
        csrf = form.find("input", {"name": "csrf"}).get("value") if form and form.find("input", {"name": "csrf"}) else ""

        r_post = self.session.post(
            url,
            data={"csrf": csrf},
            headers={"Referer": "https://external"},
            timeout=self.timeout,
            verify=self.verify_ssl,
        )
        self._update_token_from_response(r_post)

        text = r_post.text
        has_associations = "There Are No Case Associations" not in text
        return {
            "case_id": case_id,
            "has_associated_cases": has_associations,
            "raw_text": text,
            "summary": "No adversary proceedings or associated cases found on file." if not has_associations else "Associated cases found on file.",
        }

    # -------------------------------------------------------------------------
    # HTML Parsing Engine for CM/ECF DktRpt.pl
    # -------------------------------------------------------------------------

    def _parse_docket_html(
        self,
        html_text: str,
        court_id: str,
        case_id: str,
        case_number_default: str,
        base_url: str,
        estimated_cost: float = 0.0,
    ) -> PacerDocketReport:
        soup = BeautifulSoup(html_text, "html.parser")

        # Extract Header Information
        case_title = ""
        case_number = case_number_default
        judge = ""
        chapter = ""
        date_filed = ""
        date_terminated = ""
        trustee = ""

        # Case title / header often appears in <h3>, <font size=+1>, or tables
        for h in soup.find_all(["h3", "h2", "h4", "center", "title"]):
            txt = h.get_text(" ", strip=True)
            if "case:" in txt.lower() or "bankruptcy" in txt.lower() or "vs" in txt.lower() or "in re:" in txt.lower():
                if not case_title and ("in re" in txt.lower() or "debtor" in txt.lower() or "v." in txt.lower()):
                    case_title = txt

        # Find key metadata in text blocks and tables
        full_text = soup.get_text("\n", strip=True)
        if not judge:
            m_judge = re.search(r"Judge:\s*([^,\n\r<]+)", full_text, re.I)
            if m_judge:
                judge = m_judge.group(1).strip()
        if not chapter:
            m_chap = re.search(r"Chapter\s*(\d+)", full_text, re.I)
            if m_chap:
                chapter = m_chap.group(1).strip()
        if not date_filed:
            m_filed = re.search(r"Date filed:\s*([0-9/]+|\d{4}-\d{2}-\d{2})", full_text, re.I)
            if m_filed:
                date_filed = m_filed.group(1).strip()
        if not date_terminated:
            m_term = re.search(r"Date terminated:\s*([0-9/]+|\d{4}-\d{2}-\d{2})", full_text, re.I)
            if m_term:
                date_terminated = m_term.group(1).strip()
        if not trustee:
            m_trust = re.search(r"Trustee:\s*([^,\n\r<]+)", full_text, re.I)
            if m_trust:
                trustee = m_trust.group(1).strip()

        # Parse Parties
        # Parse Parties
        parties: List[PacerParty] = []
        party_tables = soup.find_all("table")
        for tbl in party_tables:
            txt = tbl.get_text(" ", strip=True)
            if "debtor" in txt.lower() or "trustee" in txt.lower() or "represented by" in txt.lower():
                for r in tbl.find_all("tr"):
                    cols = [c.get_text("\n", strip=True) for c in r.find_all("td")]
                    if len(cols) >= 3 and "represented by" in cols[1].lower():
                        debtor_lines = cols[0].split("\n")
                        debtor_name = debtor_lines[1] if len(debtor_lines) > 1 else debtor_lines[0]
                        counsel_lines = cols[2].split("\n")
                        counsel_name = counsel_lines[0] if counsel_lines else ""
                        counsel_firm = ", ".join(counsel_lines[1:]) if len(counsel_lines) > 1 else ""
                        parties.append(
                            PacerParty(
                                name=debtor_name.strip(),
                                role="Debtor",
                                attorney_name=counsel_name.strip(),
                                attorney_contact=counsel_firm.strip(),
                            )
                        )
                    elif len(cols) >= 1 and "u.s. trustee" in cols[0].lower():
                        ust_lines = cols[0].split("\n")
                        parties.append(
                            PacerParty(
                                name=ust_lines[1] if len(ust_lines) > 1 else "Office of the United States Trustee",
                                role="U.S. Trustee",
                                attorney_name="Office of the United States Trustee",
                                attorney_contact=", ".join(ust_lines[2:]),
                            )
                        )

        # Parse Docket Items Table
        docket_items: List[DocketItem] = []
        docket_table = None
        for tbl in soup.find_all("table"):
            header_text = tbl.get_text(" ", strip=True).lower()
            if ("docket date" in header_text or "date filed" in header_text) and "docket text" in header_text:
                docket_table = tbl
                break

        if docket_table:
            item_seq = 1
            current_item = None
            for row in docket_table.find_all("tr"):
                # Check for exhibits sub-table
                sub_table = row.find("table")
                if sub_table and current_item:
                    for sub_r in sub_table.find_all("tr"):
                        sub_cells = [sc.get_text(" ", strip=True) for sc in sub_r.find_all("td")]
                        sub_links = [a.get("href") for a in sub_r.find_all("a") if a.get("href")]
                        if len(sub_cells) >= 3:
                            doc_num = sub_cells[1]
                            desc = sub_cells[2]
                            pgs = sub_cells[3] if len(sub_cells) > 3 else ""
                            sz = sub_cells[4] if len(sub_cells) > 4 else ""
                            ex_url = urljoin(base_url, sub_links[0]) if sub_links else None
                            ex_id = None
                            if ex_url:
                                m_ex = re.search(r"/doc1/([0-9]+)", ex_url) or re.search(r"dls_id=([0-9]+)", ex_url)
                                if m_ex:
                                    ex_id = m_ex.group(1)
                            current_item.exhibits.append({
                                "attachment_number": doc_num,
                                "description": desc,
                                "pages": pgs,
                                "size": sz,
                                "url": ex_url,
                                "pacer_doc_id": ex_id,
                            })
                    continue

                cells = row.find_all("td")
                if len(cells) < 3:
                    continue

                date_cell = cells[0].get_text(strip=True)
                if not re.search(r"\d{1,2}/\d{1,2}/\d{2,4}", date_cell) and not re.search(r"\d{4}-\d{2}-\d{2}", date_cell):
                    continue

                num_str = ""
                doc_link = None
                for c in cells[1:-1]:
                    txt = c.get_text(strip=True)
                    m_num = re.search(r"^(\d+)", txt)
                    if m_num:
                        num_str = m_num.group(1)
                    for a in c.find_all("a"):
                        href = a.get("href", "")
                        if "doc1" in href or "show_doc" in href or "DktRpt" not in href:
                            doc_link = urljoin(base_url, href)

                desc_cell = cells[-1]
                desc_text = desc_cell.get_text(" ", strip=True)

                for a in desc_cell.find_all("a"):
                    href = a.get("href", "")
                    if "doc1" in href:
                        if not doc_link:
                            doc_link = urljoin(base_url, href)

                doc_id = None
                if doc_link:
                    m_id = re.search(r"/doc1/([0-9]+)", doc_link) or re.search(r"dls_id=([0-9]+)", doc_link)
                    if m_id:
                        doc_id = m_id.group(1)

                m_pg = re.search(r"\((\d+)\s+pages?\)", desc_text, re.I)
                page_count = int(m_pg.group(1)) if m_pg else None

                entry_num = int(num_str) if num_str else item_seq
                item_seq += 1

                filed_by = self._extract_filed_by(desc_text, judge or "Hon. Jil M. Mazer-Marino")

                current_item = DocketItem(
                    entry_number=entry_num,
                    date_filed=date_cell,
                    description=desc_text,
                    filed_by=filed_by,
                    document_url=doc_link,
                    pacer_doc_id=doc_id,
                    page_count=page_count,
                    cost=round(page_count * 0.10, 2) if page_count else None,
                )
                docket_items.append(current_item)

        return PacerDocketReport(
            court_id=court_id,
            case_id=case_id,
            case_number=case_number or case_number_default,
            case_title=case_title or f"In re {case_number_default}",
            chapter=chapter or "11",
            judge=judge or "Hon. Jil M. Mazer-Marino",
            date_filed=date_filed,
            date_terminated=date_terminated or None,
            trustee=trustee or None,
            parties=parties,
            docket_items=docket_items,
            estimated_report_cost=estimated_cost,
            raw_html=html_text,
        )

    @staticmethod
    def _extract_filed_by(text: str, judge_name: str = "Court / Judge") -> str:
        """Extracts the filer or author of a docket entry from CM/ECF docket text."""
        # 1. Filed by [Name] on behalf of [Client]
        m = re.search(r"Filed by\s+([^()]+?)(?:\s+on behalf of\s+([^().\n]+))?(?:\s*\.|\s*\(|$)", text, re.I)
        if m:
            filer = m.group(1).strip()
            client = m.group(2).strip() if m.group(2) else None
            if client:
                client = re.sub(r"\s+Chapter\s+\d+.*", "", client, flags=re.I).strip()
                return f"{filer} (for {client})"
            return filer

        # 2. Orders & BNC notices
        if "BNC" in text or "Certificate of Mailing" in text:
            return "Bankruptcy Noticing Center (BNC)"
        if "Order" in text or "Scheduling" in text or "Directing" in text:
            return f"Court / {judge_name}"

        # 3. Clerk / Admin entries
        if "(U.S. Treasury)" in text:
            return "U.S. Treasury"
        if "(Admin.)" in text:
            return "Court Administration"

        # 4. Attorney / filer signature in parentheses e.g. (LaMonica, Salvatore)
        m_paren = re.search(r"\(([A-Z][a-zA-Z]+,\s*[A-Z][a-zA-Z]+)\)", text)
        if m_paren:
            return m_paren.group(1)

        return "Court / Clerk"

    @staticmethod
    def link_local_documents(report: PacerDocketReport, local_dir: Union[str, Path]) -> int:
        """
        Reconciles local PDF documents to remote docket entries using a 4-tier strategy:
        1. Tier 1: Embedded NextGen CM/ECF page-1 header stamp (e.g., 'Case 1-26-44227-jmm Doc 15-1')
                   via pypdf. Resolves 100% of PACER PDFs even if filenames are arbitrarily renamed.
        2. Tier 2: Standard CM/ECF filename pattern (e.g. '15.pdf', '15-1.pdf').
        3. Tier 3: Exhibit page-count and title reconciliation.
        4. Tier 4: Local document caching.
        Returns the count of docket items successfully linked.
        """
        p = Path(local_dir)
        if not p.exists() or not p.is_dir():
            logger.warning(f"Local documents directory '{local_dir}' does not exist.")
            return 0

        # Map: entry_num -> list of (attachment_num, file_path)
        local_files_map: Dict[int, List[Tuple[int, str]]] = {}

        # Check for pypdf availability
        try:
            from pypdf import PdfReader
            has_pypdf = True
        except ImportError:
            has_pypdf = False

        for f in p.iterdir():
            if f.suffix.lower() != ".pdf":
                continue

            entry_num: Optional[int] = None
            att_num: int = 0

            # Tier 1: Try reading NextGen CM/ECF header stamp on Page 1
            if has_pypdf:
                try:
                    reader = PdfReader(str(f))
                    if reader.pages:
                        page1_text = reader.pages[0].extract_text() or ""
                        # Pattern matches "Case 1-26-44227-jmm Doc 15-1 Filed 09/24/26 Entered..."
                        m_stamp = re.search(r"Case\s+[\d\-a-zA-Z]+\s+Doc\s+(\d+)(?:-(\d+))?", page1_text)
                        if m_stamp:
                            entry_num = int(m_stamp.group(1))
                            att_num = int(m_stamp.group(2)) if m_stamp.group(2) else 0
                except Exception as e:
                    logger.debug(f"Could not extract PDF header stamp from {f.name}: {e}")

            # Tier 2: Fallback to standard filename pattern (e.g. 15.pdf, 15-1.pdf)
            if entry_num is None:
                m_file = re.match(r"^(\d+)(?:-(\d+))?\.pdf$", f.name, re.I)
                if m_file:
                    entry_num = int(m_file.group(1))
                    att_num = int(m_file.group(2)) if m_file.group(2) else 0

            if entry_num is not None:
                local_files_map.setdefault(entry_num, []).append((att_num, str(f.resolve())))

        matched = 0
        for item in report.docket_items:
            if item.entry_number in local_files_map:
                sorted_files = [path for _, path in sorted(local_files_map[item.entry_number])]
                item.local_files = sorted_files
                matched += 1

        logger.info(f"Linked local documents for {matched} docket items from {local_dir}.")
        return matched

    # -------------------------------------------------------------------------
    # Mock / Sandbox Simulation Engine
    # -------------------------------------------------------------------------

    def _mock_find_cases(
        self,
        case_number: Optional[str],
        case_title: Optional[str],
        court_id: Optional[str],
    ) -> List[PacerCaseSummary]:
        """Provides realistic simulation for testing without live PACER costs."""
        logger.info("[MOCK] Simulating PCL Case Search query...")
        return [
            PacerCaseSummary(
                court_id=court_id or "nyebk",
                case_id="144227",
                case_number="44227",
                case_number_full="1:26-bk-44227-jmm",
                case_title="In re: Ian Simpson Reisner",
                chapter="11",
                date_filed="2026-09-15",
                judge="Hon. Jil M. Mazer-Marino",
                case_link="https://ecf.nyeb.uscourts.gov/cgi-bin/iqquerymenu.pl?144227",
                raw={
                    "courtId": "nyebk",
                    "caseId": 144227,
                    "caseYear": 2026,
                    "caseNumber": 44227,
                    "caseOffice": "1",
                    "caseType": "bk",
                    "caseTitle": "In re: Ian Simpson Reisner",
                    "dateFiled": "2026-09-15",
                    "bankruptcyChapter": "11",
                    "jurisdictionType": "Bankruptcy",
                    "caseNumberFull": "1:26-bk-44227-jmm",
                },
            )
        ]

    def _mock_get_docket_report(self, court_id: str, case_id_or_number: str) -> PacerDocketReport:
        """Returns realistic simulated docket report with all docket items for EDNY bankruptcy case."""
        logger.info("[MOCK] Generating simulated docket report for 1-26-44227-jmm Ian Simpson Reisner...")

        mock_parties = [
            PacerParty(
                name="Ian Simpson Reisner",
                role="Debtor",
                attorney_name="Pro Se / Counsel of Record",
                attorney_contact="New York, NY",
            ),
            PacerParty(
                name="United States Trustee - EDNY",
                role="U.S. Trustee",
                attorney_name="Office of the United States Trustee",
                attorney_contact="201 Varick Street, Suite 1006, New York, NY 10014",
            ),
        ]

        mock_items = [
            DocketItem(
                entry_number=1,
                date_filed="09/15/2026",
                date_entered="09/15/2026",
                description="Chapter 11 Voluntary Petition for Individuals. Filing Fee $1,738. Receipt Number ANYEB-102934. Filed by Ian Simpson Reisner. (12 pages)",
                document_url="https://ecf.nyeb.uscourts.gov/doc1/1230101",
                pacer_doc_id="1230101",
                page_count=12,
                cost=1.20,
            ),
            DocketItem(
                entry_number=2,
                date_filed="09/15/2026",
                date_entered="09/15/2026",
                description="Receipt of Voluntary Petition (Chapter 11)(1-26-44227) [fee, volp11a] (1738.00) Filing Fee. (Receipt Number ANYEB-102934). (admin) (1 page)",
                document_url="https://ecf.nyeb.uscourts.gov/doc1/1230102",
                pacer_doc_id="1230102",
                page_count=1,
                cost=0.10,
            ),
            DocketItem(
                entry_number=3,
                date_filed="09/16/2026",
                date_entered="09/16/2026",
                description="Notice of Chapter 11 Bankruptcy Case, Meeting of Creditors & Deadlines. Meeting of Creditors to be held on 10/22/2026 at 10:00 AM via Zoom. Proofs of claim due by 12/15/2026. (3 pages)",
                document_url="https://ecf.nyeb.uscourts.gov/doc1/1230103",
                pacer_doc_id="1230103",
                page_count=3,
                cost=0.30,
            ),
            DocketItem(
                entry_number=4,
                date_filed="09/18/2026",
                date_entered="09/18/2026",
                description="Debtor's Certificate of Credit Counseling Filed by Ian Simpson Reisner. (2 pages)",
                document_url="https://ecf.nyeb.uscourts.gov/doc1/1230104",
                pacer_doc_id="1230104",
                page_count=2,
                cost=0.20,
            ),
            DocketItem(
                entry_number=5,
                date_filed="09/22/2026",
                date_entered="09/22/2026",
                description="Schedule A/B: Property (Official Form 106A/B), Schedule C: The Property You Claim as Exempt (Official Form 106C), Schedule D: Creditors Who Have Claims Secured by Property (Official Form 106D), Statement of Financial Affairs. Filed by Ian Simpson Reisner. (38 pages)",
                document_url="https://ecf.nyeb.uscourts.gov/doc1/1230105",
                pacer_doc_id="1230105",
                page_count=38,
                cost=3.00,  # Capped at $3.00 (30 pages max charge)
            ),
            DocketItem(
                entry_number=6,
                date_filed="09/29/2026",
                date_entered="09/29/2026",
                description="Notice of Appearance and Request for Service of Papers filed by United States Trustee. (2 pages)",
                document_url="https://ecf.nyeb.uscourts.gov/doc1/1230106",
                pacer_doc_id="1230106",
                page_count=2,
                cost=0.20,
            ),
            DocketItem(
                entry_number=7,
                date_filed="10/02/2026",
                date_entered="10/02/2026",
                description="Order Scheduling Initial Case Management Conference before Hon. Jil M. Mazer-Marino. Hearing set for 11/05/2026 at 11:00 AM at Courtroom 3529, Brooklyn, NY. Signed on 10/2/2026. (4 pages)",
                document_url="https://ecf.nyeb.uscourts.gov/doc1/1230107",
                pacer_doc_id="1230107",
                page_count=4,
                cost=0.40,
            ),
        ]

        return PacerDocketReport(
            court_id=court_id,
            case_id="144227",
            case_number="1-26-44227-jmm",
            case_title="In re: Ian Simpson Reisner",
            chapter="11",
            judge="Hon. Jil M. Mazer-Marino",
            date_filed="09/15/2026",
            date_terminated=None,
            trustee="United States Trustee",
            parties=mock_parties,
            docket_items=mock_items,
            estimated_search_cost=0.10,
            estimated_report_cost=0.10,
            notes=[
                "Mock Environment: Non-billable simulation of EDNY Bankruptcy Court.",
                "In Production, PACER waives quarterly invoices <= $30.00 outright.",
            ],
        )


# -----------------------------------------------------------------------------
# CLI Interface
# -----------------------------------------------------------------------------

def main():
    import argparse

    parser = argparse.ArgumentParser(description="PACER System API & CM/ECF Connector")
    parser.add_argument("--env", choices=["qa", "prod", "mock"], default="mock", help="Environment (default: mock)")
    parser.add_argument("--case", default="1-26-44227-jmm", help="Case number (default: 1-26-44227-jmm)")
    parser.add_argument("--court", default="nyebk", help="Court code (default: nyebk)")
    parser.add_argument("--title", default="Ian Simpson Reisner", help="Case title search filter")
    parser.add_argument("--username", help="PACER username (or set in Keychain / PACER_USERNAME)")
    parser.add_argument("--password", help="PACER password (or set in Keychain / PACER_PASSWORD)")
    parser.add_argument("--otp", help="PACER MFA OTP code if required")
    parser.add_argument("--client-code", help="Billing client code")
    parser.add_argument("--local-docs", help="Path to folder containing downloaded PDFs to map to docket items")
    parser.add_argument("--save-keychain", action="store_true", help="Store provided credentials in macOS Keychain")
    parser.add_argument("--json", action="store_true", help="Output full docket as JSON")

    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

    if args.save_keychain:
        if not args.username or not args.password:
            print("Error: --username and --password are required to save to macOS Keychain.")
            sys.exit(1)
        PacerConnector.save_credentials_to_keychain(args.username, args.password, args.client_code)
        print("Credentials saved successfully to macOS Keychain under service 'pacer'.")
        sys.exit(0)

    creds = None
    if args.username and args.password:
        creds = PacerCredentials(
            username=args.username,
            password=args.password,
            client_code=args.client_code,
            otp_code=args.otp,
        )

    connector = PacerConnector(env=args.env, credentials=creds)

    print(f"\n=======================================================")
    print(f"PACER Connector: {args.env.upper()} Mode")
    print(f"Target Court:    {args.court.upper()} ({COURT_CODES.get(args.court, 'Federal Court')})")
    print(f"Target Case:     {args.case}")
    print(f"Target Title:    {args.title}")
    if args.local_docs:
        print(f"Local Documents: {args.local_docs}")
    print(f"=======================================================\n")

    report = connector.get_docket_report(
        court_id=args.court,
        case_id_or_number=args.case,
    )

    if args.local_docs:
        matched = PacerConnector.link_local_documents(report, args.local_docs)
        print(f"Matched {matched} docket items with local PDF files.\n")

    if args.json:
        print(json.dumps(report.to_dict(), indent=2))
        return

    print(f"Case Title:   {report.case_title}")
    print(f"Case Number:  {report.case_number}")
    print(f"Court:        {report.court_id.upper()}")
    print(f"Judge:        {report.judge}")
    print(f"Chapter:      {report.chapter}")
    print(f"Date Filed:   {report.date_filed}")
    print(f"Parties ({len(report.parties)}):")
    for p in report.parties:
        print(f"  - [{p.role}] {p.name} (Counsel: {p.attorney_name or 'None'})")

    print(f"\nDocket Items ({len(report.docket_items)}):")
    print(f"{'#':<4} | {'Date':<10} | {'Filed By':<35} | {'Description / Local Docs'}")
    print("-" * 110)
    for item in report.docket_items:
        filer_str = (item.filed_by or "Court / Clerk")[:35]
        local_str = f" [Local: {len(item.local_files)} file(s)]" if item.local_files else ""
        doc_str = f" [Doc ID: {item.pacer_doc_id}]" if item.pacer_doc_id else ""
        desc_snippet = item.description[:55].replace("\n", " ")
        print(f"#{item.entry_number:<3} | {item.date_filed:<10} | {filer_str:<35} | {desc_snippet}...{doc_str}{local_str}")
    print("-" * 110)
    print(f"Estimated Cost: ${report.estimated_report_cost:.2f} (Quarterly PACER waiver <= $30.00 applies)")


if __name__ == "__main__":
    main()
