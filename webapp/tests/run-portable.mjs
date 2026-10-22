// Publication-only runner for a documented subset of unchanged native tests.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
const scope=JSON.parse(fs.readFileSync(new URL('../../docs/PORTABLE-TEST-SCOPE.json',import.meta.url),'utf8'));
assert.equal(scope.schemaVersion,1,'supported portable test scope');
const names=fs.readdirSync(new URL('./',import.meta.url)).filter(name=>name.endsWith('.test.mjs')).sort();
assert.equal(names.length,scope.inventory.testFiles,'update the explicit scope when test inventory changes');
const sources=new Map(names.map(name=>[name,fs.readFileSync(new URL(name,import.meta.url),'utf8')]));
const escape=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const declaration=name=>new RegExp('\\btest\\(\\s*([\'\"])'+escape(name)+'\\1','g');
const excludedFiles=new Set();
for(const entry of scope.excludedFiles){
 assert.ok(sources.has(entry.file),'excluded test file exists: '+entry.file);
 assert.equal(excludedFiles.has(entry.file),false,'unique excluded file: '+entry.file);
 excludedFiles.add(entry.file);
 for(const name of entry.testNames)assert.equal([...sources.get(entry.file).matchAll(declaration(name))].length,1,'declared excluded callback: '+entry.file+' / '+name);
 assert.equal([...sources.get(entry.file).matchAll(/\btest\(\s*['"]/g)].length,entry.testNames.length,'document every callback in excluded file: '+entry.file);
}
const skippedNames=[];
for(const entry of scope.excludedTests){
 assert.ok(sources.has(entry.file),'callback test file exists: '+entry.file);
 assert.equal(excludedFiles.has(entry.file),false,'callback exclusion is in an included file');
 assert.equal(skippedNames.includes(entry.name),false,'unique callback exclusion: '+entry.name);
 const occurrences=[...sources].reduce((count,[,source])=>count+[...source.matchAll(declaration(entry.name))].length,0);
 assert.equal(occurrences,1,'exact callback exclusion must identify one test: '+entry.name);
 assert.equal([...sources.get(entry.file).matchAll(declaration(entry.name))].length,1,'callback belongs to declared file: '+entry.file);
 skippedNames.push(entry.name);
}
const files=names.filter(name=>!excludedFiles.has(name)).map(name=>fileURLToPath(new URL(name,import.meta.url)));
const pattern='^(?:'+skippedNames.map(escape).join('|')+')$';
console.log('# Portable source scope: '+files.length+'/'+names.length+' test files; '+excludedFiles.size+' whole files and '+skippedNames.length+' exact named callbacks excluded. See docs/PORTABLE-TEST-SCOPE.md.');
const child=spawn(process.execPath,['--openssl-legacy-provider','--test','--test-reporter=tap','--test-skip-pattern='+pattern,...files],{stdio:'inherit',windowsHide:true});
child.on('error',error=>{console.error(error.message);process.exitCode=1;});
child.on('close',code=>{process.exitCode=code??1;});
