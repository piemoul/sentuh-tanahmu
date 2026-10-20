# Bhumi public use and browser integration

Checked against official ATR/BPN pages on 19 October 2026. This note makes no account, accepts no terms and sends no credentials.

- [Official Bhumi Koleksi guide](https://bhumi.atrbpn.go.id/bantuan/fitur_koleksi) directs the user to sign in with their own Sentuh Tanahku account for collections. It does not describe a separate public developer-account registration flow.
- [Official overlay guide](https://bhumi.atrbpn.go.id/panduan/tata_cara_overlay) explains adding a file or an external WMS service into the Bhumi viewer. That is an inbound overlay feature, not documentation of issuing a Bhumi WMS API key to third-party apps.
- [ATR/BPN public-access article, 16 October 2026](https://www.atrbpn.go.id/berita/mengenal-bhumi-atrbpn-cara-menelusuri-informasi-pertanahan-lewat-peta-digital) describes Bhumi as available to the public for exploring land/spatial information. It does not establish API entitlement for an external client.

No official public API-key issuance procedure was found in this bounded documentation check. This is not a claim that no integration arrangement exists. An ordinary account and public viewer access alone do not prove that a particular service token will work from this webapp.

The supplied APK independently proves an authenticated main-client token GET and separate WMS tile requests; see [BERKAS-MAP-FOLLOWUP](BERKAS-MAP-FOLLOWUP.md). The dedicated WMS token and authkey must remain in the backend if implemented. The user already has a Sentuh Tanahku account; a new account is not needed for the existing collection login described above.

Current acceptance boundary: own-account Antrian/Panggilan reads have passed, while the WMS token endpoint and actual cadastral tiles have not yet been tested through this reconstruction. These are separate services and must have separate receipts.
