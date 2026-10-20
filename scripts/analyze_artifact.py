"""Static, offline inventory of the supplied Sentuh Tanahku APK splits.

Does not execute the Android binaries, connect to endpoints, or authenticate.
Run with environment/python/Scripts/python.exe scripts/analyze_artifact.py.
"""
from __future__ import annotations

import collections
import hashlib
import io
import json
import logging
import re
import sqlite3
import struct
from pathlib import Path
from urllib.parse import urlsplit

from elftools.elf.elffile import ELFFile
from lxml import etree
from PIL import Image
from pyaxmlparser.axmlprinter import AXMLPrinter
from pyaxmlparser.arscparser import ARSCParser

ROOT = Path(__file__).resolve().parents[1]
UNPACKED = ROOT / "analysis/unpacked"
OUT = ROOT / "analysis/recovered"
BASE = UNPACKED / "apk/id.go.bpn.sentuh"
ASSETS = BASE / "assets/flutter_assets"
LIB = UNPACKED / "apk/config.arm64_v8a/lib/arm64-v8a/libapp.so"
ANDROID = "{http://schemas.android.com/apk/res/android}"
logging.disable(logging.WARNING)


def save(name, value):
    (OUT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")


def relative(path):
    return path.relative_to(ROOT).as_posix()


def redact(text):
    # Public structural names remain; probable credentials and opaque payloads do not.
    text = re.sub(r"AIza[A-Za-z0-9_\-]{25,}", "[REDACTED_GOOGLE_API_KEY]", text)
    text = re.sub(r"eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+", "[REDACTED_JWT]", text)
    text = re.sub(r"(?i)([?&](?:key|token|secret|password|signature|client_secret)=)[^&#\s]+", r"\1[REDACTED]", text)
    text = re.sub(r"(?i)(?:[A-Z0-9+/]{80,}={0,2})", "[REDACTED_LONG_OPAQUE_STRING]", text)
    return text


class Codec:
    """Read Flutter StandardMessageCodec used by AssetManifest.bin."""
    def __init__(self, data):
        self.data, self.pos = data, 0

    def take(self, count):
        result = self.data[self.pos:self.pos + count]
        self.pos += count
        if len(result) != count:
            raise ValueError("Truncated StandardMessageCodec value")
        return result

    def align(self, n):
        self.pos = (self.pos + n - 1) // n * n

    def size(self):
        first = self.take(1)[0]
        return struct.unpack("<H", self.take(2))[0] if first == 254 else struct.unpack("<I", self.take(4))[0] if first == 255 else first

    def read(self):
        kind = self.take(1)[0]
        if kind == 0: return None
        if kind == 1: return True
        if kind == 2: return False
        if kind in (3, 4): return struct.unpack("<i" if kind == 3 else "<q", self.take(4 if kind == 3 else 8))[0]
        if kind in (5, 7): return self.take(self.size()).decode("utf-8")
        if kind == 6:
            self.align(8)
            return struct.unpack("<d", self.take(8))[0]
        if kind == 8: return list(self.take(self.size()))
        if kind == 12: return [self.read() for _ in range(self.size())]
        if kind == 13: return {self.read(): self.read() for _ in range(self.size())}
        raise ValueError(f"Unsupported codec tag {kind} at {self.pos - 1}")


def inventory_assets():
    files, colors = [], collections.Counter()
    for path in sorted(ASSETS.rglob("*")):
        if not path.is_file(): continue
        entry = {"path": relative(path), "asset": path.relative_to(ASSETS).as_posix(), "bytes": path.stat().st_size,
                 "sha256": hashlib.sha256(path.read_bytes()).hexdigest()}
        if path.suffix.lower() in (".png", ".gif", ".webp"):
            with Image.open(path) as im:
                entry.update(width=im.width, height=im.height, mode=im.mode)
        if path.suffix == ".svg":
            content = path.read_text(encoding="utf-8")
            colors.update(c.upper() for c in re.findall(r"#[0-9a-fA-F]{6}\b", content))
            svg = etree.fromstring(content.encode())
            entry["svg"] = dict(svg.attrib)
        files.append(entry)
    save("assets.json", files)
    save("svg-colors.json", colors.most_common())
    save("font-manifest.json", json.loads((ASSETS / "FontManifest.json").read_text()))
    codec = Codec((ASSETS / "AssetManifest.bin").read_bytes())
    manifest = codec.read()
    if codec.pos != len(codec.data): raise ValueError("Trailing AssetManifest bytes")
    save("asset-manifest.json", manifest)
    cert = json.loads((ASSETS / "assets/json/sertipikat.json").read_text())
    save("certificate-schema.json", {"source": relative(ASSETS / "assets/json/sertipikat.json"),
        "fields": {k: type(v).__name__ for k, v in cert.items()},
        "note_fields": sorted({key for row in cert.get("catatan", []) for key in row}),
        "safe_summary": {"jenisHak": cert["jenisHak"], "luas": cert["luas"], "location_region": "Denpasar, Bali",
                         "owner_category": "Indonesian government", "notes_count": len(cert["catatan"])},
        "warning": "Packaged example only, not a live record. Opaque IDs, document numbers and staff identifiers intentionally omitted."})
    return len(files), len(manifest)


def manifests():
    summaries = []
    for path in sorted((UNPACKED / "apk").glob("*/AndroidManifest.xml")):
        xml = AXMLPrinter(path.read_bytes()).get_xml_obj()
        metadata = []
        for node in xml.iter("meta-data"):
            name = node.get(ANDROID + "name", "")
            value = node.get(ANDROID + "value", "")
            if any(s in name.lower() for s in ["key", "token", "secret"]):
                node.set(ANDROID + "value", "[REDACTED]")
                value = "[REDACTED]"
            metadata.append({"name": name, "value": redact(value)})
        decoded = etree.tostring(xml, encoding="unicode", pretty_print=True)
        (OUT / f"manifest-{path.parent.name}.xml").write_text(redact(decoded), encoding="utf-8")
        component_filters = []
        application = xml.find("application")
        if application is not None:
            for component in application:
                for intent in component.findall("intent-filter"):
                    component_filters.append({"component": component.get(ANDROID + "name"),
                        "component_type": component.tag, "exported": component.get(ANDROID + "exported"),
                        "actions": [x.get(ANDROID + "name") for x in intent.findall("action")],
                        "categories": [x.get(ANDROID + "name") for x in intent.findall("category")],
                        "data": [dict(x.attrib) for x in intent.findall("data")]})
        query_intents = []
        queries = xml.find("queries")
        if queries is not None:
            for intent in queries.findall("intent"):
                query_intents.append({"actions": [x.get(ANDROID + "name") for x in intent.findall("action")],
                    "categories": [x.get(ANDROID + "name") for x in intent.findall("category")],
                    "data": [dict(x.attrib) for x in intent.findall("data")]})
        summaries.append({"apk": path.parent.name, "root": dict(xml.attrib),
            "sdk": [dict(x.attrib) for x in xml.iter("uses-sdk")],
            "permissions": [x.get(ANDROID + "name") for x in xml.iter("uses-permission")],
            "activities": [dict(x.attrib) for x in xml.iter("activity")],
            "metadata": metadata,
            "component_intent_filters": component_filters,
            "inbound_deep_link_candidates": [item for item in component_filters
                if item["component_type"] in ("activity", "activity-alias") and "android.intent.action.VIEW" in item["actions"]
                and item["data"]],
            "outbound_package_visibility_query_intents": query_intents})
    save("manifest-summary.json", summaries)


def analyze_aot():
    data = LIB.read_bytes()
    elf = ELFFile(io.BytesIO(data))
    sections = [{"name": s.name, "type": s["sh_type"], "offset": s["sh_offset"], "size": s["sh_size"],
                 "address": hex(s["sh_addr"])} for s in elf.iter_sections()]
    symbols = []
    for section in elf.iter_sections():
        if hasattr(section, "iter_symbols"):
            symbols.extend({"name": s.name, "address": hex(s["st_value"]), "size": s["st_size"]} for s in section.iter_symbols() if s.name)
    save("elf.json", {"path": relative(LIB), "sha256": hashlib.sha256(data).hexdigest(),
        "machine": elf["e_machine"], "class": elf.elfclass, "little_endian": elf.little_endian,
        "entry": elf["e_entry"], "sections": sections, "symbols": symbols})
    sections_by_offset = sorted(sections, key=lambda s: s["offset"])
    strings = []
    for match in re.finditer(rb"[\x20-\x7e]{4,}", data):
        value = match.group().decode("ascii")
        section = next((s for s in sections_by_offset if s["offset"] <= match.start() < s["offset"] + s["size"]), None)
        strings.append({"offset": hex(match.start()), "section": section["name"] if section else None, "text": redact(value)})
    with (OUT / "aot-strings.redacted.jsonl").open("w", encoding="utf-8") as file:
        for row in strings: file.write(json.dumps(row, ensure_ascii=False) + "\n")
    sources = [s for s in strings if re.search(r"package:.*\.dart|\.dart(?:$|[^a-z])", s["text"])]
    routes = [s for s in strings if re.fullmatch(r"/[a-zA-Z][a-zA-Z0-9_/-]{1,100}", s["text"])]
    urls = [s for s in strings if re.search(r"https?://", s["text"])]
    application = [s for s in strings if re.search(r"(?i)(tanah|sertipikat|sertifikat|berkas|layanan|antrian|antrean|pengumuman|swaplot|plotting|pemohon|permohonan|pertanahan|biaya|pnbp|kantor|syarat|dokumen|nik|ktp|hak milik|pendaftaran|penduduk|masuk|keluar|lupa kata|kata sandi|akun|notifikasi|verifikasi|pengukuran|ukur bidang|pengaduan|hubungi|riwayat|lokasi|estimasi)", s["text"])
                   and len(s["text"]) < 3000]
    save("dart-source-references.json", sources)
    save("route-candidates.json", routes)
    save("url-candidates.redacted.json", urls)
    save("application-strings.json", application)
    prefixes = {"apis", "api", "TanyaJawab", "account", "berkas", "Pin", "Bhumi", "announcement", "activity",
                "Collection", "collection", "PlotBidang", "legacy", "Legacy", "common", "PeruriLivenessSdk",
                "RatingPPAT", "kiosk", "Dokumen", "geotag", "review", "auth", "kantornearby", "InfoLayanan",
                "Berkas", "fcm", "Youtube", "LokasiBidang", "Mitra", "expapi", "items", "Akta", "Berita",
                "ikdv2", "Map", "dokumen", "Brankas", "KKPR", "KantorNearby", "SubyekSosial", "Pengumuman"}
    endpoints = [s for s in strings if s["text"].lstrip("/").split("/")[0] in prefixes
                 and re.fullmatch(r"/?[A-Za-z][A-Za-z0-9_/-]*[A-Za-z0-9_/?=&.-]*", s["text"])
                 and "/" in s["text"] and len(s["text"]) < 180]
    save("endpoint-candidates.json", endpoints)
    save("screen-route-candidates.json", [s for s in routes if re.search(r"Page$|Screen$|^/contract_survey$|^/survey_nilai_tanah_main$|^/FormSurveiLingkunganZonasi$", s["text"])])
    curate_evidence(strings)
    sql = []
    database = sqlite3.connect(":memory:")
    for i, row in enumerate(strings):
        if re.search(r"(?i)CREATE TABLE (?:key_value_store|migration_status|offline_berkas|geotag_drafts)", row["text"]):
            start = int(row["offset"], 16)
            end = data.index(b")", start) + 1
            statement = data[start:end].decode("ascii")
            table = re.search(r"CREATE TABLE (\w+)", statement, flags=re.I).group(1)
            database.execute(statement)
            columns = [dict(zip(["cid", "name", "type", "notnull", "default", "pk"], c))
                       for c in database.execute(f"PRAGMA table_info({table})")]
            sql.append({"offset": row["offset"], "end_offset_exclusive": hex(end), "source": relative(LIB),
                        "table": table, "sha256": hashlib.sha256(data[start:end]).hexdigest(),
                        "sql": statement, "sqlite_validated": True, "columns": columns})
    database.close()
    save("sqlite-schemas.json", sql)
    (OUT / "offline-schemas.sql").write_text("\n\n".join(
        f"-- Exact SQL bytes from {entry['source']} at {entry['offset']}..{entry['end_offset_exclusive']} (end exclusive).\n"
        f"-- Statement delimiter added for standalone execution; no application data extracted.\n{entry['sql']};"
        for entry in sql) + "\n", encoding="utf-8")
    return len(strings), len(application), len(sources), len(routes)


def curate_evidence(strings):
    by_text = {s["text"]: s for s in strings}
    features = [
        ("navigation", "Navigasi utama", ["Beranda", "Berkasku", "Sertipikatku", "Aktivitas", "Akun"], "Local browser navigation; ordering/layout not recovered from strings."),
        ("certificate", "Sertipikat", ["Sertipikat Elektronik", "Sertipikat Analog", "Sertipikat Dibagikan", "Brankas/DetailSertipikatNew", "Legacy/SertifikatTanahNew"], "Sanitized local fixture; live ownership and document retrieval require an authorized service."),
        ("file_search", "Berkas dan pencarian", ["Cari Berkas", "Nomor Berkas", "Perjalanan Berkas", "/berkas/CariBerkas", "Berkas/GetBerkas"], "Local search/status timeline over fictional fixtures; real results remain server-owned."),
        ("services", "Info layanan", ["Info Layanan", "Persyaratan", "InfoLayanan/GetInfoLayanan", "InfoLayanan/GetInfoLayananDetail?id="], "Local service catalog with source labels; full requirements were not bundled."),
        ("fees", "Simulasi biaya", ["Simulasi Biaya", "Luas Tanah (m2)", "Nilai Per Meter (Rp)", "InfoLayanan/SimulasiTipe1", "InfoLayanan/SimulasiTipe6"], "Offline demonstration calculator must explicitly distinguish its invented inputs/formula from official tariffs."),
        ("queue", "Antrian daring", ["Antrian Daring", "Ambil Antrian", "Antrian Saat Ini", "api/antrian", "api/booking/"], "Local ticket simulation only; no real booking or queue position."),
        ("announcements", "Pengumuman", ["Pengumuman", "Pengumuman Yuridis", "Sertipikat Hilang", "Pengumuman/GetPengumuman?limit=5"], "Fictional/local cards; no claim these are current government announcements."),
        ("map", "Lokasi bidang dan swaplotting", ["Lokasi Bidang Tanah", "Swaplotting Tanah Bersertipikat", "Swaplotting Tanah Belum Bersertipikat", "/apis/SwaplottingTerdaftar", "/apis/SwaplottingBelumTerdaftar"], "Local coordinate/polygon sketch; official parcels/tiles and submissions require backend integration."),
        ("offline", "Berkas offline dan geotag", ["Berkas Diunduh", "Penandaan Lokasi Offline ", "geotag/GetGeotagList", "geotag/UploadGeotag"], "Browser persistence can mirror recovered schemas, with user-selected image/coordinates and no automatic upload."),
        ("offices", "Kantor dan kalender", ["KantorNearby/GetCalendar", "kantornearby/getkantornearby", "account/AddKantorFavorit", "account/DeleteKantorFavorit"], "Local office favorites/calendar fixtures; distance requires a chosen location."),
        ("sharing", "Bagikan dokumen dan koleksi", ["Bagikan Akses ke Sertipikat Ini", "legacy/BagiSertifikat", "berkas/BagikanBerkas", "collection/GetUserCollection"], "Local collections/bookmarks; official document sharing remains unimplemented without authorized API."),
        ("account", "Akun dan identitas", ["Akun dan Keamanan", "Verifikasi Akun", "auth/signin", "auth/signup", "account/account_summary"], "Local demo session only; no official credentials, NIK or biometric collection."),
        ("ikd", "Verifikasi IKD dan liveness", ["Identitas Kependudukan Digital", "ikdv2/signinIKD", "PeruriLivenessSdk/VerificateUser", "/LivenessPage"], "Native/third-party identity service boundary; describe as integration-required."),
        ("documents", "Dokumen, scan dan TTE", ["Dokumen Elektronik", "apis/scanDocument", "/apis/VerifyTTE", "apis/GetDocumentType"], "File preview is local; official QR/document validation and TTE checks require service."),
        ("kkpr", "KKPR", ["Informasi KKPR", "KKPR/GetKKPRList?nomorIdentitas=", "apis/GetKKPRDetail"], "Local information/demo only; real permissions are backend records."),
        ("deeds", "Akta dan hak terkait", ["Akta/GetAktaList?nik=", "Hak Tanggungan", "legacy/GetSertipikatHT", "Legacy/GetSertipikatWakaf"], "Schema/API naming evidence; account-bound records not recovered."),
        ("partners", "Mitra pertanahan", ["Pejabat Pembuat Akta Tanah (PPAT)", "Mitra/GetPPATList?kantorId=", "Mitra/GetSurveyorList?wilayahId=", "Mitra/GetPenilaiList"], "Static directory fixtures; no real contact/rating submission."),
        ("surveys", "Survei nilai tanah", ["Survei Nilai Tanah", "Survei Nilai Tanah Pertanian", "Survei Nilai Tanah Non-Pertanian", "Survei Biaya Bangunan", "/FormSurveiLingkunganZonasi"], "Local forms/drafts can be reconstructed from field labels; scoring/formulas and submission contracts unproven."),
        ("support", "Tanya berkas dan ulasan", ["Tanya Berkas", "TanyaJawab/SubmitPertanyaan", "RatingPPAT/PostRatingPPAT", "berkas/postratingberkas"], "Local feedback draft only; no support message sent."),
        ("activity", "Aktivitas dan notifikasi", ["Notifikasi", "activity/GetUserActivity", "api/notifikasi", "fcm/opt_in"], "Browser-local activity; production push registration is a native/service boundary."),
    ]
    ledger = []
    for key, title, texts, mapping in features:
        missing = [text for text in texts if text not in by_text]
        if missing: raise ValueError(f"Missing curated evidence for {key}: {missing}")
        ledger.append({"id": key, "feature": title, "source": relative(LIB), "evidence": [by_text[t] for t in texts],
                       "confidence": "Presence of these strings is confirmed; exact runtime flow is not established by string extraction.",
                       "browser_migration": mapping})
    save("feature-evidence-ledger.json", ledger)
    rule_texts = ["Latitude harus antara -90 sampai 90", "Longitude harus antara -180 sampai 180", "Format harus: latitude,longitude",
                  "NIK harus 16 digit", "Password harus minimal 12 karakter, pakai huruf besar, huruf kecil, angka, dan karakter spesial, ya!",
                  "Wah, maksimal cuma boleh ambil 4 antrian per hari di tiap kantor, nih! Ini biar semua kebagian ngantri dan pelayanan tetap lancar, ya.",
                  "Maksimal 5 foto", "Harap tambah minimal 1 bidang tanah."]
    save("validation-evidence.json", [{"source": relative(LIB), **by_text[t],
         "scope": "Recovered message; proves intended UI rule, not complete enforcement or applicability to every form."} for t in rule_texts])


def analyze_dex():
    inventories = []
    plugins = []
    for path in sorted(BASE.glob("*.dex")):
        data = path.read_bytes()
        if not data.startswith(b"dex\n"): raise ValueError("Invalid DEX magic")
        count, table = struct.unpack_from("<II", data, 0x38)
        strings = []
        for i in range(count):
            offset = struct.unpack_from("<I", data, table + 4 * i)[0]
            pos, shift, utf16_length = offset, 0, 0
            while True:
                byte = data[pos]; pos += 1
                utf16_length |= (byte & 0x7f) << shift
                if not byte & 0x80: break
                shift += 7
            end = data.index(0, pos)
            # DEX MUTF-8 encodes a null as C0 80 and may encode surrogate pairs.
            text = data[pos:end].replace(b"\xc0\x80", b"\x00").decode("utf-8", errors="replace")
            strings.append({"index": i, "offset": hex(pos), "utf16_length": utf16_length, "text": redact(text)})
            if text.startswith("Error registering plugin "):
                plugin, native_class = text.removeprefix("Error registering plugin ").split(", ", 1)
                plugins.append({"plugin": plugin, "native_class": native_class, "offset": hex(pos), "source": relative(path),
                                "evidence": "GeneratedPluginRegistrant error string; presence does not prove the plugin is invoked on every app path."})
        with (OUT / f"{path.stem}-strings.redacted.jsonl").open("w", encoding="utf-8") as file:
            for row in strings: file.write(json.dumps(row, ensure_ascii=False) + "\n")
        type_count, type_table = struct.unpack_from("<II", data, 0x40)
        class_count, class_table = struct.unpack_from("<II", data, 0x60)
        types = [struct.unpack_from("<I", data, type_table + 4 * i)[0] for i in range(type_count)]
        classes = []
        for i in range(class_count):
            type_index = struct.unpack_from("<I", data, class_table + 32 * i)[0]
            classes.append(strings[types[type_index]]["text"])
        inventories.append({"path": relative(path), "version": data[4:7].decode(), "bytes": len(data),
                            "sha256": hashlib.sha256(data).hexdigest(), "strings": count,
                            "classes": class_count, "methods": struct.unpack_from("<I", data, 0x58)[0],
                            "class_descriptors": classes})
    save("dex-inventory.json", inventories)
    save("native-plugin-boundaries.json", plugins)
    return sum(x["classes"] for x in inventories)


def resource_tables():
    result = []
    for path in sorted((UNPACKED / "apk").glob("*/resources.arsc")):
        parsed = ARSCParser(path.read_bytes())
        packages = []
        for package in parsed.get_packages_names():
            locales = []
            for locale in parsed.get_locales(package):
                xml = parsed.get_string_resources(package, locale)
                root = etree.fromstring(xml)
                for node in root:
                    if any(s in node.get("name", "").lower() for s in ["key", "token", "secret", "sender_id", "app_id"]):
                        node.text = "[REDACTED_CONFIGURATION]"
                    elif node.text:
                        node.text = redact(node.text)
                safe_locale = locale.replace("\x00", "") or "default"
                (OUT / f"resources-{path.parent.name}-{safe_locale}.xml").write_text(etree.tostring(root, encoding="unicode", pretty_print=True), encoding="utf-8")
                locales.append({"locale": safe_locale, "types": parsed.get_types(package, locale), "string_count": len(root)})
            packages.append({"package": package, "locales": locales})
        result.append({"apk": path.parent.name, "packages": packages,
                       "parser_note": "pyaxmlparser may report reserved resource-field warnings on recent Android ARSC; extracted strings are an inventory, not a resource-table round trip."})
    save("resource-tables.json", result)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    manifests()
    asset_count, manifest_count = inventory_assets()
    strings, app_strings, sources, routes = analyze_aot()
    dex_classes = analyze_dex()
    resource_tables()
    summary = {"assets": asset_count, "logical_assets": manifest_count, "ascii_strings": strings,
               "application_string_candidates": app_strings, "source_reference_candidates": sources,
               "route_candidates": routes, "dex_classes": dex_classes, "output": relative(OUT)}
    save("summary.json", summary)
    print(json.dumps(summary))


if __name__ == "__main__": main()
