# Certificate date parser: uppercase literal restriction

This additive clarification closes an important distinction left at handler level in `CERTIFICATE-DATE-PARSER-BOUNDS.md`: a loose literal handler permitting omission does **not** prove that a complete ISO-like input containing uppercase `T` will succeed after strict parsing fails. Earlier evidence and reports remain unchanged.

The native quoted-field factory at `0x6b2f68` calls constructor `0x6b2fb0`. That constructor stores the full quoted pattern at object offset `0x13`, calls quote patcher `0x6b308c`, stores its result at offset `7` (`0x6b3014`), and calls `0x447974`, storing that result at offset `0xf` (`0x6b3058`). The quote patcher removes surrounding quotes and handles doubled apostrophes. Neither this constructor nor the patcher performs lowercase conversion.

`0x447974` obtains leading/trailing trim indexes using `0x43b3c8` and `0x43b5f4`. It returns the original string or a substring through `0x42bd24`; it does not rewrite characters. Thus the native literal derived from `'T'` remains uppercase `T`. The separately retained loose literal handler `0xc7298c` loads offset `0xf` and compares it with the next input substring using exact string equality.

The top-level strict-failure fallback transforms the **input** before calling the loose parser (`0xd91060`–`0xd91088`). Therefore, after the input becomes lowercase, an existing `T` becomes `t`. The loose literal comparison with stored `T` fails; optional omission leaves that `t` unconsumed. The subsequent hour digit matcher then fails at `t`. Omitting the literal is different from leaving its lowercase character present.

This explains why these complete strings cannot be promoted to accepted inputs based on the optional-literal handler:

- `2026-10-20T13:24:35.123` fails the first pattern's strict quoted `Z` requirement. Its loose retry reaches the lowercase `t` mismatch. The other configured alternatives do not consume its fractional suffix.
- `2026-10-20T13 24 35` fails strict colon matching. Loose retries still encounter the lowercase `t` mismatch before the numeric hour field.

The restriction does not affect a nominal uppercase-`T` input whose strict parsing already succeeds. It also does not prove that every input omitting `T` succeeds: the remaining numeric fields, separators, complete-input check, and date verification still decide the result.

The locally acquired official `intl` 0.20.2 source has the same relevant implementation: `_DateFormatField` initializes `_trimmedPattern` with `pattern.trim()`; `_DateFormatQuotedField` applies `_patchQuotes`; `parseLiteralLoose` compares `_trimmedPattern` exactly; `DateFormat.parseLoose` lowercases the input after a failed strict parse. This is a focused algorithm correspondence, not identification of the native package release or proof of native runtime execution.

New ELF-bound ranges are under `analysis/recovered/certificate-date-literal-case/`. The constructor range includes later date-format tokenizer/default-format functions; only the constructor and quote-patcher ranges identified above support the case claim. No webapp runtime, test expectation, earlier receipt, credential, GPS, or server behavior was changed by this followup.
