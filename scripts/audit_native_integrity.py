"""Read-only DEX reference audit. No app execution, hooks, patches or requests."""
from pathlib import Path
import hashlib, json, re, struct
from analyze_artifact import redact
from elftools.elf.elffile import ELFFile

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'analysis/recovered'

def safe(s):
    s = redact(s)
    if re.fullmatch(r'[A-Fa-f0-9:]{32,}', s) or re.fullmatch(r'[A-Za-z0-9_+/=-]{40,}', s):
        return '[REDACTED_OPAQUE_LITERAL]'
    return s if len(s) < 500 else '[LONG_LITERAL_OMITTED]'

class Dex:
    def __init__(self, path):
        self.path, self.b = path, path.read_bytes()
        self.strings, self.string_offsets = [], []
        n, off = self.u32(0x38), self.u32(0x3c)
        for i in range(n):
            p = self.u32(off + 4*i)
            _, p = self.uleb(p)
            self.string_offsets.append(p)
            self.strings.append(self.b[p:self.b.index(0,p)].replace(b'\xc0\x80',b'\0').decode('utf-8','replace'))
        n, off = self.u32(0x40), self.u32(0x44)
        self.types = [self.strings[self.u32(off+4*i)] for i in range(n)]
        n, off = self.u32(0x48), self.u32(0x4c)
        self.protos=[]
        for i in range(n):
            _, ret, args = struct.unpack_from('<III',self.b,off+12*i)
            params = [] if not args else [self.types[self.u16(args+4+2*j)] for j in range(self.u32(args))]
            self.protos.append('('+''.join(params)+')'+self.types[ret])
        n, off = self.u32(0x50), self.u32(0x54)
        self.fields=[]
        for i in range(n):
            cls, typ, name=struct.unpack_from('<HHI',self.b,off+8*i)
            self.fields.append(self.types[cls]+'->'+self.strings[name]+':'+self.types[typ])
        n, off = self.u32(0x58), self.u32(0x5c)
        self.methods=[]
        for i in range(n):
            cls, proto, name=struct.unpack_from('<HHI',self.b,off+8*i)
            self.methods.append(self.types[cls]+'->'+self.strings[name]+self.protos[proto])
        self.defs=[]
        n, off = self.u32(0x60), self.u32(0x64)
        for i in range(n):
            vals=struct.unpack_from('<8I',self.b,off+32*i)
            cls, access, superclass, interfaces, source, annotations, p, static_values = vals
            if not p: continue
            sizes=[]
            for _ in range(4):
                v,p=self.uleb(p);sizes.append(v)
            for count in sizes[:2]:
                for _ in range(count):
                    _,p=self.uleb(p);_,p=self.uleb(p)
            for count in sizes[2:]:
                idx=0
                for _ in range(count):
                    delta,p=self.uleb(p);idx+=delta
                    flags,p=self.uleb(p);code,p=self.uleb(p)
                    self.defs.append({'method_id':idx,'class':self.types[cls],'class_def_offset':hex(off+32*i),
                        'method':self.methods[idx],'access_flags':hex(flags),'code_offset':code})
    def u16(self,p):return struct.unpack_from('<H',self.b,p)[0]
    def u32(self,p):return struct.unpack_from('<I',self.b,p)[0]
    def uleb(self,p):
        v=0;s=0
        while True:
            b=self.b[p];p+=1;v|=(b&127)<<s
            if b<128:return v,p
            s+=7
    def instructions(self,m):
        code=m['code_offset']
        if not code:return []
        n=self.u32(code+12);base=code+16
        words=struct.unpack_from('<'+str(n)+'H',self.b,base)
        widths={i:1 for i in range(256)}
        for i in [2,5,8,0x13,0x15,0x16,0x19,0x1a,0x1c,0x1f,0x20,0x22,0x23,0x29,*range(0x2d,0x3e),*range(0x44,0x6e),*range(0x90,0xb0),*range(0xd0,0xe3),0xfe,0xff]:widths[i]=2
        for i in [3,6,9,0x14,0x17,0x1b,0x24,0x25,0x26,0x2a,0x2b,0x2c,*range(0x6e,0x73),*range(0x74,0x79),0xfc,0xfd]:widths[i]=3
        widths[0x18]=5;widths[0xfa]=widths[0xfb]=4
        result=[];p=0
        while p<n:
            w=words[p];op=w&255;size=widths[op]
            rec={'offset':hex(base+2*p),'pc_code_units':p,'opcode':hex(op),'words':[hex(x) for x in words[p:p+size]]}
            if op==0 and w:
                if w==0x100:size=4+2*words[p+1]
                elif w==0x200:size=2+4*words[p+1]
                elif w==0x300:size=4+(words[p+1]*(words[p+2]+(words[p+3]<<16))+1)//2
                else:raise ValueError('Unknown payload '+hex(w))
                rec['kind']='payload';rec['size_code_units']=size
            elif op in (0x1a,0x1b):
                idx=words[p+1] if op==0x1a else words[p+1]+(words[p+2]<<16)
                rec.update(kind='const-string',string_index=idx,string_offset=hex(self.string_offsets[idx]),text=safe(self.strings[idx]),register=w>>8)
            elif op in [*range(0x6e,0x73),*range(0x74,0x79),0xfa,0xfb]:
                idx=words[p+1];rec.update(kind='invoke',method_id=idx,target=self.methods[idx])
                if op in range(0x6e,0x73):
                    count=w>>12;r=words[p+2];rec['registers']=[r&15,(r>>4)&15,(r>>8)&15,(r>>12)&15,(w>>8)&15][:count]
                elif op in range(0x74,0x79):rec['registers']=list(range(words[p+2],words[p+2]+(w>>8)))
            elif 0x52<=op<=0x6d:rec.update(kind='field',target=self.fields[words[p+1]])
            elif op in (0x1c,0x1f,0x20,0x22,0x23,0x24,0x25):rec.update(kind='type',target=self.types[words[p+1]])
            elif op==0x12:rec.update(kind='literal',register=(w>>8)&15,value=(w>>12)-16 if w>>12>=8 else w>>12)
            elif op in (0x13,0x14,0x15):
                val=words[p+1] if op!=0x14 else words[p+1]+(words[p+2]<<16)
                if op==0x15:val<<=16
                rec.update(kind='literal',register=w>>8,value=val)
            if p+size>n:raise ValueError('Instruction extends past code_item: '+m['method'])
            result.append(rec);p+=size
        return result

def main():
    dexes=[Dex(p) for p in sorted((ROOT/'analysis/unpacked/apk/id.go.bpn.sentuh').glob('*.dex'))]
    needles={'buildSignature','dev.fluttercommunity.plus/package_info','root_checker_plus','isRootChecker','com.sentuh/liveness','getApkContentsSigners','getSigningCertificateHistory','SHA-1','SHA-256','Integrity check failed.'}
    selected=[];allrefs=[];issues=[]
    for dex in dexes:
        for m in dex.defs:
            try:ins=dex.instructions(m)
            except Exception as exc:
                issues.append({'method':m['method'],'error':str(exc)});continue
            refs=[i for i in ins if i.get('kind') in ('const-string','invoke','field')]
            allrefs.append({**m,'source':dex.path.relative_to(ROOT).as_posix(),'refs':refs})
            if m['class'] in ('Lid/go/bpn/sentuh/MainActivity;','LD6/b;','Ls2/a;','Lcom/scottyab/rootbeer/RootBeerNative;') or any(i.get('text') in needles for i in refs):
                selected.append({**m,'code_offset':hex(m['code_offset']),'source':dex.path.relative_to(ROOT).as_posix(),'instructions':ins})
    (OUT/'native-integrity-code.json').write_text(json.dumps({'selected_methods':selected,'parse_issues':issues,'parsed_method_definitions':len(allrefs)},indent=2),encoding='utf-8')
    (ROOT/'environment/android/native-dex-refs.json').write_text(json.dumps(allrefs),encoding='utf-8')
    markers = ['com.google.android.play.core.integrity','IntegrityManager','StandardIntegrityManager',
        'requestIntegrityToken','IntegrityTokenRequest','cloudProjectNumber','requestHash',
        'playintegrity.googleapis.com','com.google.android.gms.safetynet','SafetyNetClient',
        'ctsProfileMatch','apkCertificateDigestSha256','FirebaseAppCheck','firebase_app_check',
        'appcheck.googleapis.com','certificateSha256Digest','MEETS_DEVICE_INTEGRITY',
        'MEETS_STRONG_INTEGRITY','attestation']
    native_paths=sorted((ROOT/'analysis/unpacked/apk/config.arm64_v8a/lib/arm64-v8a').glob('*.so'))
    native_paths=[p for p in native_paths if p.name!='libapp.so']
    manifest_path=OUT/'manifest-id.go.bpn.sentuh.xml'
    corpus={d.path.relative_to(ROOT).as_posix():d.b.lower() for d in dexes}
    corpus.update({p.relative_to(ROOT).as_posix():p.read_bytes().lower() for p in native_paths})
    corpus[manifest_path.relative_to(ROOT).as_posix()]=manifest_path.read_bytes().lower()
    probes=[{'marker':s,'total_literal_occurrences':sum(b.count(s.lower().encode()) for b in corpus.values()),
        'source_hits':{name:b.count(s.lower().encode()) for name,b in corpus.items() if s.lower().encode() in b}} for s in markers]
    plugin_methods=[m for m in selected if m['class']=='LD6/b;']
    plugin_steps=[{'method':m['method'],'code_item_offset':m['code_offset'],
        'references':[{'instruction_offset':i['offset'],**({'literal':i['text'],'string_data_offset':i['string_offset']} if i.get('kind')=='const-string' else {'target':i['target']})}
            for i in m['instructions'] if i.get('kind') in ('const-string','invoke','field')]}
        for m in plugin_methods]
    rootlib=next(p for p in native_paths if p.name=='libtoolChecker.so')
    with rootlib.open('rb') as f:
        elf=ELFFile(f)
        native_symbols=[{'name':s.name,'virtual_address':hex(s['st_value']),'size':s['st_size'],'section':s['st_shndx']}
            for s in elf.get_section_by_name('.dynsym').iter_symbols() if s.name]
    report={
        'schemaVersion':1,
        'scope':'Bounded static DEX/native-library/plugin/manifest audit. No runtime relaunch, interception, credential extraction, protection modification or remote API calls.',
        'conclusion':{
            'server_requires_current_client_apk_checksum':'unverified',
            'buildSignature':'Confirmed: uppercase hexadecimal SHA-256 of Android signing-certificate bytes, produced by package_info_plus. This is not a hash of the whole APK.',
            'native_bridge_delivery':'The package_info getAll method returns this value and package/version/install metadata through a Flutter method channel. That local return is not itself a network request.',
            'remote_attestation':'No named Play Integrity, SafetyNet or Firebase App Check markers found in this bounded DEX/manifest/native-library literal scan. Absence is not proof of absence after obfuscation/dynamic loading or on the server.',
            'S5':'Existing API36 runtime evidence confirms composite local refusal screen. This native review does not assign S5 to an individual root/emulator/signature check.',
        },
        'offsetConvention':'All DEX offsets are byte offsets in original classes.dex, not virtual addresses. ELF symbol addresses are explicitly named virtual_address.',
        'sources':[{'path':d.path.relative_to(ROOT).as_posix(),'bytes':len(d.b),'sha256':hashlib.sha256(d.b).hexdigest(),
            'method_definitions':len(d.defs)} for d in dexes]+[{'path':p.relative_to(ROOT).as_posix(),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in native_paths],
        'methodParsing':{'definitionsParsed':len(allrefs),'instructionParseIssues':issues,'note':'Instruction boundaries, constant references, method calls and fields decoded; not full control-flow decompilation.'},
        'packageInfo':{
            'registeredPluginName':'package_info_plus',
            'originalClassFromRegistrantMessage':'dev.fluttercommunity.plus.packageinfo.PackageInfoPlugin',
            'obfuscatedClass':'LD6/b;', 'classDefOffset':'0xcbdb8',
            'registration':{'method':'Lio/flutter/plugins/GeneratedPluginRegistrant;->registerWith(LL6/c;)V','codeItemOffset':'0x371cf8','constructorInvokeOffset':'0x3720cc','pluginErrorMessageOffset':'0x3720dc'},
            'channel':'dev.fluttercommunity.plus/package_info','methodName':'getAll',
            'returnedKeys':['appName','packageName','version','buildNumber','buildSignature','installerStore','installTime','updateTime'],
            'certificateInput':'Own Context.getPackageName -> PackageManager.getPackageInfo -> PackageInfo.signingInfo; first getApkContentsSigners element for multiple signers, else first signing-certificate-history element; Signature.toByteArray.',
            'digestAlgorithm':'SHA-256','format':'uppercase hexadecimal','hexAlphabetPayloadOffset':'0x11f528',
            'certificateValuesCollected':False,'wholeApkReadInThisProducer':False,
            'steps':plugin_steps},
        'localChecks':{
            'rootChecker':{'registeredPlugin':'root_checker_plus','obfuscatedClass':'Ls2/a;',
                'registrationConstructorOffset':'0x372154','onMethodCallCodeItemOffset':'0x42adac',
                'localMethods':['isRootChecker','isDeveloperMode'],
                'developerMode':{'nameLiteralInstruction':'0x42b24a','settingNameInstruction':'0x42b26a','settingName':'development_settings_enabled','readInstruction':'0x42b270','readTarget':'android.provider.Settings$Secure.getInt'},
                'rootNativeInvokeOffset':'0x42b1f0','rootNativeTarget':'Lcom/scottyab/rootbeer/RootBeerNative;->checkForRoot([Ljava/lang/Object;)I',
                'interpretation':'Local device/package/property/filesystem checks, not a remote attestation verdict.'},
            'rootNativeLibrary':{'path':rootlib.relative_to(ROOT).as_posix(),'sha256':hashlib.sha256(rootlib.read_bytes()).hexdigest(),
                'dexLoadLibraryInstruction':'0x3217ac','libraryName':'toolChecker','symbols':native_symbols},
            'mainActivity':{'class':'Lid/go/bpn/sentuh/MainActivity;',
                'constructorCodeItemOffset':'0x3673c0','engineConfigurationCodeItemOffset':'0x3673e8',
                'customChannelLiterals':[{'value':'com.sentuh/liveness','instructionOffset':'0x3673d6'},{'value':'com.example.media_scanner','instructionOffset':'0x3673de'}],
                'integrityCustomChannelObserved':False}},
        'remoteAttestationLiteralProbes':probes,
        'probeCoverage':{'dexFiles':2,'nonDartNativeLibraries':len(native_paths),'decodedBaseManifest':True,
            'libappExcludedReason':'Dart/AOT control-flow audit performed separately in client-integrity-audit; avoid treating native literal absence as whole-client absence.'},
        'falsePositives':[
            {'literal':'Integrity check failed.','stringDataOffset':'0x51b8af','method':'Lu4/d;->b([B[B)[B','codeItemOffset':'0x44d1bc','context':'Cipher/AES integrity checking; not evidence of Play Integrity.'},
            {'literal':'Play Store package certs are not valid. Found these sha256 certs: [','stringDataOffset':'0x55b300','method':'Lb4/g;-><init>(Landroid/content/Context;)V','codeItemOffset':'0x289cb8','context':'In-app review binding checks com.android.vending; not proof Sentuh backend checks APK hash.'},
            {'literal':'WEBVIEW_MEDIA_INTEGRITY_API_STATUS','stringDataOffset':'0x5769dd','context':'WebView capability/configuration symbol; not evidence of application attestation submission.'},
            {'literal':'SHA-1','method':'LJ4/g;->h(Ljava/lang/String;)Ljava/lang/String;','codeItemOffset':'0x166124','context':'Crashlytics string hashing; package_info buildSignature producer uses SHA-256 instead.'}],
        'runtimeEvidence':'analysis/runtime/emulator/api36/observation.json',
        'limitations':['No server implementation or official API integration contract available.','No network request/response captured in runtime test.','No named markers is a bounded negative result, not proof that all attestation/checksum enforcement is absent.','Local signer digest, local security gate, request signing and server validation are distinct.','No signing private keys, app credential values, attestation tokens or expected certificate digest values are exposed.'],
        'supportingCode':'analysis/recovered/native-integrity-code.json',
        'formatReference':'https://source.android.com/docs/core/runtime/dalvik-bytecode'}
    (OUT/'native-integrity-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'selected_method_count':len(selected),'parsed_method_definitions':len(allrefs),'parse_issues':len(issues),
        'selected_summaries':[{'method':x['method'],'code_offset':x['code_offset'],'strings':[i['text'] for i in x['instructions'] if i.get('kind')=='const-string']} for x in selected]},indent=2))

if __name__=='__main__':main()
