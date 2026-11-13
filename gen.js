// Random card generators. Streak cards (multi-step) and Mental cards (easy numbers).
(function(){
var pick=function(a){return a[Math.floor(Math.random()*a.length)];};
var shuffle=function(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;};
var f=function(x,d){d=(d===undefined)?2:d;var s=(Math.round(x*Math.pow(10,d))/Math.pow(10,d)).toFixed(d);if(s.indexOf('.')>=0)s=s.replace(/0+$/,'').replace(/\.$/,'');return s==='-0'?'0':s;};
var pc=function(x,d){return f(x*100,d===undefined?1:d)+'%';};
var sg=function(x){var v=Math.round(x*100)/100;return v===0?'no change':(v>0?'+':'-')+Math.abs(v);};
var A=function(head,b){return head+(b&&b.length?'\n- '+b.join('\n- '):'');};
var range=function(a,b,s){var r=[];for(var x=a;x<=b+1e-9;x+=(s||1))r.push(Math.round(x*100)/100);return r;};

/* ---------- STREAK GENERATORS ---------- */
var EVENTS=[
 function(x){return {t:'issues $'+x+' of new shares and keeps the cash',ev:0,nd:-x,eq:x,w:'New shares: equity value up, cash up so net debt down.'};},
 function(x){return {t:'borrows $'+x+' and keeps the cash',ev:0,nd:0,eq:0,w:'Debt and cash both up: nothing changes.'};},
 function(x){return {t:'repays $'+x+' of debt with cash',ev:0,nd:0,eq:0,w:'Debt and cash both down: net debt flat.'};},
 function(x){return {t:'buys back $'+x+' of stock with cash',ev:0,nd:x,eq:-x,w:'Cash out: net debt up, equity value down.'};},
 function(x){return {t:'pays a $'+x+' cash dividend',ev:0,nd:x,eq:-x,w:'Cash out: net debt up, equity value down.'};},
 function(x){return {t:'borrows $'+x+' and pays it out as a dividend',ev:0,nd:x,eq:-x,w:'Debt up with no cash kept: net debt up, equity value down.'};},
 function(x){return {t:'buys a business worth $'+x+' with cash',ev:x,nd:x,eq:0,w:'Cash out raises net debt; new operations add EV.'};},
 function(x){return {t:'buys a business worth $'+x+' by issuing stock',ev:x,nd:0,eq:x,w:'New shares raise equity value; new operations add EV.'};},
 function(x){return {t:'sells a division worth $'+x+' and keeps the cash',ev:-x,nd:-x,eq:0,w:'Operations leave EV; cash in lowers net debt.'};},
 function(x){return {t:'sells a division worth $'+x+' and repays debt with it',ev:-x,nd:-x,eq:0,w:'Operations leave EV; debt down lowers net debt.'};},
 function(x){return {t:'uses $'+x+' of cash to buy a 30% stake in another company',ev:0,nd:x,eq:0,w:'Cash out raises net debt, but the stake is subtracted in the bridge, so EV is flat.'};},
 function(x){return {t:'sees a $'+x+' in-the-money convertible convert to stock',ev:0,nd:-x,eq:x,w:'Debt becomes equity: net debt down, equity value up.'};},
 function(x){return {t:'issues $'+x+' of stock and uses it to repay debt',ev:0,nd:-x,eq:x,w:'Debt swapped for equity: net debt down, equity value up.'};}
];
function gEvents(L){
  var n=L<=1?1:(L===2?2:3),ps=shuffle(EVENTS).slice(0,n),tot={ev:0,nd:0,eq:0},ts=[],ws=[];
  ps.forEach(function(p){var x=pick([20,25,40,50,60,75,80,100,120,150,200]);var e=p(x);tot.ev+=e.ev;tot.nd+=e.nd;tot.eq+=e.eq;ts.push(e.t);ws.push(e.w);});
  return {topic:'Enterprise Value',q:'A company '+ts.join(', then ')+'. What happens to EV, net debt and equity value?',
    a:A('EV '+sg(tot.ev)+', net debt '+sg(tot.nd)+', equity value '+sg(tot.eq)+'.',ws)};
}
function gBridge(L){
  var e=pick(range(40,300,10)),m=pick(range(5,14,0.5)),d=pick(range(50,400,25)),c=pick(range(10,150,5)),n=L>=2?pick([5,10,15,20,25,30]):0,p=L>=3?pick([10,15,20,25,40]):0,s=pick([10,20,25,40,50,80,100]);
  var ev=e*m,eq=ev-d+c-n-p;
  if(eq<=0)return gBridge(L);
  return {topic:'Enterprise Value',q:'EBITDA $'+e+'M, peers trade at '+m+'x EV/EBITDA. Debt $'+d+'M, cash $'+c+'M'+(n?', NCI $'+n+'M':'')+(p?', preferred $'+p+'M':'')+', '+s+'M diluted shares. Implied share price?',
    a:A('$'+f(eq/s)+' per share.',['EV = '+e+' x '+m+' = '+f(ev,1)+'.','Equity = '+f(ev,1)+' - '+d+' + '+c+(n?' - '+n:'')+(p?' - '+p:'')+' = '+f(eq,1)+'.','Price = '+f(eq,1)+' / '+s+'.'])};
}
function gTSM(L){
  var P=pick([15,20,25,30,40,50,60,75,80,100]),S=pick([50,80,100,150,200,250,400,500]);
  var K=pick(range(5,P-1,5).length?range(5,P-1,5):[P/2]),N=pick([5,10,15,20,25,40,50]),net=N-N*K/P,r=L>=2?pick([2,4,5,8,10]):0;
  var cv=L>=3,face=pick([50,100,150,200,300]),kc=pick(range(5,P+20,5)),cs=(cv&&kc<P)?face/kc:0,tot=S+net+r+cs;
  var b=['Options: '+N+' - ('+N+' x '+K+' / '+P+') = '+f(net)+'M net new shares.'];
  if(r)b.push('RSUs: +'+r+'M in full.');
  if(cv)b.push(kc<P?'Convert in the money ($'+P+' > $'+kc+'): +'+f(cs)+'M shares, remove $'+face+'M of debt.':'Convert out of the money ($'+kc+' > $'+P+'): stays as debt.');
  b.push(f(tot)+'M x $'+P+'.');
  return {topic:'Enterprise Value',q:'Stock at $'+P+'. '+S+'M basic shares, '+N+'M options at $'+K+(r?', '+r+'M RSUs':'')+(cv?', and a $'+face+'M convertible at a $'+kc+' conversion price':'')+'. Diluted shares and equity value?',
    a:A(f(tot)+'M shares, $'+f(tot*P,1)+'M equity value.',b)};
}
function gAccretion(L){
  var aPE=pick([8,10,12,14,15,16,18,20,25,30]),bPE=pick([6,8,10,12,14,15,18,20,25]),aNI=pick([50,100,150,200,300,400]),aSh=pick([20,25,40,50,100,200]),bNI=pick([10,20,25,30,40,50,60,80]);
  var aEPS=aNI/aSh,aPx=aEPS*aPE,price=bNI*bPE,t=pick([0.2,0.25,0.3]),kd=pick([0.04,0.05,0.06,0.07,0.08,0.1]),kc=pick([0.01,0.02,0.03]);
  var ms=L<=1?1:pick([0,0.25,0.5,0.75]),md=L<=1?0:(1-ms)*pick([0,0.5,1]),mc=1-ms-md;
  var ns=price*ms/aPx,cost=(price*md*kd+price*mc*kc)*(1-t),pf=(aNI+bNI-cost)/(aSh+ns),acc=pf>aEPS+1e-9;
  var mix=[];if(ms)mix.push(pc(ms,0)+' stock');if(md)mix.push(pc(md,0)+' debt at '+pc(kd,0));if(mc>1e-9)mix.push(pc(mc,0)+' cash earning '+pc(kc,0));
  var b=['Standalone EPS $'+f(aEPS)+'; buyer share price $'+f(aPx)+'.'];
  if(ns)b.push('New shares: '+f(price*ms,1)+' / '+f(aPx)+' = '+f(ns)+'M.');
  if(cost)b.push('After-tax financing cost: $'+f(cost)+'M.');
  b.push('Pro forma EPS: ('+aNI+' + '+bNI+(cost?' - '+f(cost):'')+') / '+f(aSh+ns)+' = $'+f(pf)+'.');
  if(L===1)b.push('Shortcut: '+aPE+'x buyer vs '+bPE+'x target. '+(aPE>bPE?'Higher buys lower: accretive.':aPE<bPE?'Lower buys higher: dilutive.':'Equal: neutral.'));
  var q='Buyer: NI $'+aNI+'M, '+aSh+'M shares, P/E '+aPE+'x. Target: NI $'+bNI+'M, bought at '+bPE+'x ($'+price+'M). Paid '+mix.join(', ')+(L>1?'. Tax '+pc(t,0):'')+'. Accretive or dilutive?';
  if(L>=3){var need=(aEPS-pf)*(aSh+ns)/(1-t);q+=' Break-even pretax synergies?';b.push(need>0?'Break-even synergies: '+f(aEPS-pf,3)+' x '+f(aSh+ns)+' / (1 - '+t+') = $'+f(need)+'M.':'No synergies needed.');}
  return {topic:'M&A',q:q,a:A((acc?'Accretive':'Dilutive')+': EPS $'+f(aEPS)+' to $'+f(pf)+' ('+(pf>=aEPS?'+':'')+pc(pf/aEPS-1)+').',b)};
}
function gPremium(L){
  var e=pick(range(20,200,10)),um=pick(range(6,14,1)),sh=pick([10,20,25,40,50,100]),nd=pick(range(0,300,25)),prem=pick([0.2,0.25,0.3,0.35,0.4,0.5]);
  var px=Math.round(((e*um-nd)/sh)*2)/2;if(px<=1)return gPremium(L);
  var off=px*(1+prem),eq=off*sh,ev=eq+nd;
  return {topic:'M&A',q:'Unaffected price $'+px+', '+sh+'M diluted shares, net debt $'+nd+'M, EBITDA $'+e+'M. A buyer offers a '+pc(prem,0)+' premium. Offer price and implied EV/EBITDA?',
    a:A('$'+f(off)+' per share, '+f(ev/e,1)+'x EBITDA.',['Offer: '+px+' x '+f(1+prem)+' = '+f(off)+'.','Equity value: '+f(off)+' x '+sh+' = '+f(eq,1)+'M; EV = + '+nd+' net debt = '+f(ev,1)+'M.','Unaffected was about '+f((px*sh+nd)/e,1)+'x; the premium lifts the multiple.'])};
}
function gWACC(L){
  var rf=pick([2.5,3,3.5,4,4.5,5]),erp=pick([4.5,5,5.5,6,6.5]),t=pick([0.21,0.25,0.3]),kd=pick([4,5,6,7,8,9]);
  if(L<=2){var b=pick([0.6,0.8,0.9,1,1.1,1.2,1.3,1.5,1.8]),d=pick([10,20,25,30,40,50]),ke=rf+b*erp,w=(100-d)/100*ke+d/100*kd*(1-t);
    return {topic:'WACC',q:'rf '+rf+'%, ERP '+erp+'%, beta '+b+'. Pretax cost of debt '+kd+'%, tax '+pc(t,0)+', debt '+d+'% of capital. Cost of equity and WACC?',
      a:A('Ke '+f(ke)+'%, WACC '+f(w)+'%.',['Ke = '+rf+' + '+b+' x '+erp+'.','After-tax Kd = '+kd+' x '+f(1-t)+' = '+f(kd*(1-t))+'%.','WACC = '+(100-d)+'% x '+f(ke)+' + '+d+'% x '+f(kd*(1-t))+'.'])};}
  var bs=[pick([0.7,0.8,0.9,1,1.1,1.2]),pick([0.8,1,1.2,1.4]),pick([0.9,1.1,1.3,1.5])],bu=(bs[0]+bs[1]+bs[2])/3,de=pick([0.2,0.25,0.33,0.5,0.75,1]),bl=bu*(1+(1-t)*de),ke2=rf+bl*erp,wd=de/(1+de),w2=(1-wd)*ke2+wd*kd*(1-t);
  return {topic:'WACC',q:'Comps unlevered betas: '+bs.join(', ')+'. Target D/E '+de+', tax '+pc(t,0)+', rf '+rf+'%, ERP '+erp+'%, pretax Kd '+kd+'%. Levered beta, Ke and WACC?',
    a:A('Beta '+f(bl)+', Ke '+f(ke2)+'%, WACC '+f(w2)+'%.',['Average unlevered beta '+f(bu,3)+'.','Relever: '+f(bu,3)+' x (1 + '+f(1-t)+' x '+de+') = '+f(bl,3)+'.','Weights: D '+pc(wd)+', E '+pc(1-wd)+'; after-tax Kd '+f(kd*(1-t))+'%.'])};
}
function gLBO(L){
  var e0=pick(range(20,200,10)),em=pick(range(6,14,0.5)),lv=pick(range(3,7,0.5)),yr=pick([3,4,5,6,7]),g=pick([0,0.03,0.05,0.07,0.08,0.1,0.12,0.15]),xm=L<=1?em:pick([em-2,em-1,em-0.5,em,em+0.5,em+1,em+2]),pd=L<=1?0.5:pick([0,0.2,0.3,0.4,0.5,0.6,0.75,1]);
  if(lv>=em-1)return gLBO(L);
  var e1=e0*Math.pow(1+g,yr),ev0=e0*em,d0=e0*lv,q0=ev0-d0,d1=d0*(1-pd),ev1=e1*xm,q1=ev1-d1,mo=q1/q0,irr=Math.pow(Math.max(mo,0.0001),1/yr)-1;
  return {topic:'LBO',q:'Buy at '+em+'x EBITDA of $'+e0+'M with '+lv+'x leverage. EBITDA grows '+pc(g,0)+' a year for '+yr+' years, '+pc(pd,0)+' of debt is repaid, exit at '+xm+'x. MOIC and IRR?',
    a:A(f(mo)+'x MOIC, '+pc(irr)+' IRR.',['Entry: EV '+f(ev0,1)+', debt '+f(d0,1)+', equity '+f(q0,1)+'.','Exit: EBITDA '+f(e1,1)+', EV '+f(ev1,1)+', debt '+f(d1,1)+', equity '+f(q1,1)+'.','IRR = '+f(mo)+'^(1/'+yr+') - 1.'])};
}
function gLBOexit(L){
  var e0=pick(range(50,200,10)),em=pick(range(7,12,1)),lv=pick([4,5,6]),yr=5,g=pick([0.05,0.08,0.1]),pd=pick([0.25,0.5]),tm=pick([2,2.5,3]);
  if(lv>=em-1)return gLBOexit(L);
  var q0=e0*(em-lv),need=q0*tm,d1=e0*lv*(1-pd),e1=e0*Math.pow(1+g,yr),xm=(need+d1)/e1;
  return {topic:'LBO',q:'Buy at '+em+'x EBITDA of $'+e0+'M with '+lv+'x leverage. EBITDA grows '+pc(g,0)+' a year for 5 years and '+pc(pd,0)+' of debt is repaid. What exit multiple gets a '+tm+'x MOIC?',
    a:A(f(xm,1)+'x.',['Equity in '+f(q0,1)+', so equity out must be '+f(need,1)+'.','Exit EV = '+f(need,1)+' + debt '+f(d1,1)+' = '+f(need+d1,1)+'.','Exit EBITDA '+f(e1,1)+', so multiple = '+f(need+d1,1)+' / '+f(e1,1)+'.'])};
}
function gUFCF(L){
  var r=pick(range(100,1000,50)),m=pick([0.15,0.2,0.25,0.3,0.35,0.4]),da=pick([0.03,0.04,0.05,0.06]),cx=pick([0.04,0.05,0.06,0.08]),t=pick([0.21,0.25,0.3]),nw=pick([-10,-5,0,5,10,15,20]),sbc=L>=3?pick([5,10,15]):0;
  var eb=r*m,dp=r*da,ebit=eb-dp,np=ebit*(1-t),cp=r*cx,u=np+dp-cp-nw;
  return {topic:'DCF',q:'Revenue $'+r+'M, EBITDA margin '+pc(m,0)+', D&A '+pc(da,0)+' of revenue, capex '+pc(cx,0)+' of revenue, tax '+pc(t,0)+'. Net working capital '+(nw>=0?'rises':'falls')+' by $'+Math.abs(nw)+'M.'+(sbc?' EBITDA is after $'+sbc+'M of SBC.':'')+' Unlevered FCF?',
    a:A('$'+f(u,1)+'M.',['EBIT = '+f(eb,1)+' - '+f(dp,1)+' = '+f(ebit,1)+'; NOPAT = '+f(np,1)+'.','+ D&A '+f(dp,1)+', - capex '+f(cp,1)+', '+(nw>=0?'- ':'+ ')+Math.abs(nw)+' working capital.'].concat(sbc?['SBC stays as a cost; do not add it back.']:[]))};
}
function gGordon(L){
  var c=pick(range(20,200,10)),w=pick([0.07,0.08,0.09,0.1,0.11,0.12]),g=pick([0.01,0.015,0.02,0.025,0.03,0.035]),n=pick([5,7,10]),tv=c*(1+g)/(w-g),pv=tv/Math.pow(1+w,n);
  var b=['TV = '+c+' x '+f(1+g,3)+' / ('+f(w)+' - '+f(g,3)+') = '+f(tv,1)+'.','PV = '+f(tv,1)+' / '+f(1+w)+'^'+n+' = '+f(pv,1)+'.'],q='Final-year (year '+n+') FCF $'+c+'M, WACC '+pc(w,0)+', terminal growth '+pc(g)+'. Terminal value and its present value?';
  if(L>=2){var eb=c*pick([1.4,1.5,1.6,1.8,2]);q+=' Implied exit multiple on $'+f(eb,0)+'M EBITDA?';b.push('Implied multiple '+f(tv,1)+' / '+f(eb,0)+' = '+f(tv/eb,1)+'x.');}
  return {topic:'DCF',q:q,a:A('TV $'+f(tv,1)+'M, PV $'+f(pv,1)+'M.',b)};
}
function gPV(L){
  var r=pick([0.08,0.1,0.12]),cf=[pick([10,20,30]),pick([20,30,40]),pick([30,40,50])],pv=0,parts=[];
  cf.forEach(function(x,i){var v=x/Math.pow(1+r,i+1);pv+=v;parts.push(x+' / '+f(1+r)+'^'+(i+1)+' = '+f(v,1));});
  return {topic:'DCF',q:'Cash flows of $'+cf.join('M, $')+'M in years 1 to 3. Discount rate '+pc(r,0)+'. Present value?',a:A('$'+f(pv,1)+'M.',parts)};
}
function m3(){return {ni:0,cfo:0,cfi:0,cff:0,cash:0,oa:0,li:0,eq:0,w:[]};}
function g3S(L){
  var t=pick([0.2,0.25,0.3,0.4,0.5]),X=pick([10,20,30,40,50,60,80,100]);
  var L3=[
   function(){var e=m3();e.d='depreciation rises by $'+X;e.ni=-X*(1-t);e.cfo=e.ni+X;e.oa=-X;e.eq=e.ni;e.w.push('Depreciation '+X+': NI '+sg(e.ni)+', add back '+X+', cash up by the '+f(X*t)+' tax shield.');return e;},
   function(){var e=m3(),B=X,P=X+pick([10,20,30,40]),gn=P-B;e.d='sells equipment carried at $'+B+' for $'+P;e.ni=gn*(1-t);e.cfo=e.ni-gn;e.cfi=P;e.oa=-B;e.eq=e.ni;e.w.push('Sale: gain '+gn+', NI '+sg(e.ni)+'; remove gain from CFO, '+P+' in investing; PP&E -'+B+'.');return e;},
   function(){var e=m3(),D=X*2,r=pick([0.05,0.08,0.1]),dp=pick([5,10,20]),it=D*r;e.d='buys a $'+D+' asset with debt at '+pc(r,0)+', depreciating $'+dp+' in the year';e.ni=-(dp+it)*(1-t);e.cfo=e.ni+dp;e.cfi=-D;e.cff=D;e.oa=D-dp;e.li=D;e.eq=e.ni;e.w.push('Debt-funded asset: interest '+f(it)+' on the debt, depreciation '+dp+'; debt +'+D+', PP&E +'+(D-dp)+'.');return e;},
   function(){var e=m3();e.d='writes down an asset by $'+X+' (tax deductible)';e.ni=-X*(1-t);e.cfo=e.ni+X;e.oa=-X;e.eq=e.ni;e.w.push('Write-down: NI '+sg(e.ni)+', add back '+X+', cash up by the '+f(X*t)+' tax saving.');return e;},
   function(){var e=m3();e.d='accrues $'+X+' of PIK interest';e.ni=-X*(1-t);e.cfo=e.ni+X;e.li=X;e.eq=e.ni;e.w.push('PIK: NI '+sg(e.ni)+', non-cash so add back '+X+'; debt +'+X+'.');return e;},
   function(){var e=m3();e.d='collects $'+X+' upfront for future service';e.cfo=X;e.li=X;e.w.push('Prepayment: cash +'+X+', deferred revenue +'+X+', no IS impact.');return e;},
   function(){var e=m3();e.d='records $'+X+' of stock comp (deductible)';e.ni=-X*(1-t);e.cfo=e.ni+X;e.eq=e.ni+X;e.w.push('SBC: NI '+sg(e.ni)+', add back '+X+'; APIC +'+X+'.');return e;},
   function(){var e=m3();e.d='buys back $'+X+' of stock';e.cff=-X;e.eq=-X;e.w.push('Buyback: cash -'+X+', equity -'+X+'.');return e;},
   function(){var e=m3();e.d='buys $'+X+' of inventory on credit';e.oa=X;e.li=X;e.w.push('Inventory on credit: inventory +'+X+', payables +'+X+', cash flat.');return e;},
   function(){var e=m3(),c=Math.round(X*0.4);e.d='sells $'+X+' of goods that cost $'+c+', customer pays later';e.ni=(X-c)*(1-t);e.cfo=e.ni-X+c;e.oa=X-c;e.eq=e.ni;e.w.push('Credit sale: NI '+sg(e.ni)+'; AR +'+X+', inventory -'+c+'; only the tax leaves as cash.');return e;}
  ];
  var n=L<=1?1:(L===2?2:3),tot=m3(),ds=[];
  shuffle(L3).slice(0,n).forEach(function(fn){var e=fn();['ni','cfo','cfi','cff','oa','li','eq'].forEach(function(k){tot[k]+=e[k];});tot.w=tot.w.concat(e.w);ds.push(e.d);});
  tot.cash=tot.cfo+tot.cfi+tot.cff;var as=tot.cash+tot.oa,le=tot.li+tot.eq;
  if(Math.abs(as-le)>1e-6)throw new Error('unbalanced');
  return {topic:'Accounting',q:'Tax rate '+pc(t,0)+'. In one year a company '+ds.join(', and ')+'. Change in net income, cash, assets and equity?',
    a:A('NI '+sg(tot.ni)+', cash '+sg(tot.cash)+', assets '+sg(as)+', liabilities '+sg(tot.li)+', equity '+sg(tot.eq)+'.',tot.w.concat(['Check: assets '+sg(as)+' = liabilities + equity '+sg(le)+'.']))};
}
function gHC(L){
  var k=pick([0,1,2,3,3]),t=pick([0.2,0.25]);
  if(k===0){var U=pick([60,80,90,100,120,150,200]),N=pick([2,3,4,5]);return {topic:'Healthcare',q:'A biotech gets a $'+U+'M upfront license payment, recognized evenly over '+N+' years. Ignore costs and tax. After year 1: revenue, deferred revenue, cash from operations?',a:A('Revenue $'+f(U/N,1)+'M, deferred revenue $'+f(U-U/N,1)+'M, CFO $'+U+'M.',['Cash arrives upfront; revenue is earned over time.','CFO = NI '+f(U/N,1)+' + deferred revenue increase '+f(U-U/N,1)+'.'])};}
  if(k===1){var X=pick([25,50,80,100,150,200]),Y=pick([100,200,300,500]);return {topic:'Healthcare',q:'A company pays $'+X+'M upfront to in-license a Phase II drug (asset acquisition), with $'+Y+'M of approval milestones not yet probable. Ignore tax. Effect today?',a:A('Net income -$'+X+'M, cash -$'+X+'M, no asset recorded.',['Acquired IPR&D in an asset deal is expensed as R&D.','Milestones are not booked until probable.','In a business combination, IPR&D would be capitalized instead.'])};}
  if(k===2){var M=pick([20,40,50,75,100]);return {topic:'Healthcare',q:'A biotech earns a $'+M+'M regulatory milestone on approval, paid in cash. Tax '+pc(t,0)+', no related costs. Effect on revenue, NI and cash?',a:A('Revenue +'+M+', NI +'+f(M*(1-t),1)+', cash +'+f(M*(1-t),1)+'.',['Revenue is recognized when the milestone is hit.','Tax of '+f(M*t,1)+' comes out of both NI and cash.'])};}
  var pk=pick([500,800,1000,1500,2000,3000]),mg=pick([0.3,0.4,0.5]),pos=L<=1?pick([0.5,0.6]):pick([0.1,0.15,0.2,0.3,0.4,0.6]),mult=pick([3,4,5]);
  var v=pk*mg*mult*pos;
  return {topic:'Healthcare',q:'A drug has $'+pk+'M of expected peak sales, a '+pc(mg,0)+' peak operating margin and a '+pc(pos,0)+' chance of approval. Using '+mult+'x peak operating profit as a rough value if approved, what is the risk-adjusted value?',a:A('About $'+f(v,0)+'M.',['Peak operating profit: '+pk+' x '+pc(mg,0)+' = '+f(pk*mg,0)+'.','Value if approved: x '+mult+' = '+f(pk*mg*mult,0)+'.','Risk-adjust: x '+pc(pos,0)+'.'])};
}
function gDebt(L){
  if(pick([0,1])===0){var e=pick(range(50,300,10)),lv=pick([3,4,5,6,7]),r=pick([0.05,0.06,0.07,0.08,0.1,0.12]),cx=pick([0.1,0.2,0.3]),d=e*lv,i=d*r;
    return {topic:'Debt',q:'EBITDA $'+e+'M, debt '+lv+'x EBITDA at '+pc(r,0)+'. Capex is '+pc(cx,0)+' of EBITDA. Interest coverage and (EBITDA - capex) coverage?',a:A(f(e/i,2)+'x and '+f(e*(1-cx)/i,2)+'x.',['Debt '+f(d,0)+', interest '+f(i,1)+'.','EBITDA / interest = '+e+' / '+f(i,1)+'.','(EBITDA - capex) / interest = '+f(e*(1-cx),1)+' / '+f(i,1)+'.'])};}
  var s=pick([100,150,200,250]),j=pick([50,100,150]),u=pick([50,100,150]),ev=pick(range(100,s+j+u+100,25)),rem=ev,out=[];
  [['First lien',s],['Second lien',j],['Unsecured',u]].forEach(function(x){var g=Math.max(0,Math.min(x[1],rem));rem-=g;out.push(x[0]+': '+f(g,0)+' of '+x[1]+' ('+pc(g/x[1],0)+').');});
  out.push('Equity: '+f(Math.max(rem,0),0)+'.');
  return {topic:'Debt',q:'First lien $'+s+'M, second lien $'+j+'M, unsecured $'+u+'M. Enterprise value in restructuring is $'+ev+'M. Recovery for each class?',a:A('Pay top down until value runs out.',out)};
}
function gComps(L){
  var e=pick(range(20,200,10)),ms=[pick([6,7,8]),pick([8,9,10]),pick([10,11,12,13])],nd=pick(range(0,300,25)),sh=pick([10,20,25,50]);
  var lo=Math.min.apply(null,ms),hi=Math.max.apply(null,ms),md=ms.slice().sort(function(a,b){return a-b;})[1];
  var p=function(m){return (e*m-nd)/sh;};
  if(p(lo)<=0)return gComps(L);
  return {topic:'Comps',q:'EBITDA $'+e+'M. Peers trade at '+ms.join('x, ')+'x EV/EBITDA. Net debt $'+nd+'M, '+sh+'M shares. Implied price range and median?',a:A('$'+f(p(lo))+' to $'+f(p(hi))+', median $'+f(p(md))+'.',['EV range '+f(e*lo,0)+' to '+f(e*hi,0)+', median '+f(e*md,0)+'.','Subtract net debt '+nd+', divide by '+sh+'M shares.'])};
}
function gSyn(L){
  var a=pick([1.2,1.5,1.8,2,2.4,3]),gap=pick([0.05,0.08,0.1,0.12,0.15,0.2]),sh=pick([50,100,120,200,250]),t=pick([0.2,0.25,0.3]),pf=a-gap,need=gap*sh/(1-t);
  return {topic:'M&A',q:'Standalone EPS $'+f(a)+', pro forma EPS $'+f(pf)+' on '+sh+'M pro forma shares. Tax '+pc(t,0)+'. Pretax synergies to break even?',a:A('$'+f(need,1)+'M.',['EPS gap $'+f(gap)+' x '+sh+'M shares = $'+f(gap*sh,1)+'M after tax.','Gross up: / (1 - '+t+').'])};
}

var STREAK={
 'Accounting':[g3S],'Enterprise Value':[gEvents,gBridge,gTSM],'DCF':[gUFCF,gGordon,gPV],'WACC':[gWACC],
 'Comps':[gComps],'M&A':[gAccretion,gPremium,gSyn],'LBO':[gLBO,gLBOexit],'Debt':[gDebt],'Healthcare':[gHC]
};

/* ---------- MENTAL GENERATORS (easy numbers) ---------- */
var M=[
 function(){var eq=pick(range(100,900,50)),d=pick(range(0,400,50)),c=pick(range(0,200,25));return pick([
   {q:'Equity value '+eq+', debt '+d+', cash '+c+'. EV?',a:A(String(eq+d-c)+'.',[eq+' + '+d+' - '+c+'.'])},
   {q:'EV '+(eq+d-c)+', debt '+d+', cash '+c+'. Equity value?',a:A(String(eq)+'.',[(eq+d-c)+' - '+d+' + '+c+'.'])}]);},
 function(){var e=pick([1,1.5,2,2.5,3,4,5]),p=pick([8,10,12,15,20,25]);return {q:'EPS $'+e+', P/E '+p+'x. Share price?',a:A('$'+f(e*p)+'.',[e+' x '+p+'.'])};},
 function(){var p=pick([4,5,8,10,16,20,25,40,50]);return {q:'Earnings yield on a '+p+'x P/E?',a:A(pc(1/p)+'.',['1 / '+p+'.'])};},
 function(){var x=pick([[2,3,'26%'],[2,4,'19%'],[2,5,'15%'],[2,7,'10%'],[3,3,'44%'],[3,5,'25%'],[2.5,5,'20%'],[1.5,3,'14%'],[4,5,'32%'],[3,7,'17%']]);return {q:x[0]+'x in '+x[1]+' years is roughly what IRR?',a:A('About '+x[2]+'.',[x[0]+'^(1/'+x[1]+') - 1.'])};},
 function(){var x=pick([[2,10],[2,8],[3,6],[4,8],[1,5],[2,5],[3,12],[1,4],[5,10],[3,10]]);return {q:'EV/Revenue '+x[0]+'x, EV/EBITDA '+x[1]+'x. EBITDA margin?',a:A(pc(x[0]/x[1])+'.',[x[0]+' / '+x[1]+'.'])};},
 function(){var i=pick([8,10,12,20,40,100]),t=pick([0.2,0.25,0.5]);return {q:'$'+i+' of interest, tax '+pc(t,0)+'. After-tax cost?',a:A('$'+f(i*(1-t))+'.',[i+' x '+f(1-t)+'.'])};},
 function(){var d=pick([10,20,40,100]),t=pick([0.2,0.25,0.3,0.5]);return {q:'Depreciation up $'+d+', tax '+pc(t,0)+'. Net income and cash?',a:A('NI -'+f(d*(1-t))+', cash +'+f(d*t)+'.',['Tax shield = '+d+' x '+pc(t,0)+'.'])};},
 function(){var rf=pick([3,4,5]),b=pick([0.5,1,1.5,2]),e=pick([4,5,6]);return {q:'rf '+rf+'%, beta '+b+', ERP '+e+'%. Cost of equity?',a:A(f(rf+b*e)+'%.',[rf+' + '+b+' x '+e+'.'])};},
 function(){var x=pick([[50,12,4],[60,10,5],[75,12,4],[80,10,5],[50,10,6],[70,10,5]]);return {q:x[0]+'% equity at '+x[1]+'%, '+(100-x[0])+'% debt at '+x[2]+'% after tax. WACC?',a:A(f(x[0]/100*x[1]+(100-x[0])/100*x[2],2)+'%.',[x[0]+'% x '+x[1]+' + '+(100-x[0])+'% x '+x[2]+'.'])};},
 function(){var x=pick([[10,10,0],[10,10,5],[20,10,5],[5,8,3],[12,10,4],[6,9,3],[8,12,4],[20,12,2]]);return {q:'Next year FCF '+x[0]+', discount rate '+x[1]+'%, growth '+x[2]+'%. Value?',a:A(f(x[0]/((x[1]-x[2])/100),0)+'.',[x[0]+' / '+(x[1]-x[2])+'%.'])};},
 function(){var p=pick([20,40,50,100]),k=p*pick([0.5,0.25,0.75]),n=pick([4,8,10,20,40]);return {q:n+' options at a $'+k+' strike, stock at $'+p+'. Net new shares?',a:A(f(n-n*k/p)+'.',['Proceeds '+f(n*k)+' buy back '+f(n*k/p)+' shares.'])};},
 function(){var ev=100,d=pick([40,50,60,70]),x=pick([100,120,130,150,200]),d2=pick([0,10,20,30,40].filter(function(v){return v<d;}));var q0=ev-d,q1=x-d2;return {q:'Buy at EV 100 with '+d+' of debt. Exit at EV '+x+' with '+d2+' of debt. MOIC?',a:A(f(q1/q0)+'x.',['Equity in '+q0+', out '+q1+'.'])};},
 function(){var p=pick([20,30,40,50,60,80,100]),r=pick([0.2,0.25,0.3,0.4,0.5]);return {q:'$'+p+' stock, '+pc(r,0)+' premium. Offer price?',a:A('$'+f(p*(1+r))+'.',[p+' x '+f(1+r)+'.'])};},
 function(){var a=pick([8,10,12,15,20,25,30]),b=pick([8,10,12,15,20,25,30]);if(a===b)b=a+5;return {q:'A '+a+'x P/E buyer acquires a '+b+'x P/E target with all stock. Accretive or dilutive?',a:A(a>b?'Accretive.':'Dilutive.',[a>b?'Higher P/E buying lower P/E.':'Lower P/E buying higher P/E.'])};},
 function(){var p=pick([10,12.5,20,25,5]),c=pick([2,3,4,6,8]);var y=100/p;return {q:'Target at '+p+'x P/E, bought with debt costing '+c+'% after tax. Accretive?',a:A(y>c?'Accretive.':(y<c?'Dilutive.':'Neutral.'),['Earnings yield '+f(y,1)+'% vs cost '+c+'%.'])};},
 function(){var x=pick([10,20,25,50]),y=pick([40,80,120,200,300,400,600]);return {q:'What is '+x+'% of '+y+'?',a:A(f(x/100*y)+'.')};},
 function(){var x=pick([[0.5,0.6,0.9],[0.3,0.6,0.9],[0.3,0.5,0.9],[0.6,0.5,1],[0.5,0.5,0.8]]);return {q:'PoS: '+pc(x[0],0)+' then '+pc(x[1],0)+' then '+pc(x[2],0)+'. Cumulative?',a:A(pc(x[0]*x[1]*x[2])+'.',[x.join(' x ')+'.'])};},
 function(){var e=pick([50,100,200]),x=pick([[2,5],[4,5],[5,5],[5,8],[4,10],[2,10],[5,10],[2,8],[4,6]]),l=x[0],r=x[1];return {q:'EBITDA '+e+', leverage '+l+'x, rate '+r+'%. Interest coverage?',a:A(f(100/(l*r),2)+'x.',['Debt '+(e*l)+', interest '+f(e*l*r/100)+'.'])};},
 function(){var pk=pick([500,1000,2000]),p=pick([0.1,0.2,0.25,0.5]);return {q:'$'+pk+'M peak sales, '+pc(p,0)+' chance of approval. Risk-adjusted peak sales?',a:A('$'+f(pk*p,0)+'M.')};},
 function(){var r=pick([6,8,9,12,18,24]);return {q:'Rule of 72: years to double at '+r+'%?',a:A(f(72/r,1)+' years.',['72 / '+r+'.'])};},
 function(){var e=pick([20,40,50,100]),m=pick([5,6,8,10,12]),d=pick([50,100,150,200]);if(e*m<=d)d=50;return {q:'EBITDA '+e+' at '+m+'x, net debt '+d+'. Equity value?',a:A(String(e*m-d)+'.',['EV '+(e*m)+' - '+d+'.'])};},
 function(){var r=pick([100,200,500]),g=pick([10,20,50]);var m=pick([20,25,40]);return {q:'Revenue '+r+' grows '+g+'%, margin '+m+'% flat. New EBITDA?',a:A(f(r*(1+g/100)*m/100)+'.',['Revenue '+f(r*(1+g/100))+' x '+m+'%.'])};}
];
function mental(){var g=pick(M)();g.topic='Mental';return g;}

window.GEN={
  streakTopics:Object.keys(STREAK),
  streak:function(topic,level){var ks=Object.keys(STREAK);var fs=topic==='All'?STREAK[pick(ks)]:STREAK[topic];var c=pick(fs)(level);c.level=level;c.gen=true;return c;},
  mental:function(){var c=mental();c.gen=true;return c;}
};
if(typeof module!=='undefined')module.exports=window.GEN;
})();
