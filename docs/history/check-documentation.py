"""Read-only integrity check for the 2026-10-04 documentation migration.

Run from any directory. No services are contacted and no files are modified.
"""
from pathlib import Path
from urllib.parse import unquote, urlsplit
import hashlib
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[2]
DOCS = ROOT / 'docs'
ARCHIVE = DOCS / 'history/archive/2026-10-04'
BASELINE = json.loads((DOCS / 'history/baseline-2026-10-04.json').read_text())
errors = []
counts = {'archived_markdown': 0, 'preserved_artifacts': 0,
          'removed_clutter': 0, 'protected_non_documentation_files': 0,
          'active_markdown_files': 0, 'local_links': 0, 'mapped_sections': 0}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest() if path.is_file() else None


def outside_fences(text):
    lines = []
    fence = None
    for line in text.splitlines():
        marker = re.match(r'^\s*(`{3,}|~{3,})', line)
        if marker:
            char = marker.group(1)[0]
            if fence is None:
                fence = char
            elif fence == char:
                fence = None
            continue
        if fence is None:
            lines.append(line)
    return '\n'.join(lines)


def heading_anchors(text):
    result = []
    seen = {}
    for heading in re.findall(r'^#{1,6}\s+(.+?)\s*#*$', outside_fences(text), re.M):
        heading = re.sub(r'\[([^]]+)\]\([^)]*\)', r'\1', heading)
        stem = re.sub(r'[^\w\- ]', '', heading.lower()).replace(' ', '-')
        number = seen.get(stem, 0)
        seen[stem] = number + 1
        result.append(stem + (f'-{number}' if number else ''))
    return result


source_map = (DOCS / 'history/source-map.md').read_text()
for item in BASELINE['files']:
    original = ROOT / item['path']
    rel = original.relative_to(DOCS)
    if f'| `{rel.as_posix()}` | `{item["sha256"]}` |' not in source_map:
        errors.append(f'Missing source-map inventory: {rel}')
    disposition = item['disposition']
    if disposition == 'archive-and-relocate':
        archived = ARCHIVE / rel
        if digest(archived) != item['sha256']:
            errors.append(f'Archived original changed: {rel}')
        else:
            counts['archived_markdown'] += 1
            for anchor in heading_anchors(archived.read_text()):
                target = f'archive/2026-10-04/{rel.as_posix()}#{anchor}'
                if f']({target})' not in source_map:
                    errors.append(f'Missing section mapping: {rel}#{anchor}')
                counts['mapped_sections'] += 1
        if not original.is_file() or 'Documentation relocated' not in original.read_text():
            errors.append(f'Missing relocation notice: {rel}')
    elif disposition == 'preserve-in-place':
        if digest(original) != item['sha256']:
            errors.append(f'Preserved artifact changed: {rel}')
        else:
            counts['preserved_artifacts'] += 1
    elif disposition == 'remove-clutter':
        if original.exists():
            errors.append(f'Clutter remains: {rel}')
        else:
            counts['removed_clutter'] += 1

for rel, expected in BASELINE['protectedNonDocumentationFiles'].items():
    if digest(ROOT / rel) != expected:
        errors.append(f'Non-documentation file changed since baseline: {rel}')
    else:
        counts['protected_non_documentation_files'] += 1

active = [ROOT / 'README.md'] + sorted(p for p in DOCS.rglob('*.md') if ARCHIVE not in p.parents)
anchor_cache = {}
for page in active:
    counts['active_markdown_files'] += 1
    text = outside_fences(page.read_text())
    for target in re.findall(r'\]\(([^)\n]+)\)', text):
        target = target.strip().strip('<>')
        parts = urlsplit(target)
        if parts.scheme or parts.netloc:
            continue
        counts['local_links'] += 1
        dest = (page.parent / unquote(parts.path)).resolve() if parts.path else page
        if not dest.exists():
            errors.append(f'Broken local link in {page.relative_to(ROOT)}: {target}')
            continue
        if parts.fragment and dest.suffix == '.md':
            if dest not in anchor_cache:
                body = dest.read_text()
                anchor_cache[dest] = set(heading_anchors(body)) | set(re.findall(r'<a\s+id="([^"]+)"', body))
            if unquote(parts.fragment) not in anchor_cache[dest]:
                errors.append(f'Broken anchor in {page.relative_to(ROOT)}: {target}')

result = {'date': '2026-10-04', 'baselineCommit': BASELINE['commit'],
          'status': 'passed' if not errors else 'failed', 'checks': counts,
          'errors': errors,
          'scope': 'Local documentation integrity only; no application tests, builds or live checks.'}
print(json.dumps(result, indent=2))
sys.exit(bool(errors))
