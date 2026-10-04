import unittest, tempfile, pathlib, json
from nyscef import parse_html, court_url, acquire
URL = 'https://iapps.courts.state.ny.us/nyscef/DocumentList?docketId=synthetic'
class AcquisitionTests(unittest.TestCase):
    def test_metadata_and_deleted_rows_remain_separate(self):
        html = '<table><tr><td>1</td><td>SYNTHETIC FILING</td><td>Filed: 10/01/2026</td><td>Processed</td></tr><tr><td>2</td><td>SYNTHETIC DELETED</td><td>Filed: 10/02/2026</td><td>Deleted</td></tr></table>'
        entries, _ = parse_html(html, URL)
        self.assertEqual([x['number'] for x in entries], [1, 2]); self.assertEqual(entries[0]['availability'], 'metadata_only'); self.assertEqual(entries[1]['availability'], 'deleted'); self.assertEqual(entries[0]['filedDate'], '2026-10-01')
    def test_download_url_must_belong_to_court(self):
        with self.assertRaises(ValueError): court_url('https://example.com/nyscef/ViewDocument?docIndex=x')
        html = '<tr><td>1</td><td><a href="https://example.com/document">SYNTHETIC</a></td><td></td><td>Processed</td></tr>'
        self.assertIsNone(parse_html(html, URL)[0][0]['sourceUrl'])
    def test_challenge_and_empty_page_pause_instead_of_empty_success(self):
        for html in ['<title>Just a moment</title>', '<html>No table</html>']:
            with self.assertRaises(PermissionError): parse_html(html, URL)
    def test_pagination_preserves_observed_url(self):
        html = '<tr><td>1</td><td>SYNTHETIC</td><td></td><td>Processed</td></tr><a href="/nyscef/DocumentList?docketId=synthetic&amp;resultsPageNum=2">Next</a>'
        self.assertIn(URL + '&resultsPageNum=2', parse_html(html, URL)[1])
    def test_complete_browser_bundle_requires_all_observed_pages(self):
        second = URL + '&resultsPageNum=2'; observed = '2026-10-04T00:00:00Z'
        row = lambda number: f'<tr><td>{number}</td><td>SYNTHETIC</td><td></td><td>Processed</td></tr>'
        bundle = {'sourceUrl': URL, 'observedAt': observed, 'pages': [{'url': URL, 'html': row(1), 'pagination': [second]}, {'url': second, 'html': row(2), 'pagination': [URL]}]}
        with tempfile.TemporaryDirectory() as folder:
            root = pathlib.Path(folder); capture = root / 'capture.json'; capture.write_text(json.dumps(bundle))
            result = acquire(URL, root / 'complete', capture, observed, metadata_only=True)
            self.assertEqual(result['status'], 'succeeded'); self.assertEqual(len(result['entries']), 2)
            bundle['pages'].pop(); capture.write_text(json.dumps(bundle))
            self.assertEqual(acquire(URL, root / 'incomplete', capture, observed, metadata_only=True)['status'], 'needs_human')
if __name__ == '__main__': unittest.main()
