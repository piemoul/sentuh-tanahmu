# Antrian transport and managed identity — bounded static audit

The saved APK routes the previously audited queue list/detail through **FRb field `+0xb`, a separate Directus client**, with a bundled bearer configuration. It does not use the main account client at `+7`, or the other queue backend client at `+0xf`. This closes the origin/provenance gap in [QUEUE-FLOW.md](QUEUE-FLOW.md); it does **not** enable an adapter, demonstrate server acceptance, or authorize forwarding main-account credentials to that origin.

Target: `id.go.bpn.sentuh` 6.1.5, ARM64 Dart 3.12.2 `libapp.so`, SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`. Reused existing REA/Blutter evidence; no APK runtime, production request, credential recovery, application edit, backend edit, booking or deletion. Embedded bearer values were neither calculated nor exported.

Evidence: [ledger](recovered/queue-transport-flow.json), [builder](rea/build_queue_transport_flow.py), [validator](rea/verify_queue_transport_flow.py). Validation passes **33 source hashes, 3,032 exact ELF instructions, 72 bounded markers, 5 profile mappings and 6 public pool labels**. Hash checks bind reused metadata and the earlier TLS audit; instruction checks cover the selected queue windows. They establish provenance, not execution or complete transport parity.

## Client binding, URL and headers

`FRb` registration (`0x70b84c`) uses factory `0x70be2c`, which calls constructor `0x6bb2a4`. The constructor stores the Directus client at `+0xb` (`0x6bb478`). Both list (`0xd1eac8`) and detail (`0xd1e0ec`) read that field before calling the shared GET helper.

| Property | Bounded finding | Evidence |
|---|---|---|
| Base configuration | `TRb.HYi` | Constructor `0x6bb360`, initializer `0x6bbc04` |
| Initial environment | `TRb.Thj` initializes to true | `0xca53e0` |
| Initial base URL | `https://aplikasi.atrbpn.go.id/konsol/antrian/directus/` | True branch literal `0x6bbc5c` |
| Alternate base URL | `https://belajar.atrbpn.go.id/konsol/antrian/directus/` | False branch literal `0x6bbc88` |
| Authorization | `Bearer ` plus `TRb.Xhj`, whose initializer resolves bundled `Wxb.rYi → _Xxb.rYi` | `0x6bb380–0x6bb3d4`, `0x6bb9f4–0x6bbc04` |
| User-Agent | `Dart/Flutter` | `0x6bb408–0x6bb418` |

Both environment branches in the bounded `TRb.Xhj` initializer resolve the same bundled configuration field. This is not evidence for using the signed-in user's access token. No bearer value is included in this report, ledger or validator output.

URI builder `0x6bc4a8` receives the request path at `+0x5b` and base URL at `+0x47`. A relative path is concatenated with the base (`0x6bc530`), with slash normalization after the scheme. The queue callers supply `api/antrian/saya` and `'api/antrian/' + fullSelectedId`, respectively. The initial list URL therefore has path `/konsol/antrian/directus/api/antrian/saya`; detail has prefix `/konsol/antrian/directus/api/antrian/`. The constructor's separate `https://antre.atrbpn.go.id/be/api/` literal belongs to `FRb+0xf` and must not be substituted for these reads.

The URI builder serializes the query map through `0x6bc738` (`0x6bc664`) and appends `?` or `&` before URI parsing. Full encoding behavior, including unusual selected IDs and query values, is not established here. Runtime configuration changes and wire URLs were not observed.

## Main-account interceptor and HTTP/TLS provenance

In the bounded constructor, the main account interceptor `LRb` is created/configured through `0x6bb564 → 0x6b7cf0` and appended to the main client interceptor list at `0x6bb580`. The queue client has separate installs at `0x6bb5d0` and `0x6bb628`; the main-account `LRb` installation is not repeated for it. Those other interceptors, their retries and all later mutation paths are not exhaustively audited. Do not assume main-account refresh, form headers or a fresh login token applies to the queue service.

The shared client factory installs adapter `NO` at client field `+0xf` (`0x6b80ac`); allocator tag at `0xcfffd8` agrees with saved `NO` class ID 3762. The adapter request calls `0xd06ebc → 0xd06f0c`, obtains its cached/lazy HTTP client through `0x6d0280`, and the lazy constructor `0x6d034c` calls shared factory `0x6d057c`.

That is the same factory bound by the existing [SPS transport audit](SPS-TRANSPORT-FLOW.md) and [its ledger](recovered/sps-transport-flow.json): current-zone override first, then the process global override; startup installs `eSb`, which constructs the saved APK TLS context and connection callbacks. This establishes **shared construction provenance**. It does not prove that the live queue service requests or requires a client certificate, that the active runtime has unchanged overrides, or that credentials/context may be forwarded from the webapp. This audit changes no TLS setting and expands no credential origin.

## Managed identities and profile merge

The [prior queue audit](QUEUE-FLOW.md) proved `user_antrian` storage records are parsed as `qzb`, and list `nik` is their comma-joined `+0x17` field, not a guessed profile value. Its account-linked callback `0xd1f080` adds these bounded rules:

1. A nonnull `ayb` profile with `userLevel` equal to **2 or 3** enters the profile-merge branch (`0xd1f108/0xd1f120`; Dart tagged integers 4/6). Other levels/null profiles use the saved records branch beginning `0xd1f528`. This is a gate for adding profile identity, **not a universal queue-read prohibition**.
2. The merge branch constructs one `qzb` with `id=0` and `fromUserData=false`. Null profile strings become `''`.
3. Existing serialized records are mapped to `qzb`. The newly constructed profile identity is inserted at index zero only if `isIkd` (`ayb+0x43`) is false (`0xd1f33c–0xd1f35c`). True skips insertion; null reaches a native null assertion. Do not silently treat null as false.
4. The branch maps identities by `qzb.nik` (`0xd1f420 → 0xd1f460`). A later entry replaces the stored value for a duplicate key; exact map-value iteration-order semantics are not separately proved. A profile record inserted first therefore is not guaranteed to override a saved duplicate.
5. The resulting managed identity list supplies the previously proved comma-joined `nik` query. An empty list or empty joined string issues no list GET. The identity editor, all persistence mutations and complete listener timing are outside this audit.

| Profile key (`ayb`) | Source offset | Constructed `qzb` key | Target offset |
|---|---:|---|---:|
| `nama` | `+0x1b` | `nama` | `+0xf` |
| `nomorHp` | `+0x33` | `noHp` | `+0x13` |
| `nomorIdentitas` | `+0x23` | `nik` | `+0x17` |
| `tempatLahir` | `+0x2b` | `tempatLahir` | `+0x1b` |
| `tanggalLahir` | `+0x2f` | `tglLahir` | `+0x1f` |

Date helper `0xd1f670` parses `d MMMM yyyy` using `id_ID`, then formats `yyyy-MM-dd`. Null, empty and exception paths return `''`. Full date parser leniency/timezone semantics are not established. These are schema names and offsets only; no real identity record or NIK was read.

## Remaining boundary and reproduction

The queue route stays disabled. Outstanding work includes the managed-identity UI/persistence lifecycle, full interceptor/redirect/retry/status contract, exact query encoding, approved integration credentials and live service compatibility. Static bundled-token provenance is not a substitute for those integration requirements. Existing list/detail model and rendering gaps remain as recorded in the prior audit.

```powershell
.\tools\runtime\blutter-python\Scripts\python.exe analysis/rea/build_queue_transport_flow.py
.\tools\runtime\blutter-python\Scripts\python.exe analysis/rea/verify_queue_transport_flow.py
```

The builder reads saved local evidence and writes only its ledger. The validator reads the exact ELF and saved artifacts, checks only public selected pool labels, and performs no network calls or embedded-secret decoding.
