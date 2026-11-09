#!/usr/bin/env python3
"""Read-only checks for this planning baseline; no third-party dependencies."""
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
from urllib.parse import unquote

root = Path(__file__).resolve().parents[1]
errors = []
links = 0
for doc in [root / 'README.md', *sorted((root / 'docs/planning').glob('*.md'))]:
    for raw in re.findall(r'\[[^\]]*\]\(([^)]+)\)', doc.read_text()):
        target = raw.split('#', 1)[0]
        if not target or re.match(r'^[a-z]+:', target):
            continue
        links += 1
        if not (doc.parent / unquote(target)).resolve().exists():
            errors.append(f'{doc.relative_to(root)}: missing link {raw}')
manifest = json.loads((root / 'docs/planning/source-manifest.json').read_text())
source = Path(manifest['source_root'])
paths = [entry['path'] for entry in manifest['files']]
if len(paths) != len(set(paths)):
    errors.append('Source manifest contains duplicate paths')
if source.is_dir():
    head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=source, text=True).strip()
    if head != manifest['source_commit']:
        errors.append(f'Source revision changed: expected {manifest["source_commit"]}, got {head}')
    for entry in manifest['files']:
        relative = Path(entry['path'])
        if relative.is_absolute() or '..' in relative.parts:
            errors.append(f'Invalid source path: {relative}')
            continue
        path = source / relative
        if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest() != entry['sha256']:
            errors.append(f'Source file missing or changed: {relative}')
    print(f'Checked {len(paths)} source hashes and pinned source revision')
else:
    print('Source checkout unavailable; source hashes/revision NOT checked')
print(f'Checked {links} local Markdown links')
if errors:
    print('\n'.join(errors), file=sys.stderr)
    sys.exit(1)
print('Available planning checks passed')
