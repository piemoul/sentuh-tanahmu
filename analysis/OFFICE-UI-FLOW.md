# Kantor Pertanahan and Kalender Kantor — native UI audit

This is an offline audit of the supplied `id.go.bpn.sentuh` 6.1.5 ARM64 library, SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`. It establishes bounded native UI behavior, not successful server access, emulator execution, browser map integration, or pixel parity. No application code, credentials, location, or production server was accessed by this audit.

The authoritative [UI ledger](recovered/office-ui/office-ui-flow.json) is frozen separately from the [grid follow-up](recovered/office-ui/office-ui-grid-followup.json). The [service/model ledger](recovered/office-services/flow.json) owns request schemas, location acquisition, response models, and calendar office-ID decryption. Early exploratory files without the `office-ui-` prefix are not the canonical proof windows.

## Official entry points

The callbacks match [official-menu-map.json](official-menu-map.json):

| Menu | Callback → route → factory | Widget/state | Init / build |
|---|---|---|---|
| `beranda.informasi.kantor` | `8c2dfc → 8c2e68 → 88fc3c` | `KDb` CID6242 / `_LDb` CID5422 | `7601f0` / `8f256c` |
| `beranda.informasi.kalender` | `8c2cd4 → 8c2d40 → 88fafc` | `DDb` CID6243 / `_EDb` CID5423 | `75f704` / `8eee98` |

Both use shared navigation/telemetry machinery. Absence of a local account check in these bounded callbacks does not establish server authentication policy.

## Kantor Pertanahan

The native screen combines a map with a nearby-office list. It uses shared controller `JDb`, reuses its nonempty office-list subject, and subscribes to updates. Its map-ready callback `8f5410` invokes nearby initialization `d215c4` at `8f54d0`. This menu's bounded chain does not use the separate `legacy/Kantah` picker API.

Search is local `namaKantor.toLowerCase().contains(query.toLowerCase())`: no trim, address search, request, or local sorting. The service audit names the model field `namaKantor`; the earlier frozen UI ledger abbreviates the same NDb offset `+0xb` as `nama`. This is a naming correction, not a second response field. The official menu supplies an empty initial filter set. Selected facilities combine **AND**, each requiring the exact integer `1`:

| Set value | Label | NDb field |
|---|---|---|
| 1 | Peralihan Elektronik | `statusPeralihanEl` at `+0x27` |
| 2 | Antrian Daring | `statusAntrian` at `+0x1f` |
| 3 | Anjungan Pencetakan Sertipikat | `statusKiosk` at `+0x2f` |

Name filtering precedes facility filtering; both preserve input order. The captured list builders impose no application pagination or local row cap. Rows show `namaKantor`, `alamat`, and the original `jarak` followed by literal ` Km`; the row builder does not round or calculate distance. The three facility indicators use the same integer comparisons.

Initial **map camera** constants are latitude `-0.792918`, longitude `116.482347`, zoom `4.4746`, with hybrid map type. These are not a demonstrated substitute for device coordinates in nearby requests. Native location/provider/permission behavior is covered separately; the delayed permission callback also contains a settings dialog.

Clicking a row retains the original NDb object, shows its marker InfoWindow/custom overlay, moves the camera, and publishes selection to `JDb+0x27` at `da5bd0`. The marker uses the original office ID. The overlay shows the office name and three facilities; its close button and map tap hide it. No phone/email action, favorite mutation, directions URL, or calendar navigation occurs in this bounded overlay.

## Kalender Kantor

The page title is **Kalender Kantor Pertanahan**, with heading **Kalender Jadwal Pelayanan & Hari Libur**. It initializes `DateTime.now` and a month-indexed PageController. Header formatting is `yMMM` with the default locale; weekday labels are explicitly `Sen Sel Rab Kam Jum Sab Mgg`, with red weekend headings.

The inline `IDb` office selector (CID5939, build `a39954`) prefers a nonempty shared office cache, otherwise the current nearby-list snapshot. If no selected value exists and offices are available, it selects the first original row. An existing shared selection is retained. No profile-favorite fallback appears in this bounded selector; another screen could have set shared selection previously. Defensive option code moves a null-ID row first and disables it, but the service's typed NDb parser requires a nonnull String ID and creates no such sentinel.

Office selection and captured year-refresh paths call helper `760034` on the selected office's ID **before** `d210d4`. The service audit establishes this as base64/AES-128-CBC/PKCS7 decryption followed by UTF-8 decoding. Consequently the raw encrypted nearby-list ID and calendar request `kantorId` are distinct. Embedded material is redacted in this UI proof. The year is the displayed date's year converted to a String; users do not type an ID or year in the native screen.

Month pages range from the current month through December of the current year. Previous/next controls animate the page; callbacks reject or snap back outside those bounds. There is no unrestricted year selector. A changed requested year triggers a read for the selected office; changing office always requests the display year. The captured `da4c78` async closure returns null and does not itself trigger refresh.

The [grid follow-up](recovered/office-ui/office-ui-grid-followup.json) traces `HDb` CID5940 build `a397d4` and grouping closure `de7c48..de81a8`. It iterates all calendar rows, skips null/invalid dates, filters displayed month/year, and groups by parsed DateTime. There is **no event-type filter** in this loop. The day cell checks whether any map key matches the calendar day. In-month event dates use red text (`#f44336`), except today's foreground remains normal. Today has theme-colored background at alpha `0.15`; outside-month text uses foreground alpha `0.5`. No event dot/count widget or day-click action is established: the captured InkWell is supplied only its child.

The separate monthly description list at `8f2278` has no extra section heading. It retains only rows with nonnull `tanggal`, `tipeLiburId` exactly String `"2"`, and parsed month/year equal to the display month/year. If a date contains `T`, it uses `DateTime.parse`; otherwise `DateFormat("yyyy-MM-dd").parse`. Invalid rows are excluded. The list sorts ascending by parsed DateTime; equal-date stability is not proved.

Each description row formats the date as `d MMMM` with locale `id_ID`, and displays `keterangan ?? "Tidak ada keterangan"`; empty strings remain empty. The date-format exception fallback is `Tanggal tidak valid`. Empty source and empty month display `Tidak ada data kalender tersedia` and `Tidak ada data kalender untuk bulan ini`, respectively. Busy state shows progress. No row-detail navigation or submission callback appears in these builders.

## Reproduction and limits

Run the retained-environment verifiers from the workspace:

```powershell
& tools/runtime/blutter-python/Scripts/python.exe analysis/rea/verify_office_ui.py
& tools/runtime/blutter-python/Scripts/python.exe analysis/rea/verify_office_ui_grid.py
```

The main verifier passed: **21 source hashes, 10,543 exact nonoverlapping ELF instructions, 188 decisive markers, 19 dispatch entries, 720 pool annotations including 45 literal references, 9 dependency hashes, 5 constant objects, and 2 menu callbacks**. The separate follow-up passed: **3 source hashes, 443 exact ELF instructions, 8 decisive markers, 1 dispatch entry, and 4 dependency hashes**. Its new instruction windows do not overlap the main canonical windows. These are static proof counts, not runtime tests or successful requests.

Browser integration still needs independent verification for native hybrid map tiles, camera/InfoWindow behavior, location permission/provider settings, and native/browser date parsing, timezone, Unicode case conversion, and equal-date sorting. This audit makes no claim that geotag submission, physical presence, or account mutations have been tested or enabled.
