"""Verify every extracted archive member against the recorded SHA-256."""
from pathlib import Path
import argparse
import hashlib
import json

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--manifest', default='analysis/extraction-manifest.json')
args = parser.parse_args()
manifest_path = (root / args.manifest).resolve()
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
errors = []
verified = 0
for archive in manifest['archives']:
    source = root / archive['source']
    with source.open('rb') as stream:
        actual = hashlib.file_digest(stream, 'sha256').hexdigest()
    if actual != archive['sha256']:
        errors.append(str(source))
    for member in archive['files']:
        target = root / archive['destination'] / member['path']
        if not target.is_file():
            errors.append(str(target))
            continue
        with target.open('rb') as stream:
            actual = hashlib.file_digest(stream, 'sha256').hexdigest()
        if actual != member['sha256'] or target.stat().st_size != member['bytes']:
            errors.append(str(target))
        else:
            verified += 1
report = {'archives': len(manifest['archives']), 'verified_members': verified,
          'errors': errors, 'passed': not errors}
(manifest_path.parent / 'extraction-verification.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report, indent=2))
raise SystemExit(1 if errors else 0)
