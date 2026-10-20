# Additional read-adapter static audit

Supplied APK 6.1.5 / 1037 only. No upstream requests. All eight operations below use the initial main client and its normal user-session Authorization flow. Client retrieval intent is established; actual server effects and acceptance remain untested.

| POST endpoint | Call | Encoding | Explicit fields | Response |
|---|---|---|---|---|
| `apis/GetKKPRDetail` | `0xd311e8` | form | `q` | JSON envelope error(bool), data(map) -> gEb |
| `apis/GetPBTElDetail` | `0xd3d134` | form | `q` | JSON envelope error(bool), data(map) -> uGb |
| `apis/GetDocumentType` | `0xd417d4` | form | `q` | JSON envelope error(bool), data.showRoute(int), data.type(String) |
| `apis/GetDocument` | `0xd41ee8` | form | `q`, `name` | HTTP200 List<int> bytes; client saves a scan_*.pdf file |
| `KantorNearby/GetCalendar` | `0xd2127c` | form | `kantorId`, `tahun` | JSON map -> list<FDb> through envelope parser 0x744e44 / closure 0x7452d4 |
| `PlotBidang/GetDetail` | `0xdd980c` | multipart | `id` | JSON envelope error(bool), data(map) -> UQb |
| `PlotBidang/DaftarPlot` | `0xddbb60` | none | No data argument | JSON envelope error(bool), data(list) -> list<WQb> |
| `geotag/GetSuratPernyataanGeotag` | `0xd26d20` | multipart | `geotagId` | HTTP200 List<int> bytes; client saves a scan_*.pdf file |

Main-service linkage is based on FRb construction, explicit repository injection and field flow, not endpoint spelling. Content clones retain the original options/adapter and install LRb. LRb resolves the multipart/form conflict for GetSuratPernyataanGeotag; there is no new declaration submission in that download operation.

Exact IDs or q values must be entered or obtained from an evidenced response/QR source. Do not synthesize identifiers. File downloads can use private browser download links after validating bounded response bytes; original native save/view calls occur after retrieval.

`/apis/VerifyTTE` (`0xd3db70`) remains inspect-only: it uploads an actual file plus q, and its complete file metadata/q provenance have not been bounded here. It is not evidence of an electronic-signature creation flow.

Evidence addresses, scope and route-specific qualifications are in [read-adapter-audit.json](recovered/read-adapter-audit.json). Server requiredness, current acceptance and authorization remain unknown.
