# Native certificate date formatting

This bounded offline audit resolves the date-format list and application default locale that were left unknown in `CERTIFICATE-DETAIL-UI.md`. It uses the supplied Sentuh Tanahku 6.1.5 ARM64 `libapp.so`, SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`. It does not claim native runtime testing or an exhaustive accepted-input grammar.

No account data, server requests, authentication changes, GPS changes, or webapp changes were involved.

## Display helper and ordered input formats

Certificate helper `0xd910bc` constructs a DateFormat with `dd MMMM yyyy` at `0xd910e8`, parses the server string through `0xd90ddc`, and formats the result at `0xd91110`. A caught failure returns `-` at `0xd91124`. The UI calls this for `ValidSejak`, `ValidSampai`, and `SuratUkur.BerlakuSejak`; null is handled by their existing caller branches.

The parser lazily reads `WRb._Jhj`, static field offset `0x17c4`, from pool entry `0x30458`. The dedicated metadata exporter resolves its initializer to **`0x89de1c`**. This initializer constructs exactly six formats and places them in the list in this order:

| Order | Configured pattern | Pattern load | Pool entry |
|---|---|---|---|
| 1 | `yyyy-MM-dd'T'HH:mm:ss.SSS'Z'` | `0x89de40` | `0x30478` |
| 2 | `yyyy-MM-dd'T'HH:mm:ssZ` | `0x89de60` | `0x30480` |
| 3 | `yyyy-MM-dd'T'HH:mm:ss` | `0x89de80` | `0x30488` |
| 4 | `M/d/yyyy h:mm:ss a` | `0x89dea0` | `0x30490` |
| 5 | `MM/dd/yyyy HH:mm:ss` | `0x89dec0` | `0x30498` |
| 6 | `yyyy-MM-dd` | `0x89dee0` | `0x20900` |

Array stores `0x89df0c`–`0x89df34` preserve that order; `0x89df50` sets its six-element length. These are **configured alternatives**, not a declaration that every nominal pattern token has full parsing support.

`0xd90ddc` iterates those DateFormat instances. Each attempt calls `0xd90fb4`:

1. `0xd90fe4` passes `true` to `0x72be88`: the strict path. It checks for remaining characters at `0x72bfd4`–`0x72bff8` and performs field verification via `0x72cf58` at `0x72c00c`.
2. A caught format-error class goes through a string transformation dispatch at `0xd91074`–`0xd9107c`, then the secondary parser at `0x89dc2c`. The ASCII string dispatch target is `0xe25e24`, which applies a character lookup table. The exact lookup-table contents were deliberately not exported; full Unicode/case behavior remains unproved here.
3. The secondary parser also checks full consumption (`0x89dd64`–`0x89dd7c`) and verifies fields (`0x89dd88`). If both paths throw, the list iterator advances. The first successful result returns immediately.

Empty input throws `Empty date string`. Exhausting the list throws an unable-to-parse error, which the display helper catches and converts to `-`. The audit has not reproduced all punctuation, whitespace, abbreviated numeric width, or loose-field matching rules, so a short regular expression would not yet prove full native parser parity.

## Locale

The DateFormat constructor `0x6b3790` receives only a pattern at all six initializer calls and in the output helper. The omitted locale argument becomes null at `0x6b37dc`; the constructor resolves it through `0x534258` and stores the selected locale in the formatter.

The resolver obtains its current/default locale through `0x53443c` and `0x53448c`. The latter first considers a zone override, then reads the global slot at field-table byte offset `0x2830` (Dart static field offset `0x1418`). If unset, the surrounding helper can initialize `en_US`.

**Application startup explicitly writes `id_ID` to that same slot**:

```text
0xcfc99c–0xcfc9a0  load pool0xb060: "id_ID"
0xcfc9a4          load field table
0xcfc9a8          store into [field table +0x2830]
0xcfc9ac          call0x70be6c, date symbol/pattern initialization
```

Thus Indonesian is the statically established application default for the ordinary certificate path. It is not inferred merely from the UI language. Zone overrides exist in the library resolver and were not exhaustively excluded across the whole application; the observed global initialization is not a runtime observation of every formatter instance.

## Timezone behavior

Both parse paths construct their date through `0x72c0a0`. At `0x72c244`–`0x72c248`, the builder passes the `false` object as the final boolean to the stored date constructor closure `0x6b3a24`. The closure branches at `0x6b3a40` and takes its local-DateTime constructor path (`0x6b3b04` → `0x6b3b80`). The local constructor passes `false` to the shared constructor at `0x6b3e00`–`0x6b3e0c`; the alternate UTC constructor passes `true` at `0x6b44c8`–`0x6b44d0`.

Consequences:

- The first pattern's **quoted `'Z'` is a literal character**. It does not cause the parser to turn the date into a UTC instant. A web `Date.parse()` conversion can therefore shift the calendar day incorrectly.
- The second pattern's **unquoted `Z` does not establish offset support**. The numeric field parser reaches `0xe226b0`; its `Z` comparison at `0xe22b44`–`0xe22b58` returns without consuming input or applying an offset (`0xe22b5c`–`0xe22b68`). The loose numeric-field wrapper `0xc72b78` calls the same handler. A remaining literal `Z` or numeric offset will then face the full-consumption checks. Do not advertise broad ISO 8601 timezone acceptance based on this pattern's spelling.
- DST correction, unusual years, fractional-second widths, invalid local times, and every loose matching edge case have not been exhaustively executed or proved. The current raw-date display should not be replaced by a browser-local timestamp conversion and described as exact parity.

## Evidence and reproduction

- `analysis/recovered/certificate-date-metadata/certificate-date-initializers.tsv`: one allowlisted field initializer identity; no runtime field value or pool dump.
- `analysis/recovered/certificate-date-flow.json`: machine-readable findings, limitations, and SHA-256 of bounded sources.
- `analysis/rea/export_certificate_date_metadata.cmd`: rebuilds existing Blutter and invokes the dedicated `--certificate-date-metadata` mode. Default Blutter behavior and the earlier UI-getter mode are unchanged.
- `analysis/rea/build_certificate_date_flow.py`: checks the original ELF SHA-256, the one initializer binding, key instruction operands, and **all instruction lines in 18 bounded source ranges** against the ELF. It emits the structured ledger. This verifies retained evidence consistency; it is not a substitute for native functional tests.

Run the validator with `tools/runtime/blutter-python/Scripts/python.exe analysis/rea/build_certificate_date_flow.py` from the workspace root.

The newly established facts are the six configured patterns, order, application locale initialization, local-date constructor choice, and lack of timezone conversion for the relevant `Z` forms. Complete accepted-input parity remains a separate task requiring fuller parser proof or a native differential test oracle.
