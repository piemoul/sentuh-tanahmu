// Source-only checkouts intentionally omit private APK evidence and local receipts.
// Skip these five evidence checks explicitly; keep all implementation tests intact.
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
const evidenceChecks=[
 'save/activity batch keeps original corpus, six prior ledgers and 225 historical JSON byte-identical',
 'native canonical ledger remains pinned and staged UI imports no transport or document surface',
 'verified artifact configuration binds the native calendar literals privately',
 'all 1079 frozen C++ reference vectors match queue raw-double conversion',
 'verified APK TLS context stays private and is restricted to the exact production origin',
];
const escape=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const pattern='^(?:'+evidenceChecks.map(escape).join('|')+')$';
const files=fs.readdirSync(new URL('./',import.meta.url)).filter(name=>name.endsWith('.test.mjs')).sort().map(name=>fileURLToPath(new URL(name,import.meta.url)));
console.log('Portable source tests: five explicitly named private-artifact/evidence checks are excluded.');
const child=spawn(process.execPath,['--openssl-legacy-provider','--test','--test-skip-pattern='+pattern,...files],{stdio:'inherit',windowsHide:true});
child.on('error',error=>{console.error(error.message);process.exitCode=1;});
child.on('close',code=>{process.exitCode=code??1;});
