"""Independently verify known-wrapper BL calls using raw AArch64 encoding."""
from pathlib import Path
from collections import Counter
import hashlib
import json
import struct
from elftools.elf.elffile import ELFFile

root = Path(__file__).resolve().parents[1]
source = root / 'analysis/unpacked/apk/config.arm64_v8a/lib/arm64-v8a/libapp.so'
index = json.loads((root / 'analysis/recovered/http-callsite-audit/index.json').read_text())
wrappers = {0x6b9270: 'POST', 0x6fced8: 'POST', 0x7017a4: 'GET'}
with source.open('rb') as stream:
    elf = ELFFile(stream)
    section = elf.get_section_by_name('.text')
    data = section.data()
    base = section['sh_addr']
observed = {}
for offset in range(0, len(data) - 3, 4):
    instruction = struct.unpack_from('<I', data, offset)[0]
    if instruction & 0xFC000000 != 0x94000000:
        continue
    immediate = instruction & 0x03FFFFFF
    if immediate & (1 << 25):
        immediate -= 1 << 26
    address = base + offset
    target = address + immediate * 4
    if target in wrappers:
        observed[address] = {'target': target, 'method': wrappers[target]}
recorded = {int(ref['call_address'], 16): ref for ref in index['references']}
errors = []
if len(recorded) != len(index['references']):
    errors.append('Duplicate indexed call addresses')
for address in sorted(observed.keys() | recorded.keys()):
    expected = observed.get(address)
    retained = recorded.get(address)
    if expected is None or retained is None:
        errors.append(f'Callset mismatch at {address:#x}')
    elif expected['target'] != int(retained['wrapper_address'], 16) or expected['method'] != retained['http_method']:
        errors.append(f'Target/method mismatch at {address:#x}')
with source.open('rb') as stream:
    sha256 = hashlib.file_digest(stream, 'sha256').hexdigest()
report = {'scope': 'Raw AArch64 BL encoding verification of calls to three known wrappers; indirect calls and other wrappers excluded',
          'source_sha256': sha256, 'known_wrappers': {hex(k): v for k, v in wrappers.items()},
          'call_count': len(observed), 'calls_by_method': dict(Counter(v['method'] for v in observed.values())),
          'errors': errors, 'passed': not errors}
(root / 'analysis/http-callsite-verification.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report, indent=2))
raise SystemExit(1 if errors else 0)
