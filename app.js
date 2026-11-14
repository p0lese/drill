(function(){
'use strict';
var KEY='drill.v2', INT=[0,1,2,4,8,16,32];
var TOPIC_ORDER=['Finance Basics','Accounting','Enterprise Value','DCF','WACC','Comps','M&A','LBO','Debt','Capital Markets','Restructuring','Healthcare','Deal Book','Industries','Markets & SaaS','Mental'];
var app=document.getElementById('app');
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function hash(s){var h=5381;for(var i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return 'c'+(h>>>0).toString(36);}
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
function today(){var d=new Date();return Math.floor(new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime()/86400000);}
function dkey(d){d=d||new Date();return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);}

/* data */
var CARDS=[],BYID={};
(window.CARDS||[]).forEach(function(c){var id=hash(c.topic+'|'+c.q);if(BYID[id])return;c.id=id;BYID[id]=c;CARDS.push(c);});
var TOPICS=TOPIC_ORDER.filter(function(t){return CARDS.some(function(c){return c.topic===t;});});
CARDS.forEach(function(c){if(TOPICS.indexOf(c.topic)<0)TOPICS.push(c.topic);});

/* storage */
function fresh(){return {v:2,cards:{},days:{},streak:{best:{},cleared:0,runs:[]},set:{theme:'auto',per:20},resume:null,last:null};}
function load(){try{var r=localStorage.getItem(KEY);if(r){var o=JSON.parse(r),f=fresh();for(var k in f)if(o[k]==null)o[k]=f[k];for(var k2 in f.set)if(o.set[k2]==null)o.set[k2]=f.set[k2];if(!o.streak.best)o.streak.best={};if(!o.streak.runs)o.streak.runs=[];return o;}}catch(e){}return fresh();}
var S=load();
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist();}catch(e){}
function theme(){var t=S.set.theme;if(t==='auto')document.documentElement.removeAttribute('data-theme');else document.documentElement.setAttribute('data-theme',t);
  var dark=t==='dark'||(t==='auto'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);var m=document.querySelector('meta[name=theme-color]');if(m)m.setAttribute('content',dark?'#121212':'#ffffff');}
theme();

/* view state */
var V='home', sess=null, sc={topic:'All',level:2,target:7}, arm=false, tT=null;
function toast(m){var t=document.querySelector('.toast');if(!t){t=document.createElement('div');t.className='toast';document.body.appendChild(t);}t.textContent=m;t.classList.add('show');clearTimeout(tT);tT=setTimeout(function(){t.classList.remove('show');},1700);}
function opt(label,on,act,v){return '<button class="opt'+(on?' on':'')+'" data-act="'+act+'" data-v="'+esc(v)+'">'+esc(label)+'</button>';}
function row(t,s,act,v){return '<button class="row" data-act="'+act+'"'+(v!=null?' data-v="'+esc(v)+'"':'')+'><span class="t">'+esc(t)+'</span><span class="s">'+esc(s||'')+'</span></button>';}
function page(h){app.innerHTML='<div class="page" id="pg">'+h+'</div>';var p=document.getElementById('pg');if(p)p.scrollTop=0;}

/* scheduling */
function st(id){return S.cards[id];}
function counts(){var t=today(),due=0,miss=0,seen=0,mast=0;CARDS.forEach(function(c){var s=st(c.id);if(s){seen++;if(s.d<=t)due++;if(s.m)miss++;if(s.b>=3)mast++;}});return {due:due,miss:miss,seen:seen,mast:mast};}
function buildDeck(list,n){
  var t=today(),due=[],nw=[],rest=[];
  list.forEach(function(c){var s=st(c.id);if(!s)nw.push(c);else if(s.d<=t)due.push(c);else rest.push(c);});
  due=shuffle(due).sort(function(a,b){return st(a.id).d-st(b.id).d;});
  nw=shuffle(nw).sort(function(a,b){return a.diff-b.diff;});
  rest=shuffle(rest).sort(function(a,b){return (st(a.id).l||0)-(st(b.id).l||0);});
  var dueTake=due.slice(0,n),q=dueTake.concat(nw.slice(0,Math.max(0,n-dueTake.length)));
  if(q.length<n)q=q.concat(rest.slice(0,n-q.length));
  // light shuffle so it does not feel ordered, keep easier new cards early
  return q;
}
function record(id,ok,relearn){
  var t=today(),k=dkey(),d=S.days[k]||{n:0,c:0};d.n++;if(ok)d.c++;S.days[k]=d;
  if(id){var s=st(id)||{b:0,s:0,c:0,d:0,m:false,l:0};s.s++;s.l=t;
    if(ok&&relearn){s.c++;s.b=1;s.d=t+1;s.m=false;}else if(ok){s.c++;s.b=Math.min(6,s.b+1);s.d=t+INT[s.b];s.m=false;}else{s.b=1;s.d=t;s.m=true;}
    S.cards[id]=s;}
  save();
}

/* resume */
function persist(){
  if(!sess||V!=='card'){return;}
  var o={kind:sess.kind,title:sess.title,i:sess.i,right:sess.right,wrong:sess.wrong,shown:false,hint:false,t:Date.now()};
  o.missed=sess.missed.map(function(c){return c.id?{id:c.id}:{g:c};});
  if(sess.kind==='deck'){o.q=sess.q.map(function(c){return c.id;});o.re=sess.re;}
  else{o.cur=sess.cur.id?{id:sess.cur.id}:{g:sess.cur};}
  if(sess.kind==='streak'){o.run=sess.run;o.best=sess.best;o.topics=sess.topics;o.flips=sess.flips;o.sc={topic:sc.topic,level:sc.level,target:sc.target};}
  S.resume=o;save();
}
function unpack(x){return x.id?BYID[x.id]:x.g;}
function resumeSess(){
  var o=S.resume;if(!o)return false;
  try{
    var r={kind:o.kind,title:o.title,i:o.i,right:o.right,wrong:o.wrong,shown:false,hint:false,missed:(o.missed||[]).map(unpack).filter(Boolean)};
    if(o.kind==='deck'){r.q=o.q.map(function(id){return BYID[id];}).filter(Boolean);r.re=o.re||{};if(r.i>=r.q.length)return false;}
    else{r.cur=unpack(o.cur);if(!r.cur)r.cur=o.kind==='mental'?nextMental():GEN.streak(o.sc.topic,o.sc.level);r.re={};}
    if(o.kind==='streak'){r.run=o.run;r.best=o.best;r.topics=o.topics||{};r.flips=o.flips||[];r.t0=Date.now();r.flip=null;sc.topic=o.sc.topic;sc.level=o.sc.level;sc.target=o.sc.target;}
    sess=r;V='card';return true;
  }catch(e){S.resume=null;save();return false;}
}
function clearResume(){if(S.resume){S.resume=null;save();}}
function logSession(){
  var n=sess.right+sess.wrong;if(!n)return;
  S.last={d:dkey(),title:sess.kind==='streak'?'Streak L'+sc.level:sess.title,right:sess.right,n:n,best:sess.kind==='streak'?sess.best:null};save();
}
function ago(k){var d=Math.round((today()-Math.floor(new Date(k+'T00:00:00').getTime()/86400000)));return d<=0?'today':d===1?'yesterday':d+' days ago';}

/* sessions */
function startDeck(title,cards){if(!cards.length){toast('Nothing here yet');return;}sess={kind:'deck',title:title,q:cards.slice(),i:0,shown:false,hint:false,right:0,wrong:0,missed:[],re:{}};V='card';render();}
function startMental(){sess={kind:'mental',title:'Mental',i:0,shown:false,hint:false,right:0,wrong:0,missed:[],cur:nextMental(),re:{}};V='card';render();}
function nextMental(){
  var stat=CARDS.filter(function(c){return c.topic==='Mental';});
  if(Math.random()<0.4&&stat.length){var d=buildDeck(stat,6);return d[Math.floor(Math.random()*d.length)];}
  return GEN.mental();
}
function startStreak(){sess={kind:'streak',title:'Streak',cur:GEN.streak(sc.topic,sc.level),i:0,shown:false,run:0,best:0,right:0,wrong:0,topics:{},flips:[],missed:[],t0:Date.now(),flip:null};V='card';render();}
function curCard(){return sess.kind==='deck'?sess.q[sess.i]:sess.cur;}

function renderAnswer(a){
  var lines=String(a).split('\n'),h='',list=[],lead=[];
  lines.forEach(function(l){if(/^- /.test(l))list.push(l.slice(2));else if(l.trim()){if(list.length){h+='<ul>'+list.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>';list=[];}lead.push(l);}});
  var out=lead.length?'<p class="lead">'+esc(lead.join('\n'))+'</p>':'';
  return out+h+(list.length?'<ul>'+list.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>':'');
}
function viewCard(){
  var c=curCard(),k=sess.kind,right;
  if(k==='deck')right=(sess.i+1)+' of '+sess.q.length;
  else if(k==='mental')right=sess.i+' done';
  else right='Streak '+sess.run+' · Best '+sess.best+(sc.target?' · Goal '+sc.target:'');
  var h='<div class="top"><button data-act="close">'+(k==='deck'?'Close':'End')+'</button><span>'+esc(right)+'</span></div>';
  h+='<div class="read" id="rd" data-act="flip"><div class="kick">'+esc(c.topic)+'</div><div class="q'+(c.q.length>200?' long':'')+'">'+esc(c.q)+'</div>';
  if(c.hint&&sess.hint&&!sess.shown)h+='<div class="hint">'+esc(c.hint)+'</div>';
  if(sess.shown)h+='<div class="ans">'+renderAnswer(c.a)+(c.hint?'<div class="hint">'+esc(c.hint)+'</div>':'')+'</div>';
  else h+='<div class="tap">Tap to reveal'+(c.hint&&!sess.hint?' · <span data-act="hint" style="text-decoration:underline">hint</span>':'')+'</div>';
  h+='</div>';
  if(sess.shown)h+='<div class="grade"><button class="bad" data-act="again">Missed</button><button class="good" data-act="good">Got it</button></div>';
  app.innerHTML=h;
}
function grade(ok){
  var c=curCard();
  if(sess.kind==='streak'){
    if(sess.flip!=null)sess.flips.push(sess.flip);
    var tp=sess.topics[c.topic]||{n:0,c:0};tp.n++;if(ok)tp.c++;sess.topics[c.topic]=tp;
    record(null,ok);
    if(ok){sess.right++;sess.run++;if(sess.run>sess.best)sess.best=sess.run;}
    else{sess.wrong++;sess.run=0;sess.missed.push(c);}
    sess.i++;
    if(sc.target&&sess.run>=sc.target){sess.cleared=true;return endStreak();}
    sess.cur=GEN.streak(sc.topic,sc.level);sess.shown=false;sess.t0=Date.now();sess.flip=null;return render();
  }
  record(c.gen?null:c.id,ok,!!(sess.re&&sess.re[c.id]));
  if(ok)sess.right++;else{sess.wrong++;sess.missed.push(c);}
  if(sess.kind==='deck'){
    if(!ok&&!sess.re[c.id]){sess.re[c.id]=1;var pos=Math.min(sess.q.length,sess.i+5);sess.q.splice(pos,0,c);}
    sess.i++;sess.shown=false;sess.hint=false;
    if(sess.i>=sess.q.length){V='done';}
  } else {sess.i++;sess.shown=false;sess.hint=false;sess.cur=nextMental();}
  render();
}
function avg(a){if(!a.length)return 0;var s=0;a.forEach(function(x){s+=x;});return s/a.length;}
function streakText(){
  var n=sess.right+sess.wrong,pct=n?Math.round(100*sess.right/n):0;
  var t='Streak '+dkey()+'\nTopic '+sc.topic+', level '+sc.level+', goal '+(sc.target||'endless')+'\nCleared: '+(sess.cleared?'yes':'no')+'\nCards '+n+', correct '+sess.right+' ('+pct+'%), longest '+sess.best+'\nAvg time to flip '+Math.round(avg(sess.flips))+'s\nBy topic: '+Object.keys(sess.topics).map(function(k){return k+' '+sess.topics[k].c+'/'+sess.topics[k].n;}).join(', ');
  if(sess.missed.length)t+='\nMissed:\n'+sess.missed.map(function(c){return '- '+c.q.slice(0,110);}).join('\n');
  return t;
}
function endStreak(){
  var n=sess.right+sess.wrong;
  if(n){var b=S.streak.best;if(!b[sc.level]||sess.best>b[sc.level])b[sc.level]=sess.best;if(sess.cleared)S.streak.cleared=(S.streak.cleared||0)+1;
    S.streak.runs.unshift({d:dkey(),topic:sc.topic,level:sc.level,target:sc.target,n:n,right:sess.right,best:sess.best,cleared:!!sess.cleared,flip:Math.round(avg(sess.flips))});S.streak.runs=S.streak.runs.slice(0,50);save();V='done';}
  else{sess=null;clearResume();V='home';}
  render();
}
function viewDone(){
  var n=sess.right+sess.wrong,pct=n?Math.round(100*sess.right/n):0,h;
  if(sess.kind==='streak'){
    h='<h1>'+(sess.cleared?'Cleared':'Streak over')+'</h1><div class="sub">Longest '+sess.best+' · '+sess.right+' of '+n+' · '+Math.round(avg(sess.flips))+'s a card</div>';
    h+='<pre class="res">'+esc(streakText())+'</pre>';
    h+='<button class="go" data-act="copyres">Copy results</button><button class="go sec2" data-act="again-streak">Go again</button><button class="go sec2" data-act="home">Home</button>';
    return page(h);
  }
  h='<h1>'+sess.right+' of '+n+'</h1><div class="sub">'+esc(sess.title)+' · '+pct+'%</div>';
  var seen={},ms=sess.missed.filter(function(c){var k=c.id||c.q;if(seen[k])return false;seen[k]=1;return true;});
  if(ms.length){h+='<div class="sec">Missed</div>'+ms.map(function(c){return '<div class="mq">'+esc(c.q)+'</div>';}).join('');}
  if(ms.length&&sess.kind==='deck')h+='<button class="go" data-act="redo">Go over the missed ones</button>';
  h+='<button class="go'+(ms.length&&sess.kind==='deck'?' sec2':'')+'" data-act="home">Home</button>';
  page(h);
}

/* screens */
function viewHome(){
  var c=counts(),d=new Date(),days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],mo=['January','February','March','April','May','June','July','August','September','October','November','December'];
  var td=S.days[dkey()]||{n:0};
  var h='<h1>Drill</h1><div class="date">'+days[d.getDay()]+', '+mo[d.getMonth()]+' '+d.getDate()+(td.n?' · '+td.n+' today':'')+'</div>';
  if(S.last)h+='<div class="date" style="margin-top:2px">Last: '+esc(S.last.title)+', '+S.last.right+' of '+S.last.n+', '+ago(S.last.d)+'</div>';
  h+='<div class="sec">Practice</div>';
  if(S.resume){var R=S.resume,lab=R.kind==='deck'?(R.i+1)+' of '+R.q.length:R.kind==='streak'?'streak '+(R.run||0):R.i+' done';h+=row('Continue: '+R.title,lab,'resume');}
  h+=row('Review',c.due?c.due+' due':'New cards','review');
  h+=row('Mental math','In your head','mental');
  h+=row('Streak',(S.streak.best[sc.level]?'Best '+S.streak.best[sc.level]:'Randomized'),'streakset');
  if(c.miss)h+=row('Missed',String(c.miss),'missed');
  h+='<div class="sec">Topics</div>';
  TOPICS.forEach(function(t){var all=CARDS.filter(function(x){return x.topic===t;}),seen=all.filter(function(x){return st(x.id);}).length;h+=row(t,seen+' / '+all.length,'topic',t);});
  h+='<div class="foot"><button data-act="progress">Progress</button><button data-act="settings">Settings</button></div>';
  page(h);
}
function viewStreakSet(){
  var h='<div class="top" style="padding:0 0 10px"><button data-act="home">Back</button><span></span></div><h1>Streak</h1><div class="sub">New numbers every card. A miss resets you to zero.</div>';
  h+='<div class="sec">Topic</div><div class="opts">'+opt('All',sc.topic==='All','stopic','All')+GEN.streakTopics.map(function(t){return opt(t,sc.topic===t,'stopic',t);}).join('')+'</div>';
  h+='<div class="sec">Level</div><div class="opts">'+[1,2,3,4].map(function(l){return opt(String(l),sc.level===l,'slevel',l);}).join('')+'</div>';
  h+='<div class="note">'+['','One step, clean setup.','Two steps chained.','Three steps chained, with the usual traps.','Three steps, widest number ranges. Best with All.'][sc.level]+'</div>';
  h+='<div class="sec">Goal</div><div class="opts">'+[[5,'5'],[7,'7'],[10,'10'],[15,'15'],[0,'Endless']].map(function(x){return opt(x[1],sc.target===x[0],'starget',x[0]);}).join('')+'</div>';
  h+='<button class="go" data-act="sstart">Start</button>';
  page(h);
}
function viewProgress(){
  var c=counts(),tot=0,rt=0,i;
  CARDS.forEach(function(x){var s=st(x.id);if(s){tot+=s.s;rt+=s.c;}});
  var h='<div class="top" style="padding:0 0 10px"><button data-act="home">Back</button><span></span></div><h1>Progress</h1>';
  h+='<div class="stat"><div><b>'+(tot?Math.round(100*rt/tot):0)+'%</b><span>accuracy</span></div><div><b>'+c.seen+'</b><span>cards seen</span></div><div><b>'+c.mast+'</b><span>solid</span></div></div>';
  h+='<div class="sec">Last 14 days</div><div class="days">';var arr=[],mx=1;for(i=13;i>=0;i--){var d=new Date();d.setDate(d.getDate()-i);var r=S.days[dkey(d)]||{n:0};arr.push(r.n);if(r.n>mx)mx=r.n;}
  h+=arr.map(function(n){return '<i class="'+(n?'':'z')+'" style="height:'+Math.max(4,Math.round(100*n/mx))+'%"></i>';}).join('')+'</div>';
  h+='<div class="sec">By topic</div>';
  TOPICS.forEach(function(t){var a=0,r=0;CARDS.forEach(function(x){if(x.topic!==t)return;var s=st(x.id);if(s){a+=s.s;r+=s.c;}});h+='<div class="row" style="cursor:default"><span class="t">'+esc(t)+'</span><span class="s">'+(a?Math.round(100*r/a)+'% of '+a:'not started')+'</span></div>';});
  h+='<div class="sec">Recent streaks</div>';
  if(!S.streak.runs.length)h+='<div class="note">None yet.</div>';
  S.streak.runs.slice(0,10).forEach(function(r){h+='<div class="row" style="cursor:default"><span class="t" style="font-size:16px">'+esc(r.d.slice(5))+' · L'+r.level+' · '+esc(r.topic)+'</span><span class="s">'+(r.cleared?'cleared · ':'')+'best '+r.best+'</span></div>';});
  page(h);
}
function viewSettings(){
  var h='<div class="top" style="padding:0 0 10px"><button data-act="home">Back</button><span></span></div><h1>Settings</h1><div class="sub">'+CARDS.length+' cards · build '+esc(window.DRILL_BUILD||'dev')+'</div>';
  h+='<div class="sec">Appearance</div><div class="opts">'+[['auto','Auto'],['light','Light'],['dark','Dark']].map(function(x){return opt(x[1],S.set.theme===x[0],'theme',x[0]);}).join('')+'</div>';
  h+='<div class="sec">Cards per session</div><div class="opts">'+[10,15,20,30,50].map(function(n){return opt(String(n),S.set.per===n,'per',n);}).join('')+'</div>';
  h+='<div class="sec">Backup</div><div class="note">Progress lives on this phone. Save a copy now and then.</div><button class="link" data-act="share">Save backup file</button><button class="link" data-act="copybk">Copy backup text</button>';
  h+='<div class="sec">Restore</div><textarea id="rs" placeholder="Paste backup text"></textarea><button class="link" data-act="restore">Restore</button>';
  h+='<div class="sec">App</div><button class="link" data-act="update">Check for update</button><button class="link" data-act="reset" style="color:var(--mut)">'+(arm?'Tap again to erase everything':'Reset progress')+'</button>';
  page(h);
}
function copyText(t,msg){
  function fb(){var ta=document.createElement('textarea');ta.value=t;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');toast(msg);}catch(e){toast('Copy failed');}document.body.removeChild(ta);}
  try{if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(function(){toast(msg);},fb);else fb();}catch(e){fb();}
}
function shareBackup(){
  var txt=JSON.stringify(S),name='drill-backup-'+dkey()+'.json';
  try{var file=new File([txt],name,{type:'application/json'});
    if(navigator.canShare&&navigator.canShare({files:[file]})){navigator.share({files:[file],title:'Drill backup'}).catch(function(){});return;}}catch(e){}
  try{var b=new Blob([txt],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();document.body.removeChild(a);setTimeout(function(){URL.revokeObjectURL(u);},3000);}catch(e){copyText(txt,'Backup copied');}
}

function render(){
  if(V==='card'&&sess){persist();return viewCard();}
  if(V==='done'&&sess){if(!sess.logged){sess.logged=1;logSession();clearResume();}return viewDone();}
  if(V==='streakset')return viewStreakSet();
  if(V==='progress')return viewProgress();
  if(V==='settings')return viewSettings();
  V='home';viewHome();
}
function act(a,v){
  switch(a){
    case 'home':sess=null;V='home';arm=false;render();break;
    case 'resume':if(!resumeSess()){clearResume();toast('Nothing to continue');}render();break;
    case 'review':var due=CARDS.filter(function(c){var s=st(c.id);return s&&s.d<=today();});startDeck('Review',buildDeck(due.length?due.concat(CARDS.filter(function(c){return !st(c.id);})):CARDS,S.set.per));break;
    case 'mental':startMental();break;
    case 'missed':startDeck('Missed',shuffle(CARDS.filter(function(c){var s=st(c.id);return s&&s.m;})));break;
    case 'topic':startDeck(v,buildDeck(CARDS.filter(function(c){return c.topic===v;}),S.set.per));break;
    case 'streakset':V='streakset';render();break;
    case 'stopic':sc.topic=v;render();break;
    case 'slevel':sc.level=+v;render();break;
    case 'starget':sc.target=+v;render();break;
    case 'sstart':case 'again-streak':startStreak();break;
    case 'progress':V='progress';render();break;
    case 'settings':V='settings';arm=false;render();break;
    case 'hint':sess.hint=true;render();break;
    case 'flip':if(sess&&!sess.shown){if(sess.kind==='streak')sess.flip=(Date.now()-sess.t0)/1000;sess.shown=true;render();}break;
    case 'good':grade(true);break;
    case 'again':grade(false);break;
    case 'close':
      if(sess.kind==='streak')return endStreak();
      if(sess.right+sess.wrong===0){sess=null;clearResume();V='home';return render();}
      V='done';render();break;
    case 'redo':var seen={},ms=sess.missed.filter(function(c){if(seen[c.id])return false;seen[c.id]=1;return true;});startDeck('Missed',shuffle(ms));break;
    case 'copyres':copyText(streakText(),'Copied');break;
    case 'theme':S.set.theme=v;save();theme();render();break;
    case 'per':S.set.per=+v;save();render();break;
    case 'share':shareBackup();break;
    case 'copybk':copyText(JSON.stringify(S),'Backup copied');break;
    case 'restore':try{var o=JSON.parse(document.getElementById('rs').value);if(!o||typeof o.cards!=='object'||!o.streak)throw 0;S=o;var f=fresh();for(var k in f)if(S[k]==null)S[k]=f[k];for(var k2 in f.set)if(S.set[k2]==null)S.set[k2]=f.set[k2];save();theme();toast('Restored');render();}catch(e){toast('Not a valid backup');}break;
    case 'update':if('serviceWorker' in navigator){navigator.serviceWorker.getRegistration().then(function(r){if(!r){toast('Offline mode not set up yet');return;}r.update().then(function(){toast(r.installing||r.waiting?'Updating…':'Up to date');}).catch(function(){toast('You are offline');});});}else toast('Not supported here');break;
    case 'reset':if(!arm){arm=true;render();}else{S=fresh();save();theme();arm=false;toast('Erased');render();}break;
  }
}
app.addEventListener('click',function(e){var el=e.target.closest('[data-act]');if(!el)return;var a=el.getAttribute('data-act');if(a!=='flip')e.stopPropagation();act(a,el.getAttribute('data-v'));});
document.addEventListener('keydown',function(e){
  if(V!=='card'||!sess)return;
  if(e.key===' '||e.key==='Enter'){e.preventDefault();if(!sess.shown)act('flip');else act('good');}
  else if(sess.shown&&(e.key==='1'||e.key==='ArrowLeft'))act('again');
  else if(sess.shown&&(e.key==='2'||e.key==='ArrowRight'))act('good');
  else if(e.key==='Escape')act('close');
});
if(window.matchMedia){try{window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',theme);}catch(e){}}
try{if('serviceWorker' in navigator&&location.protocol!=='file:'){
  var hadCtrl=!!navigator.serviceWorker.controller,pendingReload=false;
  navigator.serviceWorker.addEventListener('controllerchange',function(){
    if(!hadCtrl){hadCtrl=true;return;}
    try{sessionStorage.setItem('drill.updated','1');}catch(e){}
    if(V==='card'&&sess)persist();
    location.reload();
  });
  window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').then(function(r){try{r.update();}catch(e){}}).catch(function(){});});
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible'){navigator.serviceWorker.getRegistration().then(function(r){if(r)r.update().catch(function(){});});}});
}}catch(e){}
try{if(sessionStorage.getItem('drill.updated')){sessionStorage.removeItem('drill.updated');setTimeout(function(){toast('Updated to the latest version');},400);if(S.resume)resumeSess();}}catch(e){}
render();
})();
