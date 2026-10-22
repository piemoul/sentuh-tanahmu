# Personal Swaplotting: final wire and post-submit order

This additive offline follow-up uses the original6.1.5 ARM64 ELF (`bbc7f3b…683`). It enables nothing and makes no account, upload, activity, provider, GPS or camera request. Existing reports and receipts remain unchanged. [Ledger](recovered/swaplotting-submit-followup/flow.json) and [verification](recovered/swaplotting-submit-followup/verification.json) pin the ELF, pool, inherited contracts and10 new windows/1,099 exact instructions.

The two personal forms can be implemented as one bounded, separately tested increment. The native shapes are POST `apis/SwaplottingTerdaftar` (15 scalar fields + repeated `file`) and `apis/SwaplottingBelumTerdaftar` (19 scalar fields + repeated `file`). Existing service/multipart ledgers bind all keys, selective trimming, source order and main `FRb+7`/LRb session Authorization. No new application credential or checksum is required by these examined builders.

The later [LOST POST protocol](LOST-REVIEW-POST-PROTOCOL.md) already closes their shared FormData scalar UTF8, raw LF preservation, escaping, MIME stringification, file stream framing, closing `--B--\r\n`, exact length and top-level multipart Content-Type. Its133 source hashes are rechecked here; those facts are reused, not rediscovered. Shared response transformation precedes the Swaplotting services' status test: HTTP200→true, another normally returned status→false, catch→false. The business body is ignored, so true is helper success, not a returned registration/ownership/presence receipt.

## Native result and activity sequence

1. Submit controller awaits upload and clears its busy flag. A null validation result has no result dialog or activity call.
2. False shows **Swaplotting Gagal**, with **OK** in generic hK feedback; it makes no activity, refresh or outer-back call.
3. True **awaits** **Swaplotting Success** in the same feedback dialog (`d9ecb4/d9ecc0`, `da00ac/da00b8`). Its actual visible **OK** binds `846748→7273d8→5f3bbc/4e5ffc`, popping the dialog context. Only after that dialog Future completes does the success callback continue. OK is positively bound; it is not claimed to be the sole dismissal mechanism. There is no second pre-submit confirmation.
4. It reads the then-current form model again, constructs the activity summary, and awaits `d74828` (`d9efa0/d9efac`, `da02d0/da02dc`). Browser snapshots must make any stronger immutability policy explicit.
5. `d74828` awaits `d749a4`'s **POST activity/AddUserActivity**, then ignores its returned bool. Its omitted optional `Zbj` defaults false, causing an awaited **forced GetUserActivity** reload (`d7490c..d7492c`). Ordinary activity-service false still reaches refresh and back. An unexpected controller/refresh throw can prevent the later back; it cannot roll back the upload.
6. Only then does the outer callback invoke common stack-back helper **7257e8** (`d9efd8`, `da0308`). It resolves the current navigator/stack and calls the common pop. No explicit destination route is supplied; a browser target is an adaptation, not proof of dashboard/first-route navigation.

## Exact secondary mutation

`d749a4..d74af8` builds FormData with ordered fields **activityType, contentId, title, subtitle, status** (lowercase wire `subtitle`). It uses repository`+7→FRb+7`, POST wrapper6b9270 and no caller query/options/extra headers. Consequently it uses the same main account session Authorization, multipart framing and response transformation. After transformation HTTP200 is true; another normally returned status or catch is false; business body is ignored.

Both calls supply `activityType="Swaplotting"`, `contentId=""`, `status="sukses"`. Titles are **Swaplotting Tanah Bersertipikat** and **Swaplotting Tanah Belum Bersertipikat**. Null labels become empty; source newlines remain literal:

```text
Registered:   Kantor Pertanahan <office>\nDesa/Kelurahan <region>\n<right label>\nNomor <raw current number>
Unregistered: Kantor Pertanahan <office>\nDesa/Kelurahan <region>\n<current address>
```

The unregistered address is positively loaded from state`+0x2b` at `da0228`, inserted as the third line at `da029c`. [Activity read proof](ACTIVITY-FLOW.md) already closes GET `activity/GetUserActivity`, no caller query/body, HTTP200, optional one String JSON decode, typed `data ?? message` list, and list clearing on failure. Forced=true bypasses its loaded cache. The outer success callback does not require a successful activity refresh result.

Earlier descriptions calling this particular `d74828` invocation device telemetry are refined: its complete controller/service issue AddUserActivity, not `pub/producer`, and contain no device/GPS acquisition. This does not certify all shared interceptor/logger behavior.

## Implementation boundary

Keep the review-owned real photo Blob bytes, current account/profile ownership, legitimate form-selected coordinates and proven reference values. Do not add presence claims, checksum, EXIF, device telemetry, invented IDs or a visit bypass. Coordinate engine text, Android camera output/preset, filename entropy and multipart RNG are declared browser adaptations. A dedicated encoder is needed to preserve raw scalar LF; native browser FormData normalizes it.

No live acceptance, exact engine/OS/TLS behavior, POST redirect compatibility or server idempotency/timeout reconciliation is proven. Use existing scoped main TLS and account transport; do not automatically retry a mutation or reclassify an upload as failed merely because its later activity logging failed. Any activity mutation must be bound to the originating successful upload and dispatched **after** success feedback dismissal. This audit does not enable either upload or activity endpoint.

Run offline verifier: `tools/runtime/blutter-python/Scripts/python.exe analysis/rea/verify_swaplotting_submit_followup.py`.
