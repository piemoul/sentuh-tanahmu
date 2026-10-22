"""Export an explicit source allowlist into the isolated publication clone.

Never traverses APKs, tools, environment, recovered artifacts, live logs or sessions.
The original workspace is left intact. Git staging/push are separate actions.
"""
from pathlib import Path
import hashlib
import json
import os
import re
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

# Publication overlays describe the source-only checkout rather than the
# private analysis workspace. Preserve them on repeated exports; record both
# hashes so these differences remain explicit and reviewable.
overlays = {'README.md', '.gitignore', 'webapp/tests/run-portable.mjs'}
forbidden_suffixes = {'.xapk', '.apk', '.so', '.dex', '.p12', '.pfx', '.jks', '.key', '.pem', '.pyc', '.log'}

records = []
for source in sorted(set(selected)):
    assert source.is_file(), source
    relative = source.relative_to(ROOT)
    assert not source.is_symlink(), source
    assert source.suffix.lower() not in forbidden_suffixes
    assert all(not part.startswith('.env') for part in relative.parts) or relative.as_posix() == '.env.example'
    destination = TARGET / relative
    assert destination.resolve().is_relative_to(TARGET.resolve())
    assert not destination.is_symlink(), destination
    destination.parent.mkdir(parents=True, exist_ok=True)
    overlay = relative.as_posix() in overlays and destination.is_file()
    if not overlay:
        shutil.copyfile(source, destination)
        if source.suffix.lower() == '.md':
            text = source.read_text(encoding='utf-8')
            prefix = ROOT.as_posix() + '/'
            text = re.sub(r'\]\(' + re.escape(prefix) + r'([^\)]+)\)',
                          lambda match: '](' + Path(os.path.relpath(match[1], relative.parent)).as_posix() + ')', text)
            for prefix in [str(ROOT).replace('\\', '\\\\'), str(ROOT), ROOT.as_posix()]:
                text = text.replace(prefix, '<repository-root>')
            destination.write_text(text, encoding='utf-8', newline='\n')
    workspace_hash = hashlib.sha256(source.read_bytes()).hexdigest()
    published_hash = hashlib.sha256(destination.read_bytes()).hexdigest()
    records.append({
        'file': relative.as_posix(),
        'workspaceSha256': workspace_hash,
        'publishedSha256': published_hash,
        'publicationOverlay': overlay or workspace_hash != published_hash,
        'copyPolicy': 'preserved publication overlay' if overlay else 'relative documentation links and LF' if source.suffix.lower() == '.md' else 'exact bytes',
    })

manifest = {'schemaVersion': 3, 'purpose': 'Explicit source-only publication allowlist; no APK, recovered credentials, live account data or local environment. Publication-only README, ignore rules and portable runner are hash-disclosed overlays.', 'files': records}
(TARGET / 'docs').mkdir(exist_ok=True)
(TARGET / 'docs' / 'SOURCE-MANIFEST.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'filesCopied': len(records), 'target': str(TARGET)}))
