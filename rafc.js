/* Academia Rio Ave FC 360° — ligação ao Firebase (login + base de dados).
   Substitui o ambiente do Claude: a app pede "claude.use('db')" e recebe o Firestore. */
(function(){
'use strict';
const cfg=window.RAFC_FIREBASE_CONFIG;window.RAFC_SITE=true;
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
if(!cfg||!cfg.apiKey){document.addEventListener('DOMContentLoaded',()=>{document.body.innerHTML='<div style="font:16px system-ui;padding:40px;max-width:560px;margin:auto">Falta configurar o Firebase (ficheiro <b>firebase-config.js</b>).</div>'});return}
firebase.initializeApp(cfg);
const auth=firebase.auth(),fs=firebase.firestore();
try{fs.settings({ignoreUndefinedProperties:true})}catch(e){}
auth.useDeviceLanguage&&auth.useDeviceLanguage();
try{auth.languageCode='pt'}catch(e){}

/* ---- arrays dentro de arrays (o Firestore não aceita): codificar/descodificar ---- */
const enc=(x,inArr)=>{if(Array.isArray(x)){const m=x.map(v=>enc(v,true));return inArr?{__arr:m}:m}
  if(x&&typeof x==='object'&&!(x instanceof Date)&&!(x instanceof firebase.firestore.Timestamp)){const o={};for(const k in x){if(x[k]!==undefined)o[k]=enc(x[k],false)}return o}return x};
const dec=x=>{if(Array.isArray(x))return x.map(dec);if(x&&typeof x==='object'&&!(x instanceof firebase.firestore.Timestamp)){const ks=Object.keys(x);if(ks.length===1&&ks[0]==='__arr'&&Array.isArray(x.__arr))return x.__arr.map(dec);const o={};for(const k of ks)o[k]=dec(x[k]);return o}return x};
const wDS=s=>({id:s.id,exists:s.exists,data:()=>{const d=s.data();return d===undefined?undefined:dec(d)},ref:s.ref});
const wQS=s=>({docs:s.docs.map(wDS),size:s.size,empty:s.empty,forEach:f=>s.docs.map(wDS).forEach(f)});
const wSnap=(target,wrap)=>(...a)=>{const fns=a.map(f=>typeof f==='function'?f:null);const nx=fns[0],er=fns[1];return target.onSnapshot(s=>nx&&nx(wrap(s)),e=>{if(er)er(e)})};
const wQ=q=>({get:async()=>wQS(await q.get()),onSnapshot:wSnap(q,wQS),where:(...a)=>wQ(q.where(...a)),orderBy:(...a)=>wQ(q.orderBy(...a)),limit:n=>wQ(q.limit(n))});
const wD=d=>({id:d.id,get:async()=>wDS(await d.get()),onSnapshot:wSnap(d,wDS),
  set:(v,o)=>o?d.set(enc(v),o):d.set(enc(v)),
  update:async v=>{const e=enc(v),ks=Object.keys(e);if(!ks.length)return;const args=[];ks.forEach(k=>{args.push(new firebase.firestore.FieldPath(k),e[k])});
    try{return await d.update(...args)}catch(x){if(x&&x.code==='not-found')return d.set(e,{merge:true});throw x}},
  delete:()=>d.delete(),collection:p=>wC(d.collection(p))});
const wC=c=>Object.assign(wQ(c),{id:c.id,add:async v=>{const r=await c.add(enc(v));return {id:r.id}},doc:k=>wD(k?c.doc(k):c.doc())});
const DB={collection:p=>wC(fs.collection(p)),doc:p=>wD(fs.doc(p))};

/* ---- utilizador ---- */
const DONOS=['jfreitas73@gmail.com'];let U=null,ADM=false;
const mail=()=>String((U&&U.email)||'').toLowerCase();
const USER={id:async()=>U.uid,me:async()=>({id:U.uid,name:U.displayName||mail().split('@')[0],email:mail()}),
  canEdit:()=>ADM,isOwner:()=>ADM,can:n=>true,profiles:async ids=>{const o={};(ids||[]).forEach(i=>{o[i]={name:''}});return o}};
const DL={save:async({filename,data})=>{const b=data instanceof Blob?data:new Blob([data]);const u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=filename||'documento';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),30000)}};

let pronto;const PRONTO=new Promise(r=>pronto=r);window.__welT=1;/* adia o aviso de boas-vindas até ao login */
window.claude={use:async n=>{await PRONTO;if(n==='db')return DB;if(n==='user')return USER;if(n==='downloads')return DL;return null}};

/* ---- ecrã de entrada ---- */
const CSS=`#rafcLogin{position:fixed;inset:0;z-index:100000;background:linear-gradient(160deg,#04361f,#0b5a33 55%,#0e6b3d);display:flex;align-items:center;justify-content:center;padding:16px;font-family:'Barlow',system-ui,-apple-system,sans-serif}
#rafcLogin .cx{background:#fff;color:#14231b;border-radius:20px;max-width:400px;width:100%;padding:28px 24px;box-shadow:0 30px 70px rgba(0,0,0,.35);display:flex;flex-direction:column;gap:12px}
#rafcLogin h1{margin:0;font:700 22px/1.15 'Barlow Condensed','Barlow',system-ui,sans-serif;letter-spacing:.01em;text-transform:uppercase}
#rafcLogin .sb{margin:-6px 0 4px;color:#5b6b62;font-size:14px}
#rafcLogin label{display:flex;flex-direction:column;gap:4px;font-size:13px;color:#4a5a51}
#rafcLogin input{font-size:16px;padding:11px 12px;border:1px solid #cdd8d1;border-radius:10px;background:#f6f9f7;color:#14231b}
#rafcLogin button{font:600 15px system-ui,sans-serif;padding:12px;border-radius:10px;border:1px solid #cdd8d1;background:#fff;color:#14231b;cursor:pointer}
#rafcLogin button.pr{background:#0b5a33;border-color:#0b5a33;color:#fff}
#rafcLogin .lk{background:none;border:0;padding:2px;color:#0b5a33;text-decoration:underline;font-weight:500;font-size:14px;align-self:flex-start}
#rafcLogin .ms{font-size:14px;min-height:1em;color:#9a3412}
#rafcLogin .ok{color:#0b5a33}
#rafcLogin .ou{display:flex;align-items:center;gap:10px;color:#8a978f;font-size:12px}#rafcLogin .ou:before,#rafcLogin .ou:after{content:"";flex:1;height:1px;background:#dde5e0}
.rc-card{margin:16px 6px 6px;padding:14px;border-radius:16px;background:linear-gradient(160deg,rgba(255,255,255,.07),rgba(255,255,255,.02));border:1px solid rgba(227,194,91,.22);box-shadow:inset 0 1px 0 rgba(255,255,255,.06);color:#eef5f0}
.rc-top{display:flex;align-items:center;gap:12px;min-width:0}
.rc-av{width:42px;height:42px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;font:700 1.05rem/1 'Barlow Condensed','Arial Narrow',Arial,sans-serif;letter-spacing:.04em;color:#12281f;background:linear-gradient(135deg,#F3DE98,#E3C25B);box-shadow:0 0 0 2px rgba(255,255,255,.25),0 4px 10px rgba(0,0,0,.3)}
.rc-id{min-width:0;display:flex;flex-direction:column;gap:2px}
.rc-nm{font:700 1rem/1.15 'Barlow',system-ui,sans-serif;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rc-rl{font:600 10.5px/1.2 'Barlow',system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#E3C25B}
.rc-em{font:400 12px/1.25 'Barlow',system-ui,sans-serif;color:rgba(238,245,240,.6);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rc-out{margin-top:12px;width:100%;display:flex;align-items:center;justify-content:center;gap:9px;padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.16);background:rgba(0,0,0,.18);color:#fff;font:600 .92rem/1 'Barlow',system-ui,sans-serif;letter-spacing:.02em;cursor:pointer;transition:background .15s,border-color .15s,color .15s}
.rc-out:hover,.rc-out:focus-visible{background:rgba(220,38,38,.18);border-color:rgba(248,113,113,.55);color:#fecaca;outline:none}
.rc-out svg{flex:none;opacity:.9}
.rc-cf{margin-top:12px;padding:12px;border-radius:12px;background:rgba(0,0,0,.25);border:1px solid rgba(248,113,113,.35)}
.rc-cf p{margin:0 0 10px;font:500 .9rem/1.35 'Barlow',system-ui,sans-serif;color:#fff}
.rc-cf .rc-bt{display:flex;gap:8px}
.rc-cf button{flex:1;padding:9px 10px;border-radius:10px;font:600 .88rem/1 'Barlow',system-ui,sans-serif;cursor:pointer;border:1px solid rgba(255,255,255,.18);background:transparent;color:#fff}
.rc-cf button.rc-yes{background:#dc2626;border-color:#dc2626}
.rc-cf button.rc-yes:hover{background:#b91c1c}
#hAv.rc-click{cursor:pointer}
#rcPop{position:fixed;z-index:100001;width:min(320px,calc(100vw - 32px));background:linear-gradient(170deg,#0F3527,#071A13);border-radius:18px;box-shadow:0 24px 60px rgba(0,0,0,.35),0 0 0 1px rgba(227,194,91,.25);padding:4px}
#rcPop .rc-card{margin:0;border:0;background:transparent;box-shadow:none}
@media (prefers-reduced-motion:no-preference){#rcPop{animation:rcIn .16s ease-out}@keyframes rcIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}}`;
let modo='entrar';
function ecra(msg,okMsg){let el=$('#rafcLogin');if(!el){const st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);el=document.createElement('div');el.id='rafcLogin';document.body.appendChild(el)}
  const cr=modo==='criar',rp=modo==='repor';
  const cs=(document.querySelector('header.top .brand img')||{}).src;el.innerHTML='<form class="cx" novalidate>'+(cs?'<img src="'+cs+'" alt="" style="width:64px;height:64px;object-fit:contain;align-self:center">':'')+'<h1>Academia Rio Ave FC 360°</h1><p class="sb">'+(cr?'Criar conta':rp?'Repor a palavra-passe':'Entrar')+'</p>'
   +(cr?'<label>Nome<input id="rlN" autocomplete="name" required></label>':'')
   +'<label>Email<input id="rlE" type="email" autocomplete="email" required></label>'
   +(rp?'':'<label>Palavra-passe<input id="rlP" type="password" autocomplete="'+(cr?'new-password':'current-password')+'" minlength="8" required></label>')
   +'<button class="pr" type="submit">'+(cr?'Criar conta':rp?'Enviar email para repor':'Entrar')+'</button>'
   +'<div class="ms'+(okMsg?' ok':'')+'" role="status">'+esc(msg||okMsg||'')+'</div>'
   +(rp?'':'<div class="ou">ou</div><button type="button" data-g="1">Entrar com Google</button>')
   +'<div style="display:flex;flex-direction:column;gap:6px;margin-top:4px">'
   +(modo!=='entrar'?'<button type="button" class="lk" data-m="entrar">Já tenho conta: entrar</button>':'<button type="button" class="lk" data-m="criar">Primeira vez? Criar conta</button><button type="button" class="lk" data-m="repor">Esqueci-me da palavra-passe</button>')
   +'</div></form>';
  el.hidden=false;
  const f=el.querySelector('form');
  el.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{modo=b.dataset.m;ecra()});
  const g=el.querySelector('[data-g]');if(g)g.onclick=async()=>{try{const gp=new firebase.auth.GoogleAuthProvider();gp.setCustomParameters({prompt:'select_account'});await auth.signInWithPopup(gp)}catch(e){if(e&&/popup-blocked|operation-not-supported/.test(e.code||'')){ecra('Este browser bloqueou a janela da Google. Abra o site no Safari ou no Chrome (ou permita janelas pop-up), ou entre com email e palavra-passe.')}else if(!(e&&/cancelled|closed/.test(e.code||'')))ecra(erro(e))}};
  f.onsubmit=async ev=>{ev.preventDefault();const E=(el.querySelector('#rlE').value||'').trim(),P=el.querySelector('#rlP')?el.querySelector('#rlP').value:'',N=el.querySelector('#rlN')?el.querySelector('#rlN').value.trim():'';
    if(!/^\S+@\S+\.\S+$/.test(E))return ecra('Escreva um email válido.');
    try{if(rp){await auth.sendPasswordResetEmail(E);modo='entrar';return ecra('','Enviámos um email para repor a palavra-passe. Veja também o spam.')}
      if(P.length<8)return ecra('A palavra-passe tem de ter pelo menos 8 caracteres.');
      if(cr){if(!N)return ecra('Escreva o seu nome.');const c=await auth.createUserWithEmailAndPassword(E,P);await c.user.updateProfile({displayName:N});await c.user.sendEmailVerification();verificar(c.user)}
      else await auth.signInWithEmailAndPassword(E,P)}catch(e){ecra(erro(e))}};
}
function erro(e){const c=(e&&e.code)||'';return /wrong-password|invalid-credential|user-not-found|invalid-login/.test(c)?'Email ou palavra-passe errados.':/email-already-in-use/.test(c)?'Já existe uma conta com este email. Use «Entrar».':/weak-password/.test(c)?'Palavra-passe fraca: use pelo menos 8 caracteres.':/too-many-requests/.test(c)?'Demasiadas tentativas. Tente daqui a uns minutos.':/network/.test(c)?'Sem ligação à internet.':'Não foi possível entrar ('+c+').'}
function verificar(u){let el=$('#rafcLogin');if(!el){ecra();el=$('#rafcLogin')}
  el.innerHTML='<div class="cx"><h1>Confirme o seu email</h1><p class="sb">Enviámos um link para <b>'+esc(u.email)+'</b>. Abra-o e depois toque em «Já confirmei».</p><button class="pr" data-v="1">Já confirmei</button><button data-r="1">Reenviar email</button><button class="lk" data-s="1">Sair</button><div class="ms" role="status"></div></div>';
  el.querySelector('[data-v]').onclick=async()=>{await u.reload();if(auth.currentUser&&auth.currentUser.emailVerified){await auth.currentUser.getIdToken(true);location.reload()}else el.querySelector('.ms').textContent='Ainda não está confirmado.'};
  el.querySelector('[data-r]').onclick=async()=>{try{await u.sendEmailVerification();el.querySelector('.ms').textContent='Email reenviado.'}catch(e){el.querySelector('.ms').textContent=erro(e)}};
  el.querySelector('[data-s]').onclick=()=>auth.signOut()}

/* ---- conta: cartão no menu lateral e menu no avatar ---- */
function contaInfo(){const nm=(U.displayName||'').trim()||mail().split('@')[0],ini=nm.split(/\s+/).filter(Boolean).map(x=>x[0]).slice(0,2).join('').toUpperCase()||'?';
  let rl='Utilizador';if(ADM)rl='Administrador';else{try{const defs=window.__perfisDef||{},pf=(window.__perfis||{})[U.uid];let lst=Array.isArray(pf)?pf:(pf?[pf]:null);
    if(!lst){const pv=window.__perfisPrev||{};const k=Object.keys(pv).find(i=>String(pv[i].email||'').toLowerCase()===mail());if(k)lst=pv[k].perfil||[]}
    const ns=(lst||[]).map(x=>(defs[String(x).split(':')[0]]||{}).n).filter(Boolean);if(ns.length)rl=ns.join(' · ')}catch(e){}}
  return {nm,ini,rl}}
const ICO_SAIR='<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>';
function cartao(el){const c=contaInfo();el.innerHTML='<div class="rc-top"><div class="rc-av" aria-hidden="true">'+esc(c.ini)+'</div><div class="rc-id"><span class="rc-nm">'+esc(c.nm)+'</span><span class="rc-rl">'+esc(c.rl)+'</span><span class="rc-em">'+esc(mail())+'</span></div></div><button type="button" class="rc-out">'+ICO_SAIR+'<span>Terminar sessão</span></button>';
  el.querySelector('.rc-out').onclick=()=>{const b=el.querySelector('.rc-out');const cf=document.createElement('div');cf.className='rc-cf';cf.innerHTML='<p>Terminar a sessão neste dispositivo?</p><div class="rc-bt"><button type="button" class="rc-no">Cancelar</button><button type="button" class="rc-yes">Sair</button></div>';b.replaceWith(cf);cf.querySelector('.rc-yes').focus();
    cf.querySelector('.rc-no').onclick=()=>cartao(el);cf.querySelector('.rc-yes').onclick=()=>auth.signOut()}}
function contaUI(){const tryIt=()=>{const sd=document.getElementById('side');if(!sd)return false;
    let c=document.getElementById('rcSide');if(!c){c=document.createElement('div');c.id='rcSide';c.className='rc-card';sd.appendChild(c)}cartao(c);
    const av=document.getElementById('hAv');if(av&&!av.dataset.rc){av.dataset.rc='1';av.classList.add('rc-click');av.setAttribute('role','button');av.tabIndex=0;av.title='A sua conta';
      const abrir=e=>{e.stopPropagation();let p=document.getElementById('rcPop');if(p){p.remove();return}p=document.createElement('div');p.id='rcPop';p.setAttribute('role','dialog');p.setAttribute('aria-label','A sua conta');const k=document.createElement('div');k.className='rc-card';p.appendChild(k);cartao(k);document.body.appendChild(p);
        const r=av.getBoundingClientRect();p.style.top=(r.bottom+10)+'px';p.style.right=Math.max(16,innerWidth-r.right)+'px';
        const fora=ev=>{if(!p.contains(ev.target)&&ev.target!==av){p.remove();document.removeEventListener('click',fora,true)}};setTimeout(()=>document.addEventListener('click',fora,true),0)};
      av.addEventListener('click',abrir);av.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();abrir(e)}})}
    return true};
  if(!tryIt()){const iv=setInterval(()=>{if(tryIt())clearInterval(iv)},400)}
  // o papel (perfil) só se conhece depois de os perfis carregarem
  let n=0;const iv2=setInterval(()=>{const c=document.getElementById('rcSide'),r=c&&c.querySelector('.rc-rl');if(c&&r&&!c.querySelector('.rc-cf')&&r.textContent!==contaInfo().rl)cartao(c);if(++n>8)clearInterval(iv2)},1500)}

let entrou=false;
auth.onAuthStateChanged(async u=>{
  if(!u){if(entrou){location.reload();return}const go=()=>ecra();document.body?go():document.addEventListener('DOMContentLoaded',go);return}
  const google=(u.providerData||[]).some(p=>p&&p.providerId==='google.com');
  if(!u.emailVerified&&!google){verificar(u);return}
  U=u;entrou=true;
  ADM=DONOS.includes(mail());if(!ADM){try{ADM=(await fs.doc('admins/'+mail()).get()).exists}catch(e){ADM=false}}
  const l=$('#rafcLogin');if(l)l.remove();
  contaUI();

  pronto();
  const w=document.getElementById('welc');if(w)w.remove();setTimeout(()=>{window.__welT=undefined},500);
});
})();
