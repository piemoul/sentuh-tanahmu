"""Export an explicit source allowlist into the isolated publication clone.

Never traverses APKs, tools, environment, recovered artifacts, live logs or sessions.
The original workspace is left intact. Git staging/push are separate actions.
"""
from pathlib import Path
import hashlib
import json
import shutil

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'environment' / 'publish' / 'sentuh-tanahmu'
assert TARGET.resolve().is_relative_to((ROOT / 'environment' / 'publish').resolve())
assert (TARGET / '.git').is_dir(), 'Clone the explicitly requested repository first'
config = (TARGET / '.git' / 'config').read_text(encoding='utf-8')
assert 'https://github.com/piemoul/sentuh-tanahmu.git' in config

selected = []
for name in ['README.md', 'DOCKER.md', 'Dockerfile', 'compose.yaml', '.dockerignore', '.gitignore', '.env.example', 'START-WEBAPP.cmd']:
    selected.append(ROOT / name)
selected += [p for p in (ROOT / 'webapp').rglob('*') if p.is_file() and not {'node_modules', 'test-results', '__pycache__'}.intersection(p.relative_to(ROOT).parts)]
selected += [p for p in (ROOT / 'scripts').iterdir() if p.is_file() and p.suffix in {'.ps1', '.py', '.mjs', '.cmd'}]
selected += list((ROOT / 'analysis').glob('*.md'))
selected += [ROOT / 'analysis' / name for name in ['official-menu-map.json', 'request-contracts.json', 'request-contracts.md', 'request-fields.csv']]
selected += list((ROOT / 'analysis' / 'rea').glob('review*.mjs'))
selected += [ROOT / 'analysis' / 'rea' / name for name in ['build_webapp_coverage.mjs', 'verify_collection_save_activity_backend.mjs', 'verify_collection_save_activity_regressions.mjs']]
selected += [ROOT / 'analysis' / 'webapp' / name for name in ['collection-save-activity-baseline.json', 'collection-save-activity-backend-tests.json', 'collection-save-activity-backend-tests.txt', 'collection-save-activity-regressions.json']]

records = []
for source in sorted(set(selected)):
    assert source.is_file(), source
    relative = source.relative_to(ROOT)
    assert source.suffix.lower() not in {'.xapk', '.apk', '.so', '.p12', '.pfx', '.jks', '.key', '.pem', '.pyc'}
    assert '.env' not in relative.parts
    destination = TARGET / relative
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, destination)
    records.append({'file': relative.as_posix(), 'sha256': hashlib.sha256(source.read_bytes()).hexdigest()})

manifest = {'schemaVersion': 1, 'purpose': 'Explicit source-only publication allowlist; no APK, recovered credentials, live account data or local environment.', 'files': records}
(TARGET / 'docs').mkdir(exist_ok=True)
(TARGET / 'docs' / 'SOURCE-MANIFEST.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'filesCopied': len(records), 'target': str(TARGET)}))
