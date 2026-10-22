// Native6.1.5 profile base: field_table[0x2fd8/8], independently pinned by
// profile-base-followup/flow.json 2b2e3d29…; suffixes inherited from native
// profile-destinations-followup/flow.json a96bd738…. Public links only.
const destinations=Object.freeze({
 benefits:Object.freeze({label:'Keuntungan Pakai Sentuh Tanahku',nativeTitle:'Website',description:'Buka informasi manfaat aplikasi pada situs ATR/BPN.',linkLabel:'Manfaat aplikasi',url:'https://www.atrbpn.go.id/sentuh-tanahku'}),
 faq:Object.freeze({label:'Pusat Bantuan (FAQ)',nativeTitle:'FAQ',description:'Buka FAQ Sentuh Tanahku pada situs ATR/BPN.',linkLabel:'FAQ',url:'https://www.atrbpn.go.id/sentuh-tanahku-faq'}),
 privacy:Object.freeze({label:'Kebijakan Privasi',nativeTitle:'Website',description:'Baca kebijakan privasi pada situs ATR/BPN.',linkLabel:'Kebijakan Privasi',url:'https://www.atrbpn.go.id/privacy-policy'}),
});
export function profileWebsiteDestination(kind){return Object.hasOwn(destinations,kind)?destinations[kind]:null;}
