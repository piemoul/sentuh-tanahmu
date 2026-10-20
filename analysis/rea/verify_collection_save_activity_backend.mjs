// Run all Node tests against fixed source inputs, without printing transport data.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
const root=fileURLToPath(new URL('../../',import.meta.url));
const filesIn=relative=>fs.readdirSync(path.join(root,relative)).filter(name=>name.endsWith('.mjs')).map(name=>relative+'/'+name);
const testFiles=filesIn('webapp/tests').filter(file=>file.endsWith('.test.mjs')).sort();
const inputFiles=['webapp/private/build-operations.py',...filesIn('webapp/private'),...fs.readdirSync(path.join(root,'webapp')).filter(name=>/\.(?:m?js)$/.test(name)).map(name=>'webapp/'+name),...testFiles].sort();
const hash=file=>createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
const inputs=inputFiles.map(file=>({file,sha256:hash(file)}));
const {exitCode,stdout,stderr}=await new Promise(resolve=>{
  const child=spawn(process.execPath,['--openssl-legacy-provider','--test','--test-reporter=tap',...testFiles],{cwd:root,windowsHide:true,stdio:['ignore','pipe','pipe']});let stdout='',stderr='';
  child.stdout.setEncoding('utf8').on('data',chunk=>stdout+=chunk);child.stderr.setEncoding('utf8').on('data',chunk=>stderr+=chunk);
  child.once('error',error=>resolve({exitCode:null,stdout,stderr:error.name}));
  child.once('close',exitCode=>resolve({exitCode,stdout,stderr}));
});
const metric=name=>Number(stdout.match(new RegExp('^# '+name+' (\\d+)$','m'))?.[1]??NaN);
const changedInputs=inputs.filter(row=>hash(row.file)!==row.sha256).map(row=>row.file);
const report={checkedAt:new Date().toISOString(),tests:metric('tests'),pass:metric('pass'),fail:metric('fail'),cancelled:metric('cancelled'),skipped:metric('skipped'),todo:metric('todo'),exitCode,testFiles,inputs,changedInputs,productionRequests:0,scope:'Complete Node test suite, with mocked upstream transports. This is not production mutation acceptance.'};
fs.writeFileSync(path.join(root,'analysis/webapp/collection-save-activity-backend-tests.txt'),stdout+(stderr?'\nSTDERR\n'+stderr:''));
fs.writeFileSync(path.join(root,'analysis/webapp/collection-save-activity-backend-tests.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({tests:report.tests,pass:report.pass,fail:report.fail,exitCode,changedInputs}));
if(exitCode!==0||!report.tests||report.pass!==report.tests||report.fail!==0||changedInputs.length)process.exitCode=1;
