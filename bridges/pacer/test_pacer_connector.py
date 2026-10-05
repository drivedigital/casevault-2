"""
Unit and Integration Tests for PACER Connector
"""

import unittest
import requests
try:
    from bridges.pacer.pacer_connector import (
        PacerConnector,
        PacerEnv,
        PacerCredentials,
        PacerAuthError,
        PacerDocketReport,
        DocketItem,
    )
except ImportError:
    from pacer_connector import (
        PacerConnector,
        PacerEnv,
        PacerCredentials,
        PacerAuthError,
        PacerDocketReport,
        DocketItem,
    )


class TestPacerConnector(unittest.TestCase):

    def test_mock_environment(self):
        connector = PacerConnector(env=PacerEnv.MOCK)
        token = connector.authenticate()
        self.assertTrue(token.startswith("MOCK_NEXTGEN_CSO_TOKEN"))

        summaries = connector.find_cases(
            court_id="nyebk",
            case_number="44227",
            case_title="Ian Simpson Reisner",
        )
        self.assertEqual(len(summaries), 1)
        self.assertEqual(summaries[0].case_number_full, "1:26-bk-44227-jmm")
        self.assertEqual(summaries[0].court_id, "nyebk")

        report = connector.get_docket_report(
            court_id="nyebk",
            case_id_or_number="1-26-44227-jmm",
        )
        self.assertEqual(report.case_number, "1-26-44227-jmm")
        self.assertEqual(report.chapter, "11")
        self.assertIn("Ian Simpson Reisner", report.case_title)
        self.assertGreaterEqual(len(report.docket_items), 7)
        self.assertEqual(report.docket_items[0].entry_number, 1)
        self.assertEqual(report.docket_items[0].page_count, 12)
        self.assertEqual(report.docket_items[0].cost, 1.20)

    def test_html_parsing(self):
        sample_html = """
        <html>
        <head><title>1:26-bk-44227-jmm In re: Ian Simpson Reisner</title></head>
        <body>
        <center>
            <b>U.S. Bankruptcy Court</b><br>
            <b>Eastern District of New York (Brooklyn)</b><br>
            <b>Bankruptcy Petition #: 1:26-bk-44227-jmm</b><br>
            <b>Date filed: 09/15/2026</b><br>
            <b>Assigned to: Judge: Hon. Jil M. Mazer-Marino</b><br>
            <b>Chapter 11</b><br>
            <b>Voluntary</b><br>
        </center>
        <table border="1">
            <tr><th colspan="2">Parties in this case</th></tr>
            <tr>
                <td>Debtor: Ian Simpson Reisner</td>
                <td>represented by: Pro Se</td>
            </tr>
        </table>
        <p></p>
        <table border="1" cellpadding="5">
            <tr>
                <th>Date Filed</th>
                <th>#</th>
                <th>Docket Text</th>
            </tr>
            <tr>
                <td>09/15/2026</td>
                <td><a href="/doc1/1230101">1</a></td>
                <td>Chapter 11 Voluntary Petition for Individuals. Filing Fee $1,738. Filed by Ian Simpson Reisner. (12 pages)</td>
            </tr>
            <tr>
                <td>09/16/2026</td>
                <td><a href="/doc1/1230103">3</a></td>
                <td>Notice of Chapter 11 Meeting of Creditors via Zoom. (3 pages)</td>
            </tr>
        </table>
        </body>
        </html>
        """
        connector = PacerConnector(env=PacerEnv.MOCK)
        report = connector._parse_docket_html(
            html_text=sample_html,
            court_id="nyebk",
            case_id="144227",
            case_number_default="1:26-bk-44227-jmm",
            base_url="https://ecf.nyeb.uscourts.gov",
        )
        self.assertEqual(report.judge, "Hon. Jil M. Mazer-Marino")
        self.assertEqual(report.chapter, "11")
        self.assertEqual(report.date_filed, "09/15/2026")
        self.assertEqual(len(report.docket_items), 2)
        self.assertEqual(report.docket_items[0].entry_number, 1)
        self.assertEqual(report.docket_items[0].pacer_doc_id, "1230101")
        self.assertEqual(report.docket_items[0].page_count, 12)
        self.assertEqual(report.docket_items[1].entry_number, 3)
        self.assertEqual(report.docket_items[1].page_count, 3)

    def test_token_rotation(self):
        connector = PacerConnector(env=PacerEnv.MOCK)
        connector.cso_token = "OLD_TOKEN"
        mock_resp = requests.Response()
        mock_resp.headers["X-NEXT-GEN-CSO"] = "NEW_ROTATED_TOKEN_128_CHARS"
        connector._update_token_from_response(mock_resp)
        self.assertEqual(connector.cso_token, "NEW_ROTATED_TOKEN_128_CHARS")

    def test_qa_auth_live_contract(self):
        """Verifies QA endpoint contract and live reachability."""
        creds = PacerCredentials(username="test_user", password="bad_password")
        connector = PacerConnector(env=PacerEnv.QA, credentials=creds)
        with self.assertRaises(PacerAuthError) as ctx:
            connector.authenticate()
        self.assertIn("Login Failed", str(ctx.exception))

    def test_edny_possible_case_numbers_endpoint_live(self):
        """Verifies live EDNY Bankruptcy CM/ECF endpoint responds as expected."""
        url = "https://ecf.nyeb.uscourts.gov/cgi-bin/possible_case_numbers.pl?26-44227"
        r = requests.get(url, timeout=10)
        self.assertEqual(r.status_code, 200)
        self.assertIn("<request", r.text)


if __name__ == "__main__":
    unittest.main()
