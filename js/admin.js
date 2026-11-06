const SB='https://zqyynlqlgsyxozobcucs.supabase.co',KEY='sb_publishable_EGXYB-uLYZxpxiLJnrMtnA_4DQR9UMi';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const CATS=['Açaí','Barca','Salgados','Combos'],TB={p:'products',g:'option_groups',o:'options'};
let S=null,prods=[];try{S=JSON.parse(sessionStorage.getItem('s'))}catch(e){}
function keep(s){S=s;try{s?sessionStorage.setItem('s',JSON.stringify(s)):sessionStorage.removeItem('s')}catch(e){}}
function toast(m,bad){const t=$('#ts');t.textContent=m;t.className='on'+(bad?' bad':'');clearTimeout(toast.t);toast.t=setTimeout(()=>t.className='',2200)}
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
 $('#out').hidden=false;$('#who').textContent='Painel do cardápio';await load()}
async function load(){
 const open=new Set([...document.querySelectorAll('.pd[open]')].map(d=>d.dataset.id));
 prods=await api('products?select=*,option_groups(*,options(*))&order=sort');render(open)}
const num=(l,k,v,x='')=>`<label>${l}<input type="number" min="0" step="0.01" data-t="${x[0]}" data-id="${x[1]}" data-f="${k}" value="${v??''}" ${k=='max_select'?'step="1" placeholder="sem limite"':''}></label>`;
function render(open=new Set()){
 $('#app').innerHTML=`<h2>Cardápio</h2><details class="box"><summary><strong>＋ Novo produto</strong></summary><div class="row2" style="margin-top:.8rem"><label style="flex:2">Nome<input type="text" id="nn" maxlength="60"></label><label>Categoria<select id="nc">${CATS.map(c=>`<option>${c}</option>`).join('')}</select></label><label>Preço (R$)<input type="number" id="np" min="0" step="0.01"></label><button class="btn v sm" data-newp>Criar</button></div></details>`+
 prods.map(p=>`<details class="pd" data-id="${esc(p.id)}"${open.has(p.id)?' open':''}><summary><span>${esc(p.name)}</span><span>R$ ${(+p.price).toFixed(2).replace('.',',')}</span>${p.active?'':'<span class="off">desativado</span>'}</summary><div class="in">
  <div class="fl"><label class="w">Nome<input type="text" maxlength="60" data-t="p" data-id="${esc(p.id)}" data-f="name" value="${esc(p.name)}"></label><label class="w">Descrição<input type="text" maxlength="160" data-t="p" data-id="${esc(p.id)}" data-f="description" value="${esc(p.description)}"></label>${num('Preço (R$)','price',p.price,['p',p.id])}${p.max_total!=null||p.option_groups.length?num('Máx. de adicionais','max_total',p.max_total,['p',p.id]).replace('min="0"','min="1" step="1" placeholder="sem limite"'):''}<div class="w imgbox"><label>Imagem do produto</label><div class="row2"><div class="th" aria-hidden="true">${/^https?:\/\//.test(p.image_url||'')?`<img src="${esc(p.image_url)}" alt="">`:'🍇'}</div><label style="flex:1;min-width:180px">Link da imagem (https://…)<input type="text" inputmode="url" maxlength="500" data-t="p" data-id="${esc(p.id)}" data-f="image_url" value="${esc(p.image_url)}"></label></div><div class="row2" style="margin-top:.6rem"><label class="btn o sm" for="up-${esc(p.id)}">Enviar arquivo</label><input type="file" accept="image/jpeg,image/png,image/webp" id="up-${esc(p.id)}" data-up="${esc(p.id)}" hidden>${p.image_url?`<button class="btn o sm" data-rmimg="${esc(p.id)}">Remover imagem</button>`:''}</div></div><label class="op w"><input type="checkbox" data-t="p" data-id="${esc(p.id)}" data-f="active"${p.active?' checked':''}> Disponível no cardápio</label></div>`+
  p.option_groups.sort((a,b)=>a.sort-b.sort).map(g=>`<div class="gr"><h4>${esc(g.name)}</h4><div class="fl">${num('Máx. de escolhas','max_select',g.max_select,['g',g.id])}${num('Preço por item (R$)','price_each',g.price_each,['g',g.id])}</div>`+
   g.options.sort((a,b)=>a.sort-b.sort).map(o=>`<div class="op"><input type="checkbox" title="Disponível" aria-label="Disponível" data-t="o" data-id="${o.id}" data-f="active"${o.active?' checked':''}><input type="text" maxlength="50" data-t="o" data-id="${o.id}" data-f="name" value="${esc(o.name)}"><button class="btn o sm" data-delo="${o.id}" aria-label="Remover ${esc(o.name)}">✕</button></div>`).join('')+
   `<div class="op"><input type="text" maxlength="50" placeholder="Nova opção" id="no${g.id}"><button class="btn v sm" data-addo="${g.id}">Adicionar</button></div></div>`).join('')+`</div></details>`).join('')}
async function patch(el){
 const t=el.dataset.t,f=el.dataset.f,id=el.dataset.id;let v=el.type=='checkbox'?el.checked:el.value.trim();
 if(el.type=='number'){v=v===''?null:+v;if(v!==null&&(!isFinite(v)||v<0)||(v===null&&['price','price_each'].includes(f)))return toast('Valor inválido',1)}
 else if(f=='name'&&!v)return toast('O nome não pode ficar vazio',1);
 else if(f=='image_url'){if(v&&!/^https?:\/\/\S+$/.test(v))return toast('Use um link que comece com https://',1);v=v||null}
 try{const d=await api(`${TB[t]}?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',body:JSON.stringify({[f]:v})});if(!d.length)throw new Error('Sem permissão para alterar');toast('Salvo ✓');
  if(t=='p'&&['name','price','active','image_url'].includes(f))await load()}catch(e){toast(e.message,1)}}
document.addEventListener('change',e=>{if(e.target.dataset.t)patch(e.target);else if(e.target.dataset.up)upload(e.target)});
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
document.addEventListener('click',async e=>{const b=e.target.closest('button'),D=b?b.dataset:{};if(!b)return;
 try{
  if(D.addo!==undefined){const i=$('#no'+D.addo),n=i.value.trim();if(!n)return;await api('options',{method:'POST',body:JSON.stringify({group_id:+D.addo,name:n,sort:99})});toast('Adicionado ✓');await load()}
  else if(D.rmimg){await api('products?id=eq.'+encodeURIComponent(D.rmimg),{method:'PATCH',body:JSON.stringify({image_url:null})});toast('Imagem removida ✓');await load()}
  else if(D.delo){if(!confirm('Remover esta opção? Para só esconder por um tempo, desmarque a caixinha.'))return;await api('options?id=eq.'+D.delo,{method:'DELETE'});toast('Removido ✓');await load()}
  else if('newp' in D){const n=$('#nn').value.trim(),pr=+$('#np').value;if(!n||!isFinite(pr)||pr<0||$('#np').value==='')return toast('Informe nome e preço',1);
   await api('products',{method:'POST',body:JSON.stringify({id:'p'+Date.now().toString(36),name:n,category:$('#nc').value,price:pr,sort:100+prods.length,description:''})});toast('Produto criado ✓');await load()}
 }catch(x){toast(x.message.includes('duplicate')?'Já existe uma opção com esse nome':x.message,1)}});
$('#out').onclick=logout;
S?start():login();
