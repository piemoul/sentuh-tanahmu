"""Vendor a pinned npm QR reader without installing or executing package scripts."""
import base64, hashlib, json, tarfile, urllib.request
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
CACHE=ROOT/'environment/dependencies/zxing'
DEST=ROOT/'webapp/assets/vendor/zxing'
CACHE.mkdir(parents=True,exist_ok=True)
DEST.mkdir(parents=True,exist_ok=True)

def package(name,version,archive):
    metadata_url=f'https://registry.npmjs.org/{name}/{version}'
    with urllib.request.urlopen(metadata_url,timeout=30) as response:
        metadata=json.load(response)
    assert metadata['name']==name and metadata['version']==version
    dist=metadata['dist']
    assert dist['tarball'].startswith('https://registry.npmjs.org/')
    target=CACHE/archive
    if not target.exists():
        with urllib.request.urlopen(dist['tarball'],timeout=30) as response:
            payload=response.read(12*1024*1024+1)
        assert len(payload)<=12*1024*1024
        target.write_bytes(payload)
    payload=target.read_bytes()
    expected='sha512-'+base64.b64encode(hashlib.sha512(payload).digest()).decode()
    assert dist['integrity']==expected
    return target,dict(name=name,version=version,registryMetadata=metadata_url,tarball=dist['tarball'],integrity=expected,sha256=hashlib.sha256(payload).hexdigest())

browser,browser_meta=package('@zxing/browser','0.2.1','zxing-browser-0.2.1.tgz')
library,library_meta=package('@zxing/library','0.23.0','zxing-library-0.23.0.tgz')
outputs=[]
def copy_member(archive,member,name):
    # Exact selected regular members only; no archive-controlled destination.
    with tarfile.open(archive,'r:gz') as source:
        info=source.getmember(member)
        assert info.isfile() and info.size<2*1024*1024
        payload=source.extractfile(info).read()
    (DEST/name).write_bytes(payload)
    outputs.append(dict(file='webapp/assets/vendor/zxing/'+name,bytes=len(payload),sha256=hashlib.sha256(payload).hexdigest()))

copy_member(browser,'package/umd/zxing-browser.min.js','zxing-browser.min.js')
copy_member(browser,'package/LICENSE','LICENSE.browser.txt')
copy_member(library,'package/LICENSE','LICENSE.library.txt')
manifest=dict(browserPackage=browser_meta,libraryLicenseSource=library_meta,outputs=outputs,
    usage='Pinned self-contained browser UMD QR decoder, served locally. No CDN runtime requests.',
    bundledLibraryVersion='Not independently established: published browser package peer range and development dependency range differ. The library license is included; no exact embedded library version claim.',
    upstreamDocumentation='https://github.com/zxing-js/browser',executedPackageScripts=False)
(DEST/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
print(json.dumps(dict(browser='0.2.1',files=len(outputs),scriptsExecuted=False)))
