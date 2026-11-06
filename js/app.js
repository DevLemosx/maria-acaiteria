const $=s=>document.querySelector(s),R=v=>'R$ '+v.toFixed(2).replace('.',','),WA='5591980406731';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const FR=['Banana','Morango','Kiwi','Uva'],CA=['Leite condensado','Chocolate','Calda de morango'],
CO=['Granola','Amendoim','Paçoca','Flocos','Leite em pó','Chocoball','Ovo maltine','M&M'],
PR=['Creme de cupuaçu','Creme de Ninho','Creme de morango','Creme de ovo maltine','Nutella','Chantilly','Kit Kat','Biz'];
const combo=(n,p,d)=>({id:'combo'+n,cat:'Combos',name:'Combo '+n,price:p,desc:d,emoji:'🍟',bg:'#ffe3e7',direct:1,groups:[]});
let P=[
...[[200,15,'#efe7ff'],[300,18,'#e6dcff'],[500,25,'#dacbff'],[700,40,'#cdb8ff']].map(([ml,pr,bg])=>({id:'acai'+ml,ml,cat:'Açaí',name:'Açaí '+ml+' ml',emoji:'🍇',bg,desc:'Até 10 adicionais: frutas, caldas e complementos.',price:pr,maxTotal:10,
 groups:[{k:'Frutas',l:FR},{k:'Coberturas',l:CA},{k:'Complementos',l:CO},{k:'Complementos premium',l:PR,p:6}]})),
{id:'barca',cat:'Barca',name:'Açaí na Barca',emoji:'🛶',bg:'#d9ecff',desc:'3 frutas, 4 acompanhamentos e 2 caldas.',price:70,
 groups:[{k:'Frutas',l:FR,max:3},{k:'Acompanhamentos',l:CO,max:4},{k:'Caldas',l:CA,max:2}]},
...[[20,15],[30,20],[40,25],[50,30]].map(([q,pr])=>({id:'mini'+q,cat:'Salgados',name:'Mini salgadinhos '+q+' unidades',emoji:'🥟',bg:'#fff0c2',desc:'Mini salgadinhos.',price:pr,direct:1,groups:[]})),
combo(1,45,'Batata frita, pastéis, empada, sanduíche natural e coxinha.'),
combo(2,45,'Batata frita, pastéis, empada, sanduíche natural e canudo de frango.'),
combo(3,55,'Batata frita, pastéis, empada, sanduíche natural, canudo de frango e coxinha.')];
const CATS=['Todos','Açaí','Barca','Salgados','Combos'];
let doneUrl='',doneSrv=null,cart=[],cur=null,cat='Todos',view='cart',uid=0;
let co={mode:'Entrega',pay:'PIX',card:'Débito',f:{},troco:''};

/* painéis que sobem */
let lastF=null;
function openS(el){lastF=document.activeElement;el.hidden=false;void el.offsetWidth;el.classList.add('on');document.body.classList.add('lock');setTimeout(()=>{const b=el.querySelector('.x,.btn');b&&b.focus({preventScroll:true})},60)}
function closeS(el){if(!el)return;el.classList.remove('on');setTimeout(()=>{if(!el.classList.contains('on'))el.hidden=true},300);if(!document.querySelector('.sheet.on'))document.body.classList.remove('lock');lastF&&lastF.focus&&lastF.focus({preventScroll:true})}
document.addEventListener('keydown',e=>{if(e.key=='Escape')closeS(document.querySelector('.sheet.on'))});
document.addEventListener('error',e=>{if(e.target.tagName=='IMG'&&e.target.closest('.ph'))e.target.remove()},true);

/* menu */
function drawMenu(){
 $('#tabs').innerHTML=CATS.map(c=>`<button class="tab" aria-pressed="${c==cat}" data-cat="${c}">${c}</button>`).join('');
 $('#grid').innerHTML=P.filter(p=>cat=='Todos'||p.cat==cat).map(p=>{
  const from=p.sizes?'a partir de '+R(p.sizes[0][1]):R(p.price);
  const im=/^https?:\/\//.test(p.img||'')?`<img src="${esc(p.img)}" alt="" loading="lazy">`:'';
  return `<article class="card"><div class="ph" style="background:${p.bg}" aria-hidden="true">${im}${p.ml?`<span class="ml">${p.ml}<small> ml</small></span>`:p.emoji}</div><div class="cb"><h3>${esc(p.name)}</h3><p>${esc(p.desc)}</p><div class="pr">${from}</div><button class="btn v" data-open="${esc(p.id)}">${p.direct?'Adicionar':'Montar pedido'}</button></div></article>`}).join('');
}
/* builder */
function openB(id,edit){
 const p=P.find(x=>x.id==id);
 if(p.direct&&!edit){add({pid:id,name:p.name,lines:[p.desc],unit:p.price,qty:1,cfg:null});toast();return}
 cur={p,si:0,sel:p.groups.map(()=>new Set()),qty:1,edit:null};
 if(edit){const c=edit.cfg;cur.si=c.si;cur.sel=c.sel.map(a=>new Set(a));cur.qty=edit.qty;cur.edit=edit.id}
 const g=p.groups.map((g,gi)=>`<fieldset><legend>${esc(g.k)}<small data-cn="${gi}"></small></legend><div class="chips">${g.l.map((n,i)=>`<label class="chip"><input type="checkbox" data-g="${gi}" value="${i}"${cur.sel[gi].has(i)?' checked':''}><span>${esc(n)}${g.p?' +'+R(g.p):''}</span></label>`).join('')}</div></fieldset>`).join('');
 const s=p.sizes?`<fieldset><legend>Tamanho</legend><div class="chips">${p.sizes.map((z,i)=>`<label class="chip"><input type="radio" name="sz" data-s="${i}"${i==cur.si?' checked':''}><span>${z[0]}${p.unit} · ${R(z[1])}</span></label>`).join('')}</div></fieldset>`:'';
 $('#bi').innerHTML=`<div class="dh"><h2 id="bt">${esc(p.name)}</h2><button class="x" data-x aria-label="Fechar">✕</button></div><div class="db">${s}${p.maxTotal?'<p id="mt" class="note" style="margin:0 0 1rem"></p>':''}${g}</div><div class="df"><div class="qty"><button data-q="-1" aria-label="Menos">−</button><span id="bq">1</span><button data-q="1" aria-label="Mais">+</button></div><button class="btn" id="bgo"></button></div>`;
 openS($('#bd'));upd();
}
function unit(){const{p,si,sel}=cur;let u=p.sizes?p.sizes[si][1]:p.price;p.groups.forEach((g,i)=>{if(g.p)u+=g.p*sel[i].size});return u}
function upd(){
 const{p,sel}=cur;
 p.groups.forEach((g,gi)=>{
  const n=sel[gi].size,full=!!p.maxTotal&&sel.reduce((a,s)=>a+s.size,0)>=p.maxTotal;
  $(`[data-cn="${gi}"]`).textContent=g.max?`${n}/${g.max}`:(g.p?(n?`${n} · +${R(n*g.p)}`:R(g.p)+' cada'):'');
  document.querySelectorAll(`[data-g="${gi}"]`).forEach(i=>{i.disabled=!i.checked&&((!!g.max&&n>=g.max)||full)});
 });
 $('#bq').textContent=cur.qty;if($('#mt')){const t=sel.reduce((a,s)=>a+s.size,0);$('#mt').textContent='Adicionais: '+t+'/'+p.maxTotal+(t>=p.maxTotal?' (limite atingido)':'')}
 $('#bgo').textContent=(cur.edit?'Salvar · ':'Adicionar · ')+R(unit()*cur.qty);
}
function label(p,si){return p.sizes?`${p.name.replace('Açaí no copo','Açaí')} ${p.sizes[si][0]}${p.unit}`:p.name}
function mkItem(p,sel,qty,id){
 let unit=p.price;p.groups.forEach((g,i)=>{if(g.p)unit+=g.p*sel[i].length});
 const lines=p.groups.map((g,i)=>sel[i].length?(p.groups.length>1?g.k+': ':'')+sel[i].map(j=>g.l[j]).join(', '):'').filter(Boolean);
 return{id,pid:p.id,name:p.name,lines:p.groups.length?lines:[p.desc],unit,qty,cfg:p.groups.length?{si:0,sel}:null,items:p.groups.map((g,i)=>sel[i].map(j=>g.l[j])).flat()}}
function save(){
 const{p,sel,qty}=cur,it=mkItem(p,sel.map(s=>[...s]),qty);
 if(cur.edit){const o=cart.find(x=>x.id==cur.edit);Object.assign(o,it,{id:cur.edit});count()}else add(it);
 closeS($('#bd'));if(cur.edit)openC();else toast();
}
function add(it){if(cart.length>=15){msg('Limite de 15 itens por pedido. Finalize este e faça outro, ou fale direto com a Maria.',1);return}it.id=++uid;cart.push(it);count()}
function count(){$('#cnt').textContent=cart.reduce((a,i)=>a+i.qty,0);persist()}
function msg(m,bad){const t=$('#ts');t.textContent=m;t.className='on'+(bad?' bad':'');clearTimeout(msg.t);msg.t=setTimeout(()=>t.className='',3200)}
function toast(){const b=$('#bag');b.animate([{transform:'scale(1)'},{transform:'scale(1.25)'},{transform:'scale(1)'}],300)}
const total=()=>cart.reduce((a,i)=>a+i.unit*i.qty,0);

/* money */
function parseM(s){s=String(s).replace(/[^\d,.]/g,'');if(!s)return NaN;
 if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');
 else if(/\.\d{3}$/.test(s)&&s.split('.').length>1&&!/\.\d{1,2}$/.test(s))s=s.replace(/\./g,'');
 const r=parseFloat(s);return isFinite(r)&&r<1e6?r:NaN}

/* cart + checkout */
function openC(v){if(v)view=v;drawC();if(!$('#cd').classList.contains('on'))openS($('#cd'))}
function drawC(){
 const T=total(),ci=$('#ci');
 if(!cart.length){ci.innerHTML=`<div class="dh"><h2 id="ct">Seu carrinho</h2><button class="x" data-x aria-label="Fechar">✕</button></div><div class="db empty"><div style="font-size:3rem">🛒</div><p>Seu carrinho está vazio.<br>Escolha algo no cardápio.</p></div><div class="df"><button class="btn" data-x>Ver cardápio</button></div>`;return}
 if(view=='cart'){
  ci.innerHTML=`<div class="dh"><h2 id="ct">Seu carrinho</h2><button class="x" data-x aria-label="Fechar">✕</button></div><div class="db">${cart.map(i=>`<div class="it"><div class="row"><strong>${esc(i.name)}</strong><strong>${R(i.unit*i.qty)}</strong></div>${i.lines.length?`<ul>${i.lines.map(l=>`<li>${esc(l)}</li>`).join('')}</ul>`:''}<div class="row"><div class="qty"><button data-ci="${i.id}" data-d="-1" aria-label="Menos">−</button>${i.qty}<button data-ci="${i.id}" data-d="1" aria-label="Mais">+</button></div><div>${i.cfg?`<button class="lk" data-ed="${i.id}">Editar</button>`:''}<button class="lk" style="color:var(--vm)" data-rm="${i.id}">Remover</button></div></div></div>`).join('')}<div class="tot"><span>Total</span><span>${R(T)}</span></div></div><div class="df"><button class="btn o" data-x>Adicionar mais</button><button class="btn" data-go="co">Continuar</button></div>`;
 }else if(view=='co'){
  const f=co.f,d=co.mode=='Entrega',inp=(n,l,t='text')=>`<label class="f">${l}<input type="${t}" maxlength="80" data-f="${n}" value="${esc(f[n]||'')}" ${n=='nome'?'autocomplete="name"':''}></label>`;
  ci.innerHTML=`<div class="dh"><h2 id="ct">Finalizar pedido</h2><button class="x" data-x aria-label="Fechar">✕</button></div><div class="db"><fieldset><legend>Como você quer receber?</legend><div class="chips">${['Entrega','Retirada no local'].map(m=>`<label class="chip"><input type="radio" name="md" data-md="${m}"${co.mode==m?' checked':''}><span>${m}</span></label>`).join('')}</div></fieldset>
  ${inp('nome','Nome')}${inp('tel','Telefone (WhatsApp)','tel')}
  ${d?`<div class="two"><div style="grid-column:1/-1">${inp('rua','Rua')}</div>${inp('num','Número')}${inp('bairro','Bairro')}<div style="grid-column:1/-1">${inp('comp','Complemento (opcional)')}${inp('ref','Ponto de referência (opcional)')}</div></div>`:''}
  <fieldset><legend>Pagamento</legend><div class="chips">${['PIX','Cartão','Dinheiro'].map(m=>`<label class="chip"><input type="radio" name="pg" data-pg="${m}"${co.pay==m?' checked':''}><span>${m}</span></label>`).join('')}</div></fieldset>
  ${co.pay=='Cartão'?`<div class="chips" style="margin-bottom:1rem">${['Débito','Crédito'].map(m=>`<label class="chip"><input type="radio" name="cc" data-cc="${m}"${co.card==m?' checked':''}><span>${m}</span></label>`).join('')}</div>`:''}
  ${co.pay=='Dinheiro'?`<label class="f">Troco para quanto?<input type="text" inputmode="decimal" maxlength="12" data-troco placeholder="Ex.: 50" value="${esc(co.troco)}"></label><div id="tn" class="note"></div>`:''}
  <div id="er" class="err" role="alert"></div><div class="tot"><span>Total</span><span>${R(T)}</span></div></div><div class="df"><button class="btn o" data-go="cart">Voltar</button><button class="btn" data-go="sum">Revisar pedido</button></div>`;
  tn();
 }else if(view=='done'){
  ci.innerHTML=`<div class="dh"><h2 id="ct">Falta só um passo</h2><button class="x" data-x aria-label="Fechar">✕</button></div><div class="db" style="text-align:center"><div style="font-size:3rem">${doneSrv?'✅':'📲'}</div><p>${doneSrv?`Pedido <strong>${esc(doneSrv.code)}</strong> registrado. Total ${R(+doneSrv.total)}.`:'Seu pedido está pronto para enviar. A Maria confirma o valor com você.'}</p><p>Toque no botão para enviar a mensagem pelo WhatsApp. O pedido só chega para a Maria depois que você enviar.</p></div><div class="df"><a class="btn full" data-fin href="${esc(doneUrl)}" target="_blank" rel="noopener">Abrir WhatsApp</a></div>`;
 }else{
  const d=co.mode=='Entrega',f=co.f,tv=parseM(co.troco);
  ci.innerHTML=`<div class="dh"><h2 id="ct">Confirme seu pedido</h2><button class="x" data-x aria-label="Fechar">✕</button></div><div class="db sum">${cart.map(i=>`<div class="it"><div class="row"><strong>${i.qty}× ${esc(i.name)}</strong><strong>${R(i.unit*i.qty)}</strong></div>${i.lines.length?`<ul>${i.lines.map(l=>`<li>${esc(l)}</li>`).join('')}</ul>`:''}</div>`).join('')}
  <h3>${co.mode}</h3><p>${esc(f.nome)} · ${esc(f.tel)}</p>${d?`<p>${esc(f.rua)}, nº ${esc(f.num)} · ${esc(f.bairro)}${f.comp?'<br>'+esc(f.comp):''}${f.ref?'<br>Ref.: '+esc(f.ref):''}</p>`:''}
  <h3>Pagamento</h3><p>${co.pay=='Cartão'?'Cartão de '+co.card.toLowerCase():co.pay}${co.pay=='Dinheiro'&&tv?`<br>Troco para ${R(tv)} (troco de ${R(tv-T)})`:''}</p>
  <div id="er2" class="err" role="alert"></div><div class="tot"><span>Total</span><span>${R(T)}</span></div></div><div class="df"><button class="btn o" data-go="co">Editar</button><button class="btn" data-send>Enviar pedido</button></div>`;
 }
}
function tn(){const n=$('#tn');if(!n)return;const v=parseM(co.troco),T=total();
 n.className=v<T?'err':'note';n.textContent=isNaN(v)||!co.troco?'':v<T?'O valor é menor que o total ('+R(T)+').':'Troco: '+R(v-T)}
function validate(){
 const f=co.f,need=['nome','tel'].concat(co.mode=='Entrega'?['rua','num','bairro']:[]);let bad=need.filter(k=>!(f[k]||'').trim());
 document.querySelectorAll('[data-f]').forEach(i=>i.classList.toggle('bad',bad.includes(i.dataset.f)));
 let msg=bad.length?'Preencha os campos destacados.':'';
 if(!msg&&(f.tel.replace(/\D/g,'').length<10))msg='Informe um telefone com DDD.',document.querySelector('[data-f=tel]').classList.add('bad');
 if(!msg&&co.pay=='Dinheiro'&&co.troco){const v=parseM(co.troco);if(isNaN(v)||v<total())msg='O valor do troco deve ser maior ou igual ao total.'}
 $('#er').textContent=msg;return!msg}
function waUrl(srv){
 const f=co.f,T=srv?+srv.total:total(),d=co.mode=='Entrega';
 let m=srv?`Olá! Gostaria de fazer um pedido (nº ${srv.code}):\n\n`:'Olá! Gostaria de fazer um pedido:\n\n';
 cart.forEach(i=>{m+=`🍇 *${i.qty>1?i.qty+'× ':''}${i.name}*\n`;(i.cfg?i.items:i.lines).forEach(l=>m+='• '+l+'\n');m+='\n'});
 m+=d?`🛵 *Entrega*\n${f.rua}, nº ${f.num}\n${f.bairro}\n${f.comp?f.comp+'\n':''}${f.ref?'Ref.: '+f.ref+'\n':''}`:'🏪 *Retirada no local*\n';
 m+=`👤 ${f.nome} · ${f.tel}\n\n💳 Pagamento: ${co.pay=='Cartão'?'Cartão ('+co.card+')':co.pay}\n`;
 const tv=parseM(co.troco);if(co.pay=='Dinheiro'&&tv)m+=`💵 Troco para: ${R(tv)}\n`;
 m+=`💰 Total: ${R(T)}`;
 return `https://wa.me/${WA}?text=${encodeURIComponent(m)}`;
}

/* carrinho salvo no aparelho */
const LS='maria_v1';
function toSaved(i){const pr=P.find(x=>x.id==i.pid),n={};if(i.cfg&&pr)pr.groups.forEach((g,gi)=>{n[g.k]=(i.cfg.sel[gi]||[]).map(j=>g.l[j])});return{id:i.id,pid:i.pid,qty:i.qty,names:n}}
function fromSaved(list){return list.map(s=>{const pr=P.find(x=>x.id==s.pid);if(!pr)return null;
 const sel=pr.groups.map(g=>((s.names||{})[g.k]||[]).map(n=>g.l.indexOf(n)).filter(j=>j>=0));
 return mkItem(pr,sel,Math.min(20,Math.max(1,+s.qty||1)),s.id)}).filter(Boolean).slice(0,15)}
function persist(){try{localStorage.setItem(LS,JSON.stringify({uid,cart:cart.map(toSaved),co:{mode:co.mode,pay:co.pay,card:co.card,f:co.f}}))}catch(e){}}
function restore(){try{const d=JSON.parse(localStorage.getItem(LS)||'null');if(!d)return;uid=+d.uid||0;cart=fromSaved(Array.isArray(d.cart)?d.cart:[]);const c=d.co||{};
 if(['Entrega','Retirada no local'].includes(c.mode))co.mode=c.mode;if(['PIX','Cartão','Dinheiro'].includes(c.pay))co.pay=c.pay;if(['Débito','Crédito'].includes(c.card))co.card=c.card;
 if(c.f&&typeof c.f=='object')Object.keys(c.f).forEach(k=>{if(typeof c.f[k]=='string')co.f[k]=c.f[k].slice(0,80)});count()}catch(e){}}
function remap(){const n=cart.length;cart=fromSaved(cart.map(toSaved));count();if(cart.length<n)msg('Alguns itens do carrinho não estão mais disponíveis e foram removidos.',1)}
document.addEventListener('change',persist);document.addEventListener('input',persist);

/* servidor (Supabase) */
const SB='https://zqyynlqlgsyxozobcucs.supabase.co',KEY='sb_publishable_EGXYB-uLYZxpxiLJnrMtnA_4DQR9UMi';
const H={apikey:KEY,Authorization:'Bearer '+KEY,'Content-Type':'application/json'};
const EM={'Açaí':'🍇',Barca:'🛶',Salgados:'🥟',Combos:'🍟'},BG={'Açaí':'#dacbff',Barca:'#d9ecff',Salgados:'#fff0c2',Combos:'#ffe3e7'},MB={200:'#efe7ff',300:'#e6dcff',500:'#dacbff',700:'#cdb8ff'};
async function loadMenu(){
 try{
  const r=await fetch(SB+'/rest/v1/products?select=*,option_groups(*,options(*))&order=sort',{headers:H});
  if(!r.ok)throw 0;const d=await r.json();if(!Array.isArray(d)||!d.length)throw 0;
  P=d.map(x=>{const ml=(x.id.match(/^acai(\d+)$/)||[])[1],
   g=(x.option_groups||[]).sort((a,b)=>a.sort-b.sort).map(g=>({k:g.name,l:(g.options||[]).sort((a,b)=>a.sort-b.sort).map(o=>o.name),max:g.max_select||undefined,p:+g.price_each||undefined}));
   return{id:x.id,cat:x.category,name:x.name,desc:x.description||'',price:+x.price,maxTotal:x.max_total||undefined,groups:g,ml:ml&&+ml,emoji:EM[x.category],bg:(ml&&MB[ml])||BG[x.category],direct:g.length?0:1,img:x.image_url||''}});
  remap();drawMenu();
 }catch(e){}
}
async function submit(btn){
 const er=$('#er2');er.textContent='';btn.disabled=true;btn.textContent='Enviando…';
 let srv=null;
 try{
  const f=co.f,tv=parseM(co.troco);
  const body={p:{mode:co.mode=='Entrega'?'Entrega':'Retirada',customer:{name:f.nome,phone:f.tel},address:{rua:f.rua||'',num:f.num||'',bairro:f.bairro||'',comp:f.comp||'',ref:f.ref||''},payment:co.pay,card:co.pay=='Cartão'?co.card:null,change_for:co.pay=='Dinheiro'&&tv?tv:null,
   items:cart.map(i=>{const pr=P.find(x=>x.id==i.pid),sel={};if(i.cfg)pr.groups.forEach((g,gi)=>{const a=i.cfg.sel[gi];if(a&&a.length)sel[g.k]=a.map(j=>g.l[j])});return{product_id:i.pid,qty:i.qty,selections:sel}})}};
  const r=await fetch(SB+'/rest/v1/rpc/create_order',{method:'POST',headers:H,body:JSON.stringify(body)});
  if(r.ok)srv=await r.json();
  else{const e=await r.json().catch(()=>({}));if(r.status==400&&e.message){er.textContent=e.message;btn.disabled=false;btn.textContent='Enviar pedido';return}}
 }catch(e){}
 doneSrv=srv;doneUrl=waUrl(srv);view='done';drawC();
}

/* events */
document.addEventListener('click',e=>{
 if(e.target.classList.contains('bk')){closeS(e.target.parentElement);return}
 const t=e.target.closest('button,a');if(!t)return;const D=t.dataset;
 if(D.cat){cat=D.cat;drawMenu()}
 else if(D.open)openB(D.open);
 else if(D.q){cur.qty=Math.min(20,Math.max(1,cur.qty+ +D.q));upd()}
 else if(t.id=='bgo')save();
 else if('x' in D){closeS(t.closest('.sheet'))}
 else if(t.id=='bag')openC('cart');
 else if(t.id=='mn'){const o=$('#nv').classList.toggle('on');t.setAttribute('aria-expanded',o)}
 else if(t.closest('#nv'))$('#nv').classList.remove('on');
 else if(D.ci){const i=cart.find(x=>x.id==D.ci);i.qty=Math.min(20,Math.max(1,i.qty+ +D.d));count();drawC()}
 else if(D.rm){cart=cart.filter(x=>x.id!=D.rm);count();drawC()}
 else if(D.ed){closeS($('#cd'));const i=cart.find(x=>x.id==D.ed);openB(i.pid,i)}
 else if(D.go){if(D.go=='sum'&&!validate())return;view=D.go;drawC()}
 else if('send' in D)submit(t);
 else if('fin' in D)setTimeout(()=>{cart=[];count();co.troco='';view='cart';closeS($('#cd'))},400);
});
document.addEventListener('change',e=>{
 const i=e.target,D=i.dataset;
 if(D.g!==undefined){const s=cur.sel[D.g],v=+i.value;i.checked?s.add(v):s.delete(v);upd()}
 else if(D.s!==undefined){cur.si=+D.s;upd()}
 else if(D.md){co.mode=D.md;drawC()}
 else if(D.pg){co.pay=D.pg;drawC()}
 else if(D.cc)co.card=D.cc;
 else if(D.troco!==undefined){const v=parseM(i.value);if(!isNaN(v)){co.troco=R(v);i.value=co.troco}tn()}
});
document.addEventListener('input',e=>{const i=e.target;
 if(i.dataset.f){co.f[i.dataset.f]=i.value;i.classList.remove('bad')}
 else if(i.dataset.troco!==undefined){co.troco=i.value;tn()}});
restore();drawMenu();loadMenu();
