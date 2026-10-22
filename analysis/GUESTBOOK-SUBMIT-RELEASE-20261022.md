# Buku Tamu — final Simpan delivery, 22 October 2026 UTC

The Buku Tamu QR lookup → nine personal fields → explicit **Simpan** → native success/known-error interpretation is implemented and deployed. This is one bounded feature release, **not completion of all-menu parity or official-server acceptance**.

Preview: <https://sentuh.davay.space/#/account>. Local: <http://localhost:4173/#/account>.

## Result and original APK evidence

The matching Sentuh Tanahku 6.1.5 ELF/pool proof closes 8,792 unique instructions across the retained guestbook UI, standalone service, response transformer and final submit paths. See [native contract](GUESTBOOK-SUBMIT-FOLLOWUP-20261022.md), [flow ledger](recovered/guestbook-submit-followup-20261022/flow.json) and [independent verifier](rea/verify_guestbook_submit_followup_20261022.py). This is static evidence; no new original-APK execution is claimed.

The fixed standalone POST uses application authentication and exactly these ordered multipart parts:

`kantorId, unitKerjaId, userId, nik, alamat, namaLengkap, tempatLahir, tanggalLahir, noTelp, email, instansi, keperluan`.

The first three values come from the exact prior QR lookup held by the backend, not caller-provided office/user IDs. The nine form strings retain their original whitespace, UTF-8 and LF; DOB remains raw text. Null lookup IDs become empty scalar parts. No extra GPS, file, checksum or caller authentication fields are added.

After the shared response transformer completes, native HTTP 200 maps to `error:false`, including a valid JSON body containing `error:true`; other returned 2xx statuses map to `error:true`. This client result does not establish officer verification, a visitor card or proof of physical arrival. Known 201 keeps the form silently; successful 200 shows **Terimakasih / Buku Tamu Sudah Terisi / Kembali**.

## Browser adaptations and limits

- Only explicit Simpan dispatches a write. Pending writes lock all nine fields and QR controls. No automatic retry is introduced.
- A ready context expires after ten minutes. Pending/accepted/unknown duplicate guards bind the business identity and survive fresh QR reads during the session; at most 256 guards are retained.
- An uncertain result after handoff preserves the draft, locks retry and directs the user to check with the office. Validation/context failures identify `not_sent` separately.
- Navigation and account rotation discard private form ownership; old completions cannot restore the form or invalidate a newer account session.
- Kembali resets to a fresh QR entry on the same browser route. The exact native named stack destination remains unclosed, so this is a documented adaptation.
- Native numeric keyboard/formatter configuration was recovered. Its full IME execution and truncation units remain unclosed; the browser does not invent digit stripping or claim formatter parity. The inherited local JSON request bound is 256 KiB, with separate bounded standalone request/response handling.
- A legitimate office-issued QR is still required. No fake office QR, physical-presence claim, GPS visit/proximity waiver or integrity bypass is implemented.

## Validation and delivery

| Evidence | Verified scope |
| --- | --- |
| [Full Node receipt](webapp/guestbook-submit-node-final-corrected.json) | **2,520/2,520**, 149 test files, 227 test/helper sources, 141 authored runtime files; zero failure/skip/cancellation/todo or input drift |
| [Browser summary](webapp/guestbook-submit-browser-summary-final.json) | **14 checks**, including 11 functional DOM groups and 156 observations; actual frozen app/handler/clients, synthetic accounts/QR/transports |
| [Transport receipt](webapp/guestbook-submit-browser-transport-initial.json) | 36 local requests, 14 injected lookup GETs and 11 injected POSTs; exact twelve-part body and original lookup-context provenance |
| [Isolated image proof](webapp/guestbook-submit-image-final.json) | 136 matching files; nonroot, read-only, network disabled, hash entrypoint only; old serving process unchanged |
| [Deployment proof](webapp/guestbook-submit-deployment-final.json) | **136 container files, 89 localhost assets, 89 strict-HTTPS assets**, 47 backend files; healthy, one replacement, 13 read-only mounts and existing security preserved |

The catalog remains 176 records, with **94 enabled: 74 reads and 20 writes**. Only `post-bukutamu-d99dd8` changes in this release. The geotag upload and final queue booking gates remain disabled.

Browser cases include local invalid-field rejection; escaped literal office/form markup; status-only 200 success; 201 draft retention followed by an explicit same-context retry; pending double-click protection; malformed JSON and dropped-response uncertainty; same-business-identity replay rejection after a fresh lookup; TTL expiry without upstream dispatch; navigation during a held request; late 401 after synthetic account rotation; null lookup; null IDs; redacted public versus original private lookup IDs; empty, non-JSON and arbitrary valid JSON 200 bodies. Desktop width 1280 and mobile width 390 remained horizontally contained. Console, unhandled rejection and CSP observations were empty.

Oversized/truncated response modes and malformed/held lookup modes were not executed in the browser; broader synthetic Node coverage is recorded separately. Permissions Policy denied camera/microphone/geolocation access; hardware attempts were not instrumented. No real BPN submission, OTP, FCM or visit was performed by this fixture. The fixture stopped gracefully and its listener closed.

Three driver diagnostics, including four incorrectly labelled observations, are retained and explained in the browser summary. They do not establish guard behavior or a product failure. Actual replay proof links drop request177/call178 to same-identity reread189/call190 and rejected request196, with no new injected POST. Two initial Node attempts are retained: a verifier counter error before the suite, then an obsolete disabled-writer assertion. Exact historical migrations retain all test definitions/assertions and add 25 assertions across 24 changed old files; 196 old test/helper sources remain byte-identical.

## Preview handoff and remaining work

The new container is `2e8d477686a54aa65fe3af270173da5805eb6815f08a332d3ce25f4bedc24003`, started `2026-10-22T06:12:50.56668999Z`. The one required backend replacement ended the old in-memory session. Preview was reloaded once and left at the login form with no open dialog; see [sanitized handoff](webapp/guestbook-submit-preview-handoff-final.json). No credentials or private document values are recorded there.

Official acceptance of a real office QR/arrival is **untested**. All-menu 1:1 parity remains incomplete, including the separately audited Tanya Berkas writer, selected document sharing/download and inline map bindings, identity/OTP/device-bound flows, and final booking without genuine browser FCM. Prior Android emulator failures are not promoted to successful APK end-to-end coverage.

Visuals below show synthetic local tests only. The earlier four screenshots that scrolled to the helper panel are retained as diagnostics and excluded from visual proof.

![Synthetic desktop form](webapp/guestbook-submit-desktop-form-visible.jpg)

![Synthetic desktop success](webapp/guestbook-submit-desktop-success-visible.jpg)

![Synthetic mobile success](webapp/guestbook-submit-mobile-success-visible.jpg)
