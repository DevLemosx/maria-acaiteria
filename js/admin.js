const SB='https://zqyynlqlgsyxozobcucs.supabase.co',KEY='sb_publishable_EGXYB-uLYZxpxiLJnrMtnA_4DQR9UMi';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const CATS=['Açaí','Barca','Salgados','Combos'],TB={s:'store_settings',p:'products',l:'option_lists',o:'options',pg:'product_groups'};
let S=null,prods=[],lists=[],st={delivery_fee:8},tab='p';try{S=JSON.parse(sessionStorage.getItem('s'))}catch(e){}
function keep(s){S=s;try{s?sessionStorage.setItem('s',JSON.stringify(s)):sessionStorage.removeItem('s')}catch(e){}}
function toast(m,bad){const t=$('#ts');t.textContent=m;t.className='on'+(bad?' bad':'');clearTimeout(toast.t);toast.t=setTimeout(()=>t.className='',2400)}
async function auth(path,body){
 const r=await fetch(SB+'/auth/v1/'+path,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify(body)});
 const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error_description||d.msg||'Falha na autenticação');
 keep({at:d.access_token,rt:d.refresh_token});return d}
async function api(path,opt={},retry=true){
 const r=await fetch(SB+'/rest/v1/'+path,{...opt,headers:{apikey:KEY,Authorization:'Bearer '+S.at,'Content-Type':'application/json',Prefer:'return=representation',...(opt.headers||{})}});
 if(r.status==401&&retry){try{await auth('token?grant_type=refresh_token',{refresh_token:S.rt})}catch(e){logout();throw e}return api(path,opt,false)}
 const d=await r.json().catch(()=>null);if(!r.ok)throw new Error((d&&d.message)||'Erro '+r.status);return d}
function logout(){keep(null);$('#out').hidden=true;$('#who').textContent='';login()}
function login(msg=''){
 $('#app').innerHTML=`<form class="box login" id="lf"><h2>Painel da Maria</h2><label class="f">E-mail<input type="text" id="em" autocomplete="username" inputmode="email"></label><label class="f">Senha<input type="password" id="pw" autocomplete="current-password" style="width:100%;font:inherit;padding:.65rem .8rem;border:2px solid var(--line);border-radius:12px;background:var(--card);color:var(--ink);margin-top:.2rem"></label><div class="err" id="le" role="alert">${esc(msg)}</div><button class="btn v full">Entrar</button></form>`;
 $('#lf').onsubmit=async e=>{e.preventDefault();$('#le').textContent='';
  try{await auth('token?grant_type=password',{email:$('#em').value.trim(),password:$('#pw').value});await start()}catch(x){$('#le').textContent=x.message==='Invalid login credentials'?'E-mail ou senha incorretos.':x.message}}}
async function start(){
 try{if(!(await api('rpc/is_admin',{method:'POST',body:'{}'}))){keep(null);return login('Esta conta não tem permissão de administrador.')}}catch(e){return login()}
 $('#out').hidden=false;$('#who').textContent='Cardápio';await load()}
async function load(){
 const open=new Set([...document.querySelectorAll('details[open]')].map(d=>d.dataset.id));
 [lists,prods,st]=await Promise.all([api('option_lists?select=*,options(*)&order=sort'),api('products?select=*,product_groups(*)&order=sort'),api('store_settings?select=*&id=eq.1').then(d=>d[0]||{delivery_fee:8})]);render(open)}

const inp=(t,id,f,v,o={})=>`<label${o.w?' class="w"':''}>${o.l}<input type="${o.n?'number':'text'}" ${o.n?`min="${o.min??0}" step="${o.step||'0.01'}" inputmode="decimal"`:`maxlength="${o.max||80}"`} ${o.ph?`placeholder="${o.ph}"`:''} data-t="${t}" data-id="${esc(id)}" data-f="${f}" value="${esc(v)}"></label>`;
const optRow=o=>`<div class="op"><input type="checkbox" title="Disponível" aria-label="Disponível" data-t="o" data-id="${o.id}" data-f="active"${o.active?' checked':''}><input type="text" maxlength="50" data-t="o" data-id="${o.id}" data-f="name" value="${esc(o.name)}"><button class="btn o sm" data-delo="${o.id}" aria-label="Remover ${esc(o.name)}">✕</button></div>`;
const sel=(cur,extra='')=>`<select ${extra}>${lists.map(l=>`<option value="${l.id}"${l.id==cur?' selected':''}>${esc(l.name)}</option>`).join('')}</select>`;
function prodHtml(p,open){
 const im=/^https?:\/\//.test(p.image_url||'')?`<img src="${esc(p.image_url)}" alt="">`:'🍇',id=esc(p.id);
 return `<details class="pd" data-id="${id}"${open}><summary><span>${esc(p.name)}</span><span>R$ ${(+p.price).toFixed(2).replace('.',',')}</span>${p.active?'':'<span class="off">desativado</span>'}</summary><div class="in">
 <div class="fl">${inp('p',p.id,'name',p.name,{l:'Nome',w:1,max:60})}${inp('p',p.id,'description',p.description,{l:'Descrição',w:1,max:160})}
 <div class="w imgbox"><label>Imagem do produto</label><div class="row2"><div class="th" aria-hidden="true">${im}</div><label style="flex:1;min-width:180px">Link da imagem (https://…)<input type="text" inputmode="url" maxlength="500" data-t="p" data-id="${id}" data-f="image_url" value="${esc(p.image_url)}"></label></div><div class="row2" style="margin-top:.6rem"><label class="btn o sm" for="up-${id}">Enviar arquivo</label><input type="file" accept="image/jpeg,image/png,image/webp" id="up-${id}" data-up="${id}" hidden>${p.image_url?`<button class="btn o sm" data-rmimg="${id}">Remover imagem</button>`:''}</div></div>
 ${inp('p',p.id,'price',p.price,{l:'Preço (R$)',n:1})}${inp('p',p.id,'max_total',p.max_total,{l:'Máx. de adicionais',n:1,step:'1',min:1,ph:'sem limite'})}
 <label class="op w"><input type="checkbox" data-t="p" data-id="${id}" data-f="active"${p.active?' checked':''}> Disponível no cardápio</label></div>
 <div class="gr"><h4>Escolhas do cliente</h4><p class="mut2">Cada escolha usa uma lista compartilhada (aba “Adicionais”).</p>`+
 p.product_groups.sort((a,b)=>a.sort-b.sort).map(g=>`<div class="box2"><div class="fl">${inp('pg',g.id,'label',g.label,{l:'Nome no cardápio',max:40})}${inp('pg',g.id,'max_select',g.max_select,{l:'Máx. de escolhas',n:1,step:'1',min:1,ph:'sem limite'})}<label class="w">Lista usada${sel(g.list_id,`data-t="pg" data-id="${g.id}" data-f="list_id"`)}</label></div><button class="btn o sm" data-delg="${g.id}">Remover esta escolha</button></div>`).join('')+
 `<div class="row2"><label style="flex:1;min-width:180px">Adicionar escolha<select id="ng-${id}">${lists.map(l=>`<option value="${l.id}">${esc(l.name)}</option>`).join('')}</select></label><button class="btn v sm" data-addg="${id}">Adicionar</button></div></div></div></details>`}
function listHtml(l,open){
 const uso=prods.filter(p=>p.product_groups.some(g=>g.list_id==l.id)).length;
 return `<details class="pd" data-id="L${l.id}"${open}><summary><span>${esc(l.name)}</span><span>${l.options.length} itens</span></summary><div class="in"><p class="mut2">Usada em ${uso} produto(s). Mudar aqui vale para todos.</p>
 <div class="fl">${inp('l',l.id,'name',l.name,{l:'Nome da lista',max:40})}${inp('l',l.id,'price_each',l.price_each,{l:'Preço por item (R$)',n:1})}</div>
 <p class="mut2">A caixinha liga ou desliga o item (ex.: “acabou o kiwi”).</p>`+l.options.sort((a,b)=>a.sort-b.sort).map(optRow).join('')+
 `<div class="op"><input type="text" maxlength="50" placeholder="Novo item" id="no${l.id}"><button class="btn v sm" data-addo="${l.id}">Adicionar</button></div></div></details>`}
function render(open=new Set()){
 const o=id=>open.has(id)?' open':'';
 $('#app').innerHTML=`<div class="tabs2" role="group" aria-label="Seções"><button class="tab" aria-pressed="${tab=='p'}" data-tab="p">Produtos</button><button class="tab" aria-pressed="${tab=='l'}" data-tab="l">Adicionais</button><button class="tab" aria-pressed="${tab=='s'}" data-tab="s">Entrega</button></div>`+
 (tab=='s'?`<div class="box"><h3 style="margin:0 0 .4rem;font-family:Fredoka">Taxa de entrega</h3><p class="mut2" style="margin-top:0">Valor somado ao pedido quando o cliente escolhe entrega. Na retirada no local não há taxa.</p><div class="fl">${inp('s',1,'delivery_fee',st.delivery_fee,{l:'Valor da entrega (R$)',n:1})}</div></div>`:tab=='p'?`<details class="box"><summary><strong>＋ Novo produto</strong></summary><div class="row2" style="margin-top:.8rem"><label style="flex:2;min-width:180px">Nome<input type="text" id="nn" maxlength="60"></label><label>Categoria<select id="nc">${CATS.map(c=>`<option>${c}</option>`).join('')}</select></label><label>Preço (R$)<input type="number" id="np" min="0" step="0.01" inputmode="decimal"></label><button class="btn v sm" data-newp>Criar</button></div></details>`+prods.map(p=>prodHtml(p,o(p.id))).join(''):
 `<p class="mut2" style="margin-top:0">Frutas, caldas, complementos e premium ficam aqui, uma vez só. Mudou aqui, mudou em todos os produtos.</p>`+lists.map(l=>listHtml(l,o('L'+l.id))).join(''))}

async function patch(el){
 const t=el.dataset.t,f=el.dataset.f,id=el.dataset.id;let v=el.type=='checkbox'?el.checked:el.value.trim();
 if(el.type=='number'){v=v===''?null:+v;if(v!==null&&(!isFinite(v)||v<0)||(v===null&&['price','price_each','delivery_fee'].includes(f)))return toast('Valor inválido',1)}
 else if(['name','label'].includes(f)&&!v)return toast('O nome não pode ficar vazio',1);
 else if(f=='image_url'){if(v&&!/^https?:\/\/\S+$/.test(v))return toast('Use um link que comece com https://',1);v=v||null}
 else if(f=='list_id')v=+v;
 try{const d=await api(`${TB[t]}?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',body:JSON.stringify({[f]:v})});if(!d.length)throw new Error('Sem permissão para alterar');toast('Salvo ✓');
  if(['name','price','active','image_url','list_id'].includes(f)&&t!='o'&&t!='pg'||t=='pg'&&f=='list_id')await load()}catch(e){toast(e.message,1)}}
async function shrink(f){const bm=await createImageBitmap(f),k=Math.min(1,800/Math.max(bm.width,bm.height)),c=document.createElement('canvas');c.width=Math.round(bm.width*k);c.height=Math.round(bm.height*k);const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(bm,0,0,c.width,c.height);return new Promise(r=>c.toBlob(r,'image/jpeg',.82))}
async function upload(inp){
 const f=inp.files[0],id=inp.dataset.up;if(!f)return;
 if(!/^image\/(jpeg|png|webp)$/.test(f.type))return toast('Use uma imagem JPG, PNG ou WebP',1);
 if(f.size>10e6)return toast('Imagem muito grande (máx. 10 MB)',1);
 try{toast('Enviando imagem…');await api('rpc/is_admin',{method:'POST',body:'{}'});
  const blob=await shrink(f),path=id+'-'+Date.now()+'.jpg';
  const r=await fetch(SB+'/storage/v1/object/produtos/'+path,{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+S.at,'Content-Type':'image/jpeg'},body:blob});
  if(!r.ok)throw new Error('Não foi possível enviar a imagem');
  const d=await api('products?id=eq.'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify({image_url:SB+'/storage/v1/object/public/produtos/'+path})});
  if(!d.length)throw new Error('Sem permissão para alterar');toast('Imagem salva ✓');await load()}catch(e){toast(e.message,1)}}
document.addEventListener('change',e=>{if(e.target.dataset.t)patch(e.target);else if(e.target.dataset.up)upload(e.target)});
document.addEventListener('click',async e=>{const b=e.target.closest('button'),D=b?b.dataset:{};if(!b)return;
 try{
  if(D.tab){tab=D.tab;render()}
  else if(D.addo!==undefined){const i=$('#no'+D.addo),n=i.value.trim();if(!n)return;await api('options',{method:'POST',body:JSON.stringify({list_id:+D.addo,name:n,sort:99})});toast('Adicionado ✓');await load()}
  else if(D.delo){if(!confirm('Remover este item de todos os produtos? Para só esconder por um tempo, desmarque a caixinha.'))return;await api('options?id=eq.'+D.delo,{method:'DELETE'});toast('Removido ✓');await load()}
  else if(D.addg){const l=lists.find(x=>x.id==$('#ng-'+D.addg).value);await api('product_groups',{method:'POST',body:JSON.stringify({product_id:D.addg,list_id:l.id,label:l.name,sort:99})});toast('Escolha adicionada ✓');await load()}
  else if(D.delg){if(!confirm('Remover esta escolha deste produto? A lista continua existindo.'))return;await api('product_groups?id=eq.'+D.delg,{method:'DELETE'});toast('Removido ✓');await load()}
  else if(D.rmimg){await api('products?id=eq.'+encodeURIComponent(D.rmimg),{method:'PATCH',body:JSON.stringify({image_url:null})});toast('Imagem removida ✓');await load()}
  else if('newp' in D){const n=$('#nn').value.trim(),pr=+$('#np').value;if(!n||!isFinite(pr)||pr<0||$('#np').value==='')return toast('Informe nome e preço',1);
   await api('products',{method:'POST',body:JSON.stringify({id:'p'+Date.now().toString(36),name:n,category:$('#nc').value,price:pr,sort:100+prods.length,description:''})});toast('Produto criado ✓');await load()}
 }catch(x){toast(x.message.includes('duplicate')?'Isso já existe (nome ou lista repetidos)':x.message,1)}});
$('#out').onclick=logout;
S?start():login();
