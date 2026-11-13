// node build.js  -> bundles data/*.js into cards.js, validates every card, stamps sw.js with a new version.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const D=path.join(__dirname,'data');
const files=fs.readdirSync(D).filter(f=>f.endsWith('.js')).sort((a,b)=>a==='core.js'?-1:b==='core.js'?1:a.localeCompare(b));
let out='';for(const f of files)out+='\n// ---- '+f+'\n;(function(){\n'+fs.readFileSync(path.join(D,f),'utf8')+'\n})();\n';
const core=fs.readFileSync(path.join(D,'core.js'),'utf8');
out=out.replace('\n// ---- core.js\n;(function(){\n'+core+'\n})();\n','\n// ---- core.js\n'+core+'\n');
let cards;
try{const w={};cards=new Function('window','var C;'+out.replace("window.C = function","C = window.C = function")+';return window.CARDS;')(w);}catch(e){console.error('Syntax error in data:',e.message);process.exit(1);}
const seen={},errs=[];
cards.forEach((c,i)=>{
  if(!c.topic||!c.q||!c.a)errs.push('#'+i+' missing field');
  if(![1,2,3,4].includes(c.diff))errs.push('#'+i+' bad difficulty: '+c.q.slice(0,60));
  const k=c.topic+'|'+c.q;if(seen[k])errs.push('duplicate: '+c.q.slice(0,70));seen[k]=1;
  const first=c.a.split('\n')[0];if(/^- /.test(first))errs.push('answer should start with a direct line: '+c.q.slice(0,60));
  if(/—|–/.test(c.q+c.a))errs.push('dash found: '+c.q.slice(0,60));
});
if(errs.length){console.error(errs.join('\n'));process.exit(1);}
const src=out+['app.js','gen.js','styles.css','index.html'].map(f=>fs.readFileSync(path.join(__dirname,f),'utf8')).join('');
const stamp=new Date().toISOString().slice(0,10)+'-'+crypto.createHash('md5').update(src).digest('hex').slice(0,6);
fs.writeFileSync(path.join(__dirname,'cards.js'),'window.DRILL_BUILD="'+stamp+'";'+out);
fs.writeFileSync(path.join(__dirname,'sw.js'),fs.readFileSync(path.join(__dirname,'sw.template.js'),'utf8').replace('__BUILD__',stamp));
const by={};cards.forEach(c=>by[c.topic]=(by[c.topic]||0)+1);
console.log('Built '+cards.length+' cards, build '+stamp);console.log(by);
