# SPS metadata binding review

The selected Berkasku identifier is correctly bound in the reviewed native and webapp flow. Native code calls **GET `Dokumen/GetSpsDokumen`** with the single query key **`dokumenid`**, whose value is the **original selected `EAb.berkasId`**. It sends no request body and no `tipeKantorId` field. No identifier decrypt, trim, split, or replacement is present in this captured binding; ordinary URI query serialization is separate.

The native chain is row parser `0x708160` → selected-row callback `0xd94220` → controller `0xd94798` → SPS service `0xd94a18`. The controller saves the original ID at stack `-0x80`, reloads it at `0xd94908`, and calls the service at `0xd94910`. The service stores that unchanged value under `dokumenid` at `0xd94a80`, then invokes the shared GET wrapper at `0xd94aac`. It does not substitute the primary detail response's ID.

In `webapp/app.js`, `berkasDetailTarget` and `loadBerkasDetail` retain that original selected ID; `loadBerkasSection` supplies `{dokumenid: berkasId}`. Operation `get-dokumen-getspsdokumen-d94aac` is configured as GET, main service, session authentication, and query encoding. The calendar decoder is scoped to `/KantorNearby/GetCalendar` and is irrelevant to this request. A local browser POST to `/api/execute` does not change the upstream GET method.

The preceding offline review matched **four source hashes** against the frozen ledger and **17 explicit instructions** against bytes from the pinned ARM64 ELF (SHA256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`). These results are persisted in [the machine-readable report](webapp/sps-metadata-binding-review.json), including every address, expected/actual instruction, and exact source path/hash. This persistence step does not rerun tests. It does not claim that every instruction in the four windows was independently checked.

**The complete historical BERKAS verifier is not passing.** Its prior run stopped at the hash assertion for `analysis/recovered/request-callsites/range-006bbe60.asm.txt`, outside those four core windows:

- Frozen expected SHA256: `057615f021387f68e60aa7466446b739d47bf17dc7acedab49b49896e1469ab9`.
- Current SHA256: `75d47b42385904ffc999c70968332dbd7b1ae12ff78b3f45e06ae4afb834d192`.

That mismatch remains unresolved and no historical hash was rebaselined. The bounded selected-ID chain is supported independently; it does not certify the entire historical ledger.

Empty SPS results apply only to the account records actually tested by the parent task. This review establishes no global SPS availability conclusion and makes no new production request. It retains no account identifiers or credentials and does not repeat the PDF download/viewer audit.

Implementation snapshot: `webapp/app.js` SHA256 `717f612e568ed5720727681d423a79ea791cb34a71cbeca2505a757b78bc045d`.
