# Native Profile: Hubungi Kami

This is an offline REA v26 audit of the public Contact subtree in the pinned APK. It does not execute the APK, open a destination, contact anyone, or change the webapp. Existing native ledgers remain untouched.

The canonical [ledger](recovered/profile-contact-followup/flow.json) is SHA-256 `5bd785e004d135ffac1a1cd396f1b3e2bc7b6611d0584a902aa4e3cb303d41c3`. The independent [verifier](rea/verify_profile_contact_followup.py) compares nine bounded source ranges and 1,264 instructions directly with ELF `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`, checks 69 pool bindings against pool `871487859dabdd17e109645a1e788098c6f168a44d4dce9626136ed558502e04`, and binds class metadata, dispatch, allocator headers and three asset hashes. Its frozen result is [verification.json](recovered/profile-contact-followup/verification.json).

## Entry and content

Profile entry `0x93c768` records the native instrumentation label `klik menu pusat bantuan`, then continuation `0x93c7d4` pushes builder `0x93c840`. That builder resolves `DI<JRb>` and allocates `KHb` at `0xdb96c4`. The allocation header proves class ID 5920; dispatch index `4096 + 5920 + 48657 = 58673` resolves its complete build to `0xa43724..0xa44060`. `KHb` is a stateless `sK` with no declared instance fields. No dedicated Contact state, profile fetch, account eligibility, sensor permission or backend operation is present in this bounded subtree. Parent Profile menu visibility is a separate scope.

The page order is:

1. App bar **Hubungi Kami**.
2. The shipped `assets/anim/email.json` animation.
3. Centered copy: `Kami siap bantu kamu dengan sepenuh hati, nih!` followed by `Tersedia hanya di hari dan jam kerja, ya!` on the next line.
4. A service/complaints card: `Apresiasi atau keluhan Layanan Pertanahan? Hubungi hotline WhatsApp kami dibawah ini`, then **WhatsApp**.
5. A technical-support card: `Kendala teknis Sentuh Tanahku? Chat via WhatsApp atau email kami, ya!`, then **Email**, then **WhatsApp**.

The ordered children are bound at `0xa43eac..0xa43ed8`; the technical card's Email-before-WhatsApp order is `0xa43dc8..0xa43de8`. Outer padding is 16 logical pixels. The hero's wrapper width is screen width × 0.6 (`0xa437a0..0xa437a8`, store `+0xf` at `0xa43808`); its height is not explicitly set. Gap heights use the wrapper's separate `+0x13` slot, including 32 at `0xa438a8..0xa438b0`. Intro/card paragraph sizes are 14, card corner radius 12, paragraph inset top 12/bottom 8, and contact image width/height 20. The body wraps the ordered content in a scrollable widget. Inherited palette/font theme and responsive browser reflow are not established by this audit.

## Exact public destinations

| Position | Label | Native binding and helper | Destination |
| --- | --- | --- | --- |
| Service/complaints | WhatsApp | `a43a44 → a44198 → a44204 → dea954` | `https://wa.me/6281110680000?text=` plus encoded fixed message |
| Technical support | Email | `a43cf0 → a440fc → a44168 → dea81c` | `mailto:sentuh@atrbpn.go.id` with fixed subject/body |
| Technical support | WhatsApp | `a43d78 → a44060 → a440cc → dea700` | `https://wa.me/6281110106889?text=` plus encoded fixed message |

The ministry WhatsApp message is `Halo admin Kementerian ATR/BPN, saya punya pertanyaan nih, bisa bantu jelasin tentang ...`. The technical WhatsApp message is `Halo tim Support Sentuh Tanahku, saya punya pertanyaan nih, bisa bantu jelasin tentang ...`.

Both WhatsApp helpers pass the fixed message through `0x76e07c..0x76e0b8`, calling shared URI encoder `0x42ded4` with mask 2, codec from `pp+0xc50`, and `spaceToPlus=false`. They concatenate the encoded result with the fixed `wa.me` prefix, parse the URI using `0x439100`, await `canLaunch` (`0xd2a3a8`), then launch (`0xd2a0fc`) with explicit `externalApplication`. If `canLaunch` is false they throw `Could not launch <canonical URI>` (`0xdea7e0..0xdea810`, `0xdeaa34..0xdeaa64`). This is native construction evidence, not a live WhatsApp acceptance test or a proof of arbitrary Unicode codec equivalence.

Email construction passes these exact fixed arguments to URI constructor `0x42acd0` at `0xdea840..0xdea86c`:

- Scheme: `mailto`.
- Path: `sentuh@atrbpn.go.id`.
- Raw query: `subject=Pertanyaan Sentuh Tanahku&body=Halo Tim Support Sentuh Tanahku. Perkenalkan Saya <Nama Anda>, saya punya pertanyaan nih tentang ...`.

`<Nama Anda>` is literal text; no account name is interpolated. The canonical URI is parsed, `canLaunch` is awaited, then launch is called without a mode override (wrapper default `platformDefault`). A failed `canLaunch` prints a diagnostic through `0x457f84`; this path does not build a page failure banner. The launcher uses channel `plugins.flutter.io/url_launcher`, method `canLaunch`; external application enums are bound in the pool and native wrapper.

All three Contact button callbacks use the instrumentation label `klik menu email`, including WhatsApp callbacks. Each instrumentation continuation starts its asynchronous launcher and returns null. No page busy, cancel or disabled-state transition is established. A browser hyperlink activated by the user, an unsupported-handler message, and static animation fallback are explicit browser/platform adaptations. Never auto-open the destinations or send a message during testing.

## Actual shipped assets

| Native asset | Bytes | SHA-256 |
| --- | ---: | --- |
| `assets/anim/email.json` | 80,093 | `3074af509be78bbc1e3a226a8ef6db7aa6f5e1073758615061671ac19e41a526` |
| `assets/images/hubungikami/whatsapp.png` | 30,559 | `92dbd9610c5bf463746836b0d71372422e54cf121e95581afb34622662acc024` |
| `assets/images/hubungikami/email.png` | 17,553 | `b1064ea2b0f16a72a3533b0975147dd6a798fe272a51e14a72e87930833abaac` |

The assets live under `analysis/unpacked/apk/id.go.bpn.sentuh/assets/flutter_assets/`. The animation is 1000×1000, 25 fps, frames 0–200, with no external assets. Both PNG sources are 512×512 and are rendered at 20×20 by the native page. The complete bounded build binds exactly those three asset keys. The package also contains `hubungi_kami.png`, ministry/social logos and other contact images; their presence does not bind them to this page. No social, address, telephone-call or map action should be invented from that inventory.

## Boundaries

No browser, APK, device, email, call, WhatsApp, provider or production request was made. A public contact constant is not evidence that the handler currently accepts a message or that the channel is staffed. URI runtime/OS launch behavior and inherited native visual theme remain untested. This subtree requires no new backend proxy or credentials. The separate BERKAS inline-map question remains unresolved and is not closed by this Contact proof.
