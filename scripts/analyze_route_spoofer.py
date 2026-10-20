"""Offline inventory of the user-supplied Route Spoofer XAPK; no APK execution."""
import collections
import json
from pathlib import Path

import analyze_artifact as analyzer
from unpack import extract

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "Route+Spoofer_1.1.8_APKPure.xapk"
DEST = ROOT / "analysis/route-spoofer/unpacked"
OUT = ROOT / "analysis/route-spoofer/recovered"


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    records = [extract(SOURCE, DEST / "xapk")]
    for apk in sorted((DEST / "xapk").glob("*.apk")):
        records.append(extract(apk, DEST / "apk" / apk.stem))
    manifest_path = DEST / "xapk/manifest.json"
    metadata = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    package = metadata.get("package_name")
    base = DEST / "apk" / package if package else None
    if not base or not base.exists():
        bases = [p for p in (DEST / "apk").iterdir() if list(p.glob("*.dex"))]
        if len(bases) != 1: raise ValueError("Cannot unambiguously identify base APK")
        base = bases[0]
    analyzer.UNPACKED = DEST
    analyzer.OUT = OUT
    analyzer.BASE = base
    analyzer.manifests()
    classes = analyzer.analyze_dex()
    analyzer.resource_tables()
    inventory = {"source": SOURCE.name, "archives": records,
                 "total_members": sum(len(r["files"]) for r in records)}
    (OUT.parent / "extraction-manifest.json").write_text(json.dumps(inventory, indent=2), encoding="utf-8")
    assets = [{"path": p.relative_to(ROOT).as_posix(), "bytes": p.stat().st_size}
              for p in sorted(base.rglob("*")) if p.is_file() and ("assets" in p.parts or "lib" in p.parts)]
    (OUT / "assets-and-native-libraries.json").write_text(json.dumps(assets, indent=2), encoding="utf-8")
    keywords = ["mock", "spoof", "accuracy", "accurate", "location", "gps", "latitude", "longitude", "permission", "developer", "gnss", "route", "speed", "altitude"]
    candidates = []
    for path in sorted(OUT.glob("*-strings.redacted.jsonl")):
        with path.open(encoding="utf-8") as file:
            for line in file:
                row = json.loads(line)
                if any(k in row["text"].lower() for k in keywords) and len(row["text"]) < 2000:
                    candidates.append({"source": path.name, **row})
    (OUT / "location-string-candidates.json").write_text(json.dumps(candidates, indent=2, ensure_ascii=False), encoding="utf-8")
    summary = {"metadata": metadata, "base_apk": base.name, "apk_count": len(records) - 1,
               "members": inventory["total_members"], "dex_classes": classes,
               "asset_and_native_files": len(assets), "location_string_candidates": len(candidates),
               "sha256": records[0]["sha256"]}
    (OUT / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps({k: v for k, v in summary.items() if k != "metadata"}))


if __name__ == "__main__": main()
