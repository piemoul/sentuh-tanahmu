// Native Scan special-map helpers are not yEb and do not JSON-decode a second
// String. PBT model: scan-location-followup/f99ec732…ff5c9 and
// scan-pbt-map-followup/d62a880c…02e93. Projection belongs to the UI controller.
function invalid(kind) {
  throw Object.assign(new Error(kind === 'pbt'
    ? 'Respons PBT elektronik belum sesuai format layanan.'
    : 'Respons lokasi kegiatan belum sesuai format layanan.'), {
    status:502,code:kind === 'pbt' ? 'SCAN_PBT_UNRECOGNIZED' : 'SCAN_KKPR_UNRECOGNIZED',
  });
}

function record(value,kind) {
  if(value === null || typeof value !== 'object' || Array.isArray(value)
      || ![Object.prototype,null].includes(Object.getPrototypeOf(value))) invalid(kind);
  return value;
}
function field(value,key,kind) {
  const descriptor=Object.getOwnPropertyDescriptor(value,key);
  if(!descriptor)return null;
  if(!Object.hasOwn(descriptor,'value'))invalid(kind);
  return descriptor.value;
}
function scalar(value,type,kind) {
  if(value !== null && typeof value !== type)invalid(kind);
  return value;
}
function nullableMap(value,decode,kind) {
  return value === null ? null : decode(record(value,kind));
}
function nullableList(value,decode,kind) {
  if(value === null)return null;
  if(!Array.isArray(value))invalid(kind);
  return value.map(decode);
}
function envelope(body,decode,kind) {
  record(body,kind);
  const error=scalar(field(body,'error',kind),'boolean',kind);
  const data=field(body,'data',kind);
  return {error:error ?? true,data:decode(record(data === null ? {} : data,kind))};
}
const pbtString=(body,key)=>scalar(field(body,key,'pbt'),'string','pbt');
function pbtGeometry(body) {
  return {type:pbtString(body,'type'),coordinates:nullableList(field(body,'coordinates','pbt'),value=>value,'pbt')};
}
function pbtBoundary(body) {
  return {id:pbtString(body,'id'),tipeHak:pbtString(body,'tipeHak'),geometri:nullableMap(field(body,'geometri','pbt'),pbtGeometry,'pbt')};
}
function pbtParcel(body) {
  record(body,'pbt');
  return {nib:pbtString(body,'nib'),lokasi:pbtString(body,'lokasi'),luas:pbtString(body,'luas'),noBerkas:pbtString(body,'noBerkas'),batas:nullableMap(field(body,'batas','pbt'),pbtBoundary,'pbt')};
}
function pbtModel(body) {
  return {nomor:pbtString(body,'nomor'),kantor:pbtString(body,'kantor'),daftarBidangTanah:nullableList(field(body,'daftarBidangTanah','pbt'),pbtParcel,'pbt')};
}
// coordinates.map(ba0cec) is an identity callback: retain nested values as they
// arrive, including malformed/unused geometry. Numeric conversion, MultiPolygon
// traversal and partial publication order are separate native UI behavior.
export function decodeScanPbtEnvelope(body) {
  return envelope(body,pbtModel,'pbt');
}

// KKPR nested leaves: scan-kkpr-map-followup/8aec89db…01d24. These are
// the detail model's fields, not the separate KKPR list/gyb decoder.
const stringFields=keys=>keys.split(' ').map(key=>[key,'string']);
const kkprLeafSchemas={
  properties:[
    ['id','integer'],['total_polygons','integer'],['total_area_m2','number'],
    ...stringFields('total_area_formatted individual_areas'),['area_m2','number'],
    ...stringFields('area_formatted created_at polygon_label itbx_status geom_type'),
    ['alashak_index','integer'],...stringFields('alashak_nomor syarat'),
  ],
  berkas:[
    ['rNumber','number'],...stringFields('berkasId taskNodeId pemilikId'),
    ...['nomor','tahun','seq','statusBerkas'].map(key=>[key,'integer']),
    ...stringFields('nomorTahun namaProsedur namaKantor namaProfile namaPegawai namaPemohon namaKuasa alamatPemohon keteranganStatusBerkas namaKabupaten namaProvinsi tanggalFlow statusJatuhTempo kategoriKKPR'),
  ],
  kkpr:[
    ...stringFields('kkprId nomor jenisKKPR berkasId pemilikId namaPemohon npwpPemohon alamatPemohon teleponPemohon emailPemohon tanggalTerbit tanggalCetak pembuatDokumen jabatanTTD nipttd statusPM kodeKBLI judulKBLI skalaUsaha alamatUsaha provinsiId kabupatenId kecamatanId wilayahId namaDesa namaKecamatan namaKabupaten namaProvinsi hasilKKPR luasDimohon luasDisetujui jenisManfaatRuang koefDasar koefLantai koefDasarHijau indikasiUtama garisSempadan jarakBangunan koefTapak ketinggianBangunan jaringanUtilitas judulDelineasiKKPR indikasiZonasi layerBackground kategoriKKPR'),
    ['edisi','number'],...stringFields('jenisEdisi kodeUnik'),['rNumber','number'],['total','number'],['pertimbangan','native-list'],
  ],
  pemohon:stringFields('namaPemohon npwp alamatPemohon telepon email namaKuasa alamatKuasa'),
};
function kkprLeaf(body,schema) {
  return Object.fromEntries(schema.map(([key,type])=>{
    const value=field(body,key,'kkpr');
    if(type === 'native-list'){
      // Native directly casts List<jEb>? using runtime generic metadata. It
      // never maps JSON children or exempts an empty list. No nonnull JSON
      // representation is certified; conservatively reject one here.
      if(value !== null)invalid('kkpr');
    }else if(type === 'integer'){
      // JSON adapter guard: refuse a possibly rounded int identity. This is a
      // JS representation boundary, not a newly inferred native size rule.
      if(value !== null && !Number.isSafeInteger(value))invalid('kkpr');
    }else if(type === 'number'){
      // Native num.toDouble has no String coercion. Nonfinite values cannot be
      // represented in the JSON reply; fail rather than silently serialize null.
      if(value !== null && (typeof value !== 'number' || !Number.isFinite(value)))invalid('kkpr');
    }else scalar(value,type,'kkpr');
    return [key,value];
  }));
}
const kkprString=(body,key)=>scalar(field(body,key,'kkpr'),'string','kkpr');
function kkprGeometry(body) {
  return {type:kkprString(body,'type'),coordinates:nullableList(field(body,'coordinates','kkpr'),value=>value,'kkpr')};
}
function kkprFeature(body) {
  record(body,'kkpr');
  return {type:kkprString(body,'type'),properties:nullableMap(field(body,'properties','kkpr'),value=>kkprLeaf(value,kkprLeafSchemas.properties),'kkpr'),geometry:nullableMap(field(body,'geometry','kkpr'),kkprGeometry,'kkpr')};
}
function kkprGeometryData(body) {
  return {type:kkprString(body,'type'),features:nullableList(field(body,'features','kkpr'),kkprFeature,'kkpr')};
}
function kkprTextualData(body) {
  return Object.fromEntries(['pemohon','kkpr','berkas'].map(key=>[key,nullableMap(field(body,key,'kkpr'),value=>kkprLeaf(value,kkprLeafSchemas[key]),'kkpr')]));
}
function kkprModel(body) {
  return {status:scalar(field(body,'status','kkpr'),'boolean','kkpr'),...Object.fromEntries(['pesan','kkprId','berkasId','kantorId','encryptedId'].map(key=>[key,kkprString(body,key)])),textualData:nullableMap(field(body,'textualData','kkpr'),kkprTextualData,'kkpr'),geometryData:nullableMap(field(body,'geometryData','kkpr'),kkprGeometryData,'kkpr')};
}
export function decodeScanKkprEnvelope(body) {
  return envelope(body,kkprModel,'kkpr');
}
