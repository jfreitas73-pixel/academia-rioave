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
#rafcSairBox{margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.12)}
#rafcSair{display:flex;align-items:center;gap:10px;width:100%;text-align:left;border:0;background:transparent;color:#fca5a5;font:600 .95rem/1.2 inherit;font-family:inherit;padding:9px 12px;border-radius:10px;cursor:pointer}
#rafcSair:hover{background:rgba(255,255,255,.08)}
#rafcSairBox .rafcEu{font-size:11.5px;opacity:.55;padding:2px 12px 4px 40px;color:inherit;overflow-wrap:anywhere}`;
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

let entrou=false;
auth.onAuthStateChanged(async u=>{
  if(!u){if(entrou){location.reload();return}const go=()=>ecra();document.body?go():document.addEventListener('DOMContentLoaded',go);return}
  const google=(u.providerData||[]).some(p=>p&&p.providerId==='google.com');
  if(!u.emailVerified&&!google){verificar(u);return}
  U=u;entrou=true;
  ADM=DONOS.includes(mail());if(!ADM){try{ADM=(await fs.doc('admins/'+mail()).get()).exists}catch(e){ADM=false}}
  const l=$('#rafcLogin');if(l)l.remove();
  const pSair=()=>{const sd=document.getElementById('side');if(!sd||document.getElementById('rafcSair'))return!!sd;const w=document.createElement('div');w.id='rafcSairBox';
    w.innerHTML='<button type="button" id="rafcSair"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg><span>Sair da aplicação</span></button><div class="rafcEu">'+esc(mail())+'</div>';
    sd.appendChild(w);w.querySelector('#rafcSair').onclick=()=>{if(w.dataset.c){auth.signOut();return}w.dataset.c='1';w.querySelector('span').textContent='Toque outra vez para sair';setTimeout(()=>{delete w.dataset.c;const sp=w.querySelector('span');if(sp)sp.textContent='Sair da aplicação'},4000)};return true};
  if(!pSair()){const iv=setInterval(()=>{if(pSair())clearInterval(iv)},500)}
  pronto();
  const w=document.getElementById('welc');if(w)w.remove();setTimeout(()=>{window.__welT=undefined},500);
});
})();
