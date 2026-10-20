"""Reproducible, path-safe extraction of all XAPK and nested APK members."""
from pathlib import Path, PurePosixPath
import hashlib
import json
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'Sentuh+Tanahku_6.1.5_APKPure.xapk'
DEST = ROOT / 'analysis' / 'unpacked'

def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()

def extract(source, destination):
    destination.mkdir(parents=True, exist_ok=True)
    records = []
    with zipfile.ZipFile(source) as archive:
        bad = archive.testzip()
        if bad:
            raise ValueError(f'CRC mismatch: {bad}')
        for member in archive.infolist():
            name = PurePosixPath(member.filename.replace('\\', '/'))
            if name.is_absolute() or '..' in name.parts or ':' in member.filename:
                raise ValueError(f'Unsafe archive member: {member.filename}')
            target = destination.joinpath(*name.parts)
            if member.is_dir():
                target.mkdir(parents=True, exist_ok=True)
                continue
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(archive.read(member))
            records.append({'path': member.filename, 'bytes': member.file_size,
                            'sha256': digest(target)})
    return {'source': str(source.relative_to(ROOT)), 'sha256': digest(source),
            'destination': str(destination.relative_to(ROOT)), 'files': records}

def main():
    records = [extract(SOURCE, DEST / 'xapk')]
    for apk in sorted((DEST / 'xapk').glob('*.apk')):
        records.append(extract(apk, DEST / 'apk' / apk.stem))
    report = {'source': SOURCE.name, 'archives': records,
              'total_members': sum(len(record['files']) for record in records)}
    (ROOT / 'analysis' / 'extraction-manifest.json').write_text(
        json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps({'archives': len(records), 'members': report['total_members'],
                      'source_sha256': records[0]['sha256']}, indent=2))

if __name__ == '__main__':
    main()
