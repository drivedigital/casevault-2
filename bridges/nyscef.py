"""Bounded NYSCEF acquisition. Court challenges are a pause, never an empty docket."""
import argparse, datetime, hashlib, json, pathlib, re, sys, urllib.parse, urllib.request, urllib.error
from html.parser import HTMLParser

ORIGIN = 'https://iapps.courts.state.ny.us'
MAX_BYTES = 50 * 1024 * 1024

def court_url(value):
    url = urllib.parse.urlparse(value)
    if url.scheme != 'https' or url.netloc != 'iapps.courts.state.ny.us' or url.path not in ('/nyscef/DocumentList', '/nyscef/ViewDocument'):
        raise ValueError('Only observed NYSCEF docket/document URLs are allowed')
    return value

class CourtRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        court_url(newurl)
        return super().redirect_request(req, fp, code, msg, headers, newurl)

def request(url):
    try:
        return urllib.request.build_opener(CourtRedirect()).open(urllib.request.Request(court_url(url), headers={'User-Agent': 'CaseVault/2 source acquisition'}), timeout=25)
    except urllib.error.HTTPError as error:
        if error.code in (401, 403, 429): raise PermissionError('Court access needs the supervised browser session') from None
        raise

class DocketParser(HTMLParser):
    def __init__(self, base):
        super().__init__(convert_charrefs=True)
        self.base, self.rows, self.pages = base, [], set()
        self.cells, self.parts, self.links, self.in_cell = None, [], [], False
    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if tag == 'tr': self.cells, self.links = [], []
        if tag == 'td' and self.cells is not None: self.in_cell, self.parts = True, []
        if tag in ('br', 'div', 'p') and self.in_cell: self.parts.append('\n')
        if tag == 'a' and attrs.get('href'):
            url = urllib.parse.urljoin(self.base, attrs['href'])
            try: court_url(url)
            except ValueError: return
            parsed = urllib.parse.urlparse(url)
            if parsed.path.endswith('/DocumentList'):
                original = urllib.parse.parse_qs(urllib.parse.urlparse(self.base).query).get('docketId')
                if urllib.parse.parse_qs(parsed.query).get('docketId') == original: self.pages.add(url)
            elif self.in_cell and parsed.path.endswith('/ViewDocument'): self.links.append(url)
    def handle_data(self, text):
        if self.in_cell: self.parts.append(text)
    def handle_endtag(self, tag):
        if tag == 'td' and self.in_cell:
            self.cells.append(re.sub(r'[ \t]+', ' ', ''.join(self.parts)).strip()); self.in_cell = False
        if tag == 'tr' and self.cells:
            if len(self.cells) >= 4 and re.fullmatch(r'\d+', self.cells[0]): self.rows.append({'cells': self.cells, 'links': self.links[:]})
            self.cells = None

def parse_html(html, url):
    if re.search(r'cf-chl-|Just a moment|verify you are human|captcha|Access Denied', html, re.I):
        raise PermissionError('Court challenge requires the supervised browser session')
    parser = DocketParser(url); parser.feed(html)
    if not parser.rows: raise PermissionError('No docket rows were observed; open the exact docket in the supervised browser')
    entries = []
    for row in parser.rows:
        cells = row['cells']; text = '\n'.join(cells)
        date = re.search(r'Filed:\s*(\d\d)/(\d\d)/(\d{4})', text)
        filed = f'{date[3]}-{date[1]}-{date[2]}' if date else None
        availability = 'deleted' if re.search(r'deleted', text, re.I) else 'restricted' if re.search(r'sealed|restricted', text, re.I) else 'public_pdf' if row['links'] else 'metadata_only'
        entries.append({'number': int(cells[0]), 'docType': cells[1].split('\n')[0][:256] or 'Court filing', 'description': cells[1][:20000], 'sourceStatus': cells[3][:2000], 'filedDate': filed, 'sourceUrl': row['links'][0] if row['links'] else None, 'availability': availability})
    return entries, parser.pages

def describe_pdf(path):
    digest = hashlib.sha256()
    with path.open('rb') as source:
        if source.read(5) != b'%PDF-': raise ValueError('Court response was not a PDF')
        source.seek(0)
        while chunk := source.read(1024 * 1024): digest.update(chunk)
    pages = None
    try:
        import pymupdf
        with pymupdf.open(path) as pdf: pages = len(pdf)
    except ImportError: pass
    return {'sha256': digest.hexdigest(), 'filename': path.name, 'bytes': path.stat().st_size, 'pageCount': pages}

def acquire(url, output, snapshot=None, observed_at=None, originals=None, metadata_only=False):
    output.mkdir(parents=True, exist_ok=True)
    observed_at = observed_at or datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00', 'Z')
    manifest = {'version': 1, 'sourceUrl': court_url(url), 'observedAt': observed_at, 'status': 'needs_human', 'message': '', 'entries': [], 'files': []}
    try:
        pending, visited, entries = [url], set(), {}
        bundle = json.loads(snapshot.read_text()) if snapshot and snapshot.suffix == '.json' else None
        saved = {page['url']: page for page in bundle['pages']} if bundle else {}
        if bundle and bundle['sourceUrl'] != url: raise ValueError('Capture bundle does not match the selected docket')
        if bundle and bundle['observedAt'] != observed_at: raise ValueError('Capture observation time does not match')
        while pending:
            current = pending.pop(0)
            if current in visited: continue
            if len(visited) >= 20: raise ValueError('Docket pagination exceeded the acquisition limit')
            visited.add(current)
            if bundle:
                if current not in saved: raise PermissionError('Docket capture is missing an observed page; capture the complete pagination set')
                html = saved[current]['html']
            elif snapshot:
                if len(visited) > 1: raise PermissionError('Saved HTML contains more pages; provide a complete browser capture bundle')
                html = snapshot.read_text()
            else:
                with request(current) as response: raw = response.read(5 * 1024 * 1024 + 1)
                if len(raw) > 5 * 1024 * 1024: raise ValueError('Docket HTML exceeds the acquisition limit')
                html = raw.decode('utf-8', errors='replace')
            parsed, pages = parse_html(html, current)
            if bundle: pages.update(saved[current].get('pagination', []))
            for entry in parsed:
                if entry['number'] in entries and entries[entry['number']] != entry: raise ValueError('Conflicting observations for a filing number')
                entries[entry['number']] = entry
            pending.extend(sorted(pages - visited))
        manifest['entries'] = sorted(entries.values(), key=lambda entry: entry['number'])
        failures = 0; challenge = False
        for entry in manifest['entries']:
            if metadata_only or entry['availability'] != 'public_pdf': continue
            destination = output / f'{entry["number"]:04d}.pdf'
            try:
                candidates = sorted(originals.glob(f'{entry["number"]:03d}_*')) if originals else []
                if candidates:
                    destination = candidates[0]
                else:
                    with request(entry['sourceUrl']) as response, destination.open('wb') as target:
                        if 'text/html' in response.headers.get('Content-Type', ''): raise PermissionError('Court download requires the supervised browser')
                        size = 0
                        while chunk := response.read(1024 * 1024):
                            size += len(chunk)
                            if size > MAX_BYTES: raise ValueError('PDF exceeds the 50 MB limit')
                            target.write(chunk)
                record = describe_pdf(destination)
                manifest['files'].append({'number': entry['number'], 'path': str(destination.resolve()), **record})
            except PermissionError:
                failures += 1; challenge = True
                if not originals: destination.unlink(missing_ok=True)
                break
            except Exception:
                failures += 1
                if not originals: destination.unlink(missing_ok=True)
        manifest['status'] = 'needs_human' if challenge else 'partial' if failures else 'succeeded'
        manifest['message'] = 'Court PDF access needs the supervised browser; remaining downloads were paused.' if challenge else f'{len(entries)} docket entries observed; {len(manifest["files"])} PDFs acquired; {failures} PDF downloads need attention.'
    except PermissionError as error: manifest['message'] = str(error)
    except Exception: manifest['status'], manifest['message'] = 'failed', 'Acquisition failed; inspect the private manifest and retry after resolving access or source layout.'
    (output / 'manifest.json').write_text(json.dumps(manifest, indent=2))
    return manifest

if __name__ == '__main__':
    cli = argparse.ArgumentParser(); cli.add_argument('--url', required=True); cli.add_argument('--output', required=True, type=pathlib.Path); cli.add_argument('--snapshot', type=pathlib.Path); cli.add_argument('--observed-at'); cli.add_argument('--originals', type=pathlib.Path); cli.add_argument('--metadata-only', action='store_true'); args = cli.parse_args()
    if args.snapshot and not args.observed_at: cli.error('--snapshot requires the actual --observed-at capture time')
    result = acquire(args.url, args.output, args.snapshot, args.observed_at, args.originals, args.metadata_only)
    print(json.dumps({'status': result['status'], 'entries': len(result['entries']), 'files': len(result['files']), 'message': result['message']}))
