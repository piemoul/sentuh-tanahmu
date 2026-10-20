"""Check that static contract evidence points to real disassembly locations."""
from pathlib import Path
import json

root = Path(__file__).resolve().parents[1]
inputs = [root / 'analysis/recovered/reviewed-survey-contracts.json',
          root / 'analysis/recovered/admin-request-review.json',
          root / 'analysis/recovered/geotag-coordinate-dataflow.json',
          root / 'analysis/recovered/get-query-semantics.json',
          root / 'analysis/recovered/auth-config-provenance.json',
          root / 'analysis/recovered/transport-boundaries.json',
          root / 'analysis/recovered/client-integrity-audit.json']
merged = root / 'analysis/request-contracts.json'
if merged.is_file():
    inputs.append(merged)
cache = {}
checked = []
errors = []

def walk(value):
    if isinstance(value, list):
        for item in value:
            walk(item)
    elif isinstance(value, dict):
        file = value.get('file') or value.get('path') or value.get('source')
        address = value.get('instruction_address') or value.get('address') or value.get('start')
        if isinstance(file, str):
            file = file.replace('\\', '/')
        if isinstance(file, str) and file.startswith('analysis/') and file.endswith('.asm.txt'):
            source = root / file
            if not source.is_file():
                errors.append({'file': file, 'error': 'missing file'})
            else:
                if file not in cache:
                    cache[file] = source.read_text(encoding='utf-8')
                content = cache[file]
                addresses = ([address] if address else []) + value.get('addresses', [])
                for referenced_address in addresses:
                    normalized = f'0x{int(referenced_address, 16):08x}:'
                    if normalized not in content:
                        errors.append({'file': file, 'address': referenced_address, 'error': 'missing instruction'})
                checked.extend({'file': file, 'address': a} for a in (addresses or [None]))
        for item in value.values():
            walk(item)

for source in inputs:
    walk(json.loads(source.read_text(encoding='utf-8')))
report = {'scope': 'Evidence paths/instruction references only, not semantic or runtime verification',
          'inputs': [str(p.relative_to(root)) for p in inputs],
          'references_checked': len(checked), 'errors': errors, 'passed': not errors}
(root / 'analysis/audit-verification.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report, indent=2))
raise SystemExit(1 if errors else 0)
