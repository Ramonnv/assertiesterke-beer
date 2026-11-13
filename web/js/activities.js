// Minigames (uit versie 1), nu in een paneel bovenop de 3D-wereld.
import { SC, FL, KRACHT, GEMEEN, SORT, HOUD, SORT_LABELS, ZIN, AN } from './content.js';
import { S, save, has, logAnswer } from './state.js';
import { SND, tone } from './audio.js';
import { confetti, overlay, portraitImg } from './ui.js';

let panel = null, MASCOT_WHO = 'uil', LEVEL = -1;
const app = { querySelectorAll: s => panel.querySelectorAll(s), querySelector: s => panel.querySelector(s), get scrollTop() { return 0; }, set scrollTop(v) { if (panel) panel.scrollTop = v; } };
const $ = s => panel.querySelector(s);
let current = 'act';
let timers = [];
function later(fn, ms) { const t = setTimeout(fn, ms); timers.push(t); return t; }
export function clearTimers() { timers.forEach(clearTimeout); timers = []; }
function show(html) { clearTimers(); panel.innerHTML = html; panel.scrollTop = 0; }
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function nameFill(s) { return s.replace(/\{naam\}/g, esc(S.name || 'kanjer')); }
const MASCOT = () => `<div class="mascot">${portraitImg(MASCOT_WHO, 'big')}</div>`;
let onQuitCb = null;
function quitAsk() {
  const o = overlay(`<div class="ov-emoji">🐻</div><h3>Stoppen?</h3><p>Je voortgang in deze opdracht gaat verloren.</p>
    <div class="row center mt"><button class="btn white" id="no">Doorgaan</button><button class="btn" id="yes">Stoppen</button></div>`);
  o.querySelector('#no').onclick = () => o.remove();
  o.querySelector('#yes').onclick = () => { o.remove(); clearTimers(); onQuitCb && onQuitCb(); };
}
function bindX() { const x = $('#x'); if (x) x.onclick = quitAsk; }

// acts: lijst opdrachten; opts: { el, npc, onEnd(ctx), onQuit() }
export function runActs(acts, opts) {
  panel = opts.el; MASCOT_WHO = opts.npc || 'uil'; onQuitCb = opts.onQuit; LEVEL = opts.level ?? -1;
  const extra = has('kristal') ? 3 : 0;
  acts = acts.map(a => ({ ...a, timer: a.timer ? a.timer + extra : a.timer, time: a.time ? a.time + extra : a.time }));
  const ctx = { ok: 0, total: 0, combo: 0, best: 0 };
  let k = 0;
  function next() {
    if (k >= acts.length) { clearTimers(); return opts.onEnd(ctx); }
    const a = acts[k], idx = k; k++;
    const head = inner => `<div class="wrap"><div class="topbar"><button class="iconbtn" id="x">✕</button>
      <div class="prog"><i style="width:${Math.round(idx / acts.length * 100)}%"></i></div></div>${inner}</div>`;
    ACT[a.type](a, ctx, next, head);
    bindX();
  }
  next();
}

const ACT = {
  /* --- uitleg met Beer --- */
  les(a, ctx, done, head){
    let n=0;
    function draw(){
      show(head(`<div class="grow"></div>${MASCOT()}
        <div class="bubble">${nameFill(a.lines[n])}</div>
        <div class="mt2 center"><button class="btn big green" id="nx">${n<a.lines.length-1?"Verder ➜":"Let’s go! 🐾"}</button></div><div class="grow"></div>`));
      bindX();
      $("#nx").onclick=()=>{ SND.tap(); n++; if(n<a.lines.length) draw(); else done(); };
    }
    draw();
  },

  /* --- situaties: kies Beer --- */
  kies(a, ctx, done, head){
    let ids = a.items==="random4" ? shuffle(Object.keys(SC)).slice(0,4) : (a.items==="random3" ? shuffle(Object.keys(SC)).slice(0,3) : a.items);
    let n=0;
    function draw(){
      const s=SC[ids[n]];
      const opts=shuffle(["beer","muis","draak"]);
      show(head(`<div class="card"><div class="sitemoji">${s.e}</div><div class="sit center">${s.q}</div>
        ${a.timer?`<div class="timer"><i id="tm"></i></div>`:""}</div>
        <p class="center" style="font-weight:800;color:var(--soft)">Wat doet Beer? (${n+1}/${ids.length})</p>
        <div class="opts">${opts.map(o=>`<button class="opt" data-o="${o}">${a.hints?`<span class="ic">${AN[o].e}</span>`:""}<span>${s[o]}</span></button>`).join("")}</div>
        <div id="fb"></div>`));
      bindX();
      let answered=false;
      const answer=(o)=>{
        if(answered) return; answered=true; clearTimers();
        ctx.total++; logAnswer({ type: 'kies', id: ids[n], q: s.q, k: o, lvl: LEVEL });
        app.querySelectorAll(".opt").forEach(b=>{ b.disabled=true;
          if(b.dataset.o==="beer") b.classList.add("right"); else if(b.dataset.o===o) b.classList.add("wrong"); else b.classList.add("dim"); });
        let html;
        if(o==="beer"){ ctx.ok++; SND.good(); html=`<div class="fb good"><b>🐻 Beer-reactie! Top!</b><br>${s.u}</div>`; }
        else if(o==="muis"){ SND.bad(); html=`<div class="fb bad"><b>${s.fm||"🐭 Dat is een Muis-reactie. Dan maak je jezelf klein en gaat het vaak door."}</b><br>Beer kiest het groene antwoord: ${s.u}</div>`; }
        else if(o==="draak"){ SND.bad(); html=`<div class="fb bad"><b>${s.fd||"🐲 Dat is een Draak-reactie. Dan wordt het ruzie, en krijg jij misschien zelf straf."}</b><br>Beer kiest het groene antwoord: ${s.u}</div>`; }
        else { SND.bad(); html=`<div class="fb bad"><b>⏰ Te laat!</b> Snel reageren helpt. Kies een korte, duidelijke zin.<br>${s.u}</div>`; }
        $("#fb").innerHTML=html+`<div class="mt center"><button class="btn green" id="nx">Verder ➜</button></div>`;
        $("#nx").scrollIntoView({behavior:"smooth",block:"end"});
        $("#nx").onclick=()=>{ SND.tap(); n++; if(n<ids.length) draw(); else done(); };
      };
      app.querySelectorAll(".opt").forEach(b=>b.onclick=()=>answer(b.dataset.o));
      if(a.timer){
        const tm=$("#tm"); tm.style.transition=`width ${a.timer}s linear`;
        requestAnimationFrame(()=>requestAnimationFrame(()=>{ tm.style.width="0%"; }));
        later(()=>answer("tijd"), a.timer*1000);
      }
    }
    draw();
  },

  /* --- flitsronde met Plaagvos --- */
  flits(a, ctx, done, head){
    const pool=shuffle(FL); let n=0;
    function draw(){
      const f=pool[n%pool.length];
      const opts=shuffle([{t:pick(f.g),k:"beer"},{t:f.m,k:"muis"},{t:f.d,k:"draak"}]);
      show(head(`<div class="row between"><span class="pill">⚡ ${n+1}/${a.rounds}</span><span class="combo" id="cb">${ctx.combo>1?"🔥 x"+ctx.combo:""}</span></div>
        <div class="fox mt"><div class="who">🦊</div><div class="say">“${f.z}”</div></div>
        <div class="timer"><i id="tm"></i></div>
        <div class="opts">${opts.map(o=>`<button class="opt" data-k="${o.k}"><span>${o.t}</span></button>`).join("")}</div>
        <div id="fb"></div>`));
      bindX();
      let answered=false;
      const answer=(k)=>{
        if(answered) return; answered=true; clearTimers();
        ctx.total++; logAnswer({ type: 'flits', q: f.z, k, lvl: LEVEL });
        app.querySelectorAll(".opt").forEach(b=>{ b.disabled=true;
          if(b.dataset.k==="beer") b.classList.add("right"); else if(b.dataset.k===k) b.classList.add("wrong"); else b.classList.add("dim"); });
        let wait;
        if(k==="beer"){ ctx.ok++; ctx.combo++; ctx.best=Math.max(ctx.best,ctx.combo); SND.good();
          $("#fb").innerHTML=`<div class="fb good"><b>${pick(["Bam! 💥","Sterk! 💪","Beer-power! 🐻","Zo! 😎","Top! ⭐"])}</b> Plaagvos weet even niks meer te zeggen.</div>`;
          wait=1300;
        } else {
          ctx.combo=0; SND.bad();
          const why = k==="muis" ? "🐭 Muis-reactie: zo laat je Plaagvos winnen." : k==="draak" ? "🐲 Draak-reactie: zo wordt het ruzie." : "⏰ Te laat! Een korte zin is genoeg.";
          $("#fb").innerHTML=`<div class="fb bad"><b>${why}</b><br>Het groene antwoord is Beer.</div>`;
          wait=2600;
        }
        later(()=>{ n++; if(n<a.rounds) draw(); else done(); }, wait);
      };
      app.querySelectorAll(".opt").forEach(b=>b.onclick=()=>answer(b.dataset.k));
      const tm=$("#tm"); tm.style.transition=`width ${a.time}s linear`;
      requestAnimationFrame(()=>requestAnimationFrame(()=>{ tm.style.width="0%"; }));
      later(()=>answer("tijd"), a.time*1000);
      for(let s=a.time-3;s<a.time;s++) if(s>0) later(SND.tick, s*1000);
    }
    draw();
  },

  /* --- krachtzin bouwen --- */
  zin(a, ctx, done, head){
    const Z = a.set==="random" ? pick(ZIN) : ZIN[a.set];
    let col=0, parts=[], missed=false;
    function draw(){
      const opts=shuffle(Z.cols[col]);
      show(head(`<div class="card"><div class="sitemoji">🧩</div><div class="sit center">${Z.sit}</div>
        <p class="center">Bouw een <b>Beer-zin</b>! Kies steeds het sterke stukje.</p></div>
        <div class="sentence mt" id="st">${parts.map(p=>`<span>${p}</span>`).join("")||"<i style='color:#a59dc0;font-weight:700'>Jouw zin komt hier…</i>"}</div>
        <p class="center" style="font-weight:800;color:var(--soft)">Stukje ${col+1} van 3</p>
        <div class="opts">${opts.map(o=>`<button class="opt" data-ok="${o[1]}"><span>${o[0]}</span></button>`).join("")}</div>
        <div id="fb"></div>`));
      bindX();
      app.querySelectorAll(".opt").forEach(b=>b.onclick=()=>{
        if(b.dataset.ok==="1"){ SND.good(); parts.push(b.textContent); col++;
          if(col<3) draw(); else finish(); }
        else { SND.bad(); missed=true; b.classList.add("wrong","shake"); b.disabled=true;
          $("#fb").innerHTML=`<div class="fb bad">Hmm, dat klinkt als ${b.textContent.match(/sukkel|kapot|Wacht|Rotkind|sla|stom|verpest|verklik|trek ook/i)?"🐲 Draak":"🐭 Muis"}. Probeer nog eens!</div>`; }
      });
    }
    function finish(){
      ctx.total++; if(!missed) ctx.ok++; logAnswer({ type: 'zin', q: Z.sit, k: missed ? 'fout' : 'beer', lvl: LEVEL });
      show(head(`<div class="grow"></div>${MASCOT()}
        <div class="card mt"><p class="center">Jouw Beer-zin:</p><div class="bigsay">“${parts.join(" ")}”</div>
        <p class="center">Sta op als een beer en zeg hem nu <b>hardop</b> in je beer-stem! 🗣️</p></div>
        <div class="mt2 center"><button class="btn big green" id="nx">Gezegd! 💪</button></div><div class="grow"></div>`));
      bindX(); SND.win();
      $("#nx").onclick=()=>{ SND.tap(); done(); };
    }
    draw();
  },

  /* --- ballon-adem --- */
  adem(a, ctx, done, head){
    show(head(`<h2 class="center">Ballon-adem 🎈</h2>
      <p class="center">Adem in door je neus: de ballon wordt groot. Blaas langzaam uit door je mond: de ballon wordt klein.</p>
      <div class="balloonbox"><div class="balloon" id="bl"></div></div>
      <div class="phase" id="ph">&nbsp;</div>
      <div class="center mt" id="ctrl"><button class="btn big green" id="go">Start 🎈</button></div>`));
    bindX();
    $("#go").onclick=()=>{
      $("#ctrl").innerHTML=""; let r=0;
      const bl=$("#bl"), ph=$("#ph");
      const round=()=>{
        if(r>=a.rounds){ ph.textContent="Goed zo! Voel je je rustig? 😌"; S.breaths=(S.breaths||0)+1; save(); SND.win();
          $("#ctrl").innerHTML=`<button class="btn big green" id="nx">Verder ➜</button>`; $("#nx").onclick=()=>{SND.tap();done();}; return; }
        r++;
        ph.textContent=`Adem in… (${r}/${a.rounds})`; bl.style.transition="transform 4s ease-in-out"; bl.style.transform="scale(1.15)"; tone(392,.3,"sine",.08);
        later(()=>{ ph.textContent="Even vasthouden…"; },4000);
        later(()=>{ ph.textContent="Blaas uit… fffff"; bl.style.transition="transform 5s ease-in-out"; bl.style.transform="scale(.45)"; tone(294,.3,"sine",.08); },5500);
        later(round,10800);
      };
      round();
    };
  },

  /* --- krachthouding --- */
  houding(a, ctx, done, head){
    const st=[["🦶","Zet je voeten stevig op de grond, een beetje uit elkaar."],["🧍‍♀️","Rug recht, schouders laag en ontspannen."],["👀","Kijk de ander aan (of naar het puntje van de neus)."],["😌","Adem rustig. Gezicht rustig. Jij bent de baas over jezelf."]];
    let on=0;
    show(head(`<h2 class="center">De Beer-houding</h2><p class="center">Sta op! Doe elke stap en tik erop als het lukt.</p>
      <div class="center" style="font-size:80px;transition:transform .3s" id="bb">🐻</div>
      <div class="steps mt">${st.map((s,i)=>`<button class="step" data-i="${i}"><span class="e">${s[0]}</span>${s[1]}</button>`).join("")}</div>
      <div id="fb" class="center mt"></div>`));
    bindX();
    app.querySelectorAll(".step").forEach(b=>b.onclick=()=>{
      if(b.classList.contains("on")) return; b.classList.add("on"); on++; SND.good();
      $("#bb").style.transform=`scale(${1+on*.18})`;
      if(on===4){
        $("#fb").innerHTML=`<p><b>Super! Nu 10 tellen zo blijven staan.</b></p><button class="btn big green" id="cnt">Start de klok ⏱️</button>`;
        $("#cnt").onclick=()=>{
          let c=10;
          show(head(`<div class="grow"></div><p class="center" style="font-size:24px;font-weight:900">Sta als een beer!</p><div class="bigcount" id="c">10</div>${MASCOT()}<div class="grow"></div>`));
          bindX();
          const tick=()=>{ c--; if(c>0){ $("#c").textContent=c; SND.tick(); later(tick,1000);} else { SND.win(); confetti(40);
            show(head(`<div class="grow"></div>${MASCOT()}<h2 class="center">Je staat als een echte beer!</h2><p class="center">Zo sta je ook als iemand vervelend doet. Dan voel je je sterker, en zie je er sterker uit.</p><div class="mt2 center"><button class="btn big green" id="nx">Verder ➜</button></div><div class="grow"></div>`));
            bindX(); $("#nx").onclick=()=>{SND.tap();done();}; } };
          later(tick,1000);
        };
      }
    });
  },

  /* --- beer-stem --- */
  stem(a, ctx, done, head){
    const v=[["muis","🐭","Muis-stem","stop… ik wil dat… eh… niet…","v-muis"],["draak","🐲","Draak-stem","STOP!!! IK WIL DAT NIET!!!","v-draak"],["beer","🐻","Beer-stem","Stop. Ik wil dat niet.","v-beer"]];
    let on=0;
    show(head(`<h2 class="center">Drie stemmen</h2><p class="center">Zeg de zin hardop in <b>alle drie</b> de stemmen. Tik op een kaart als je het gedaan hebt. Lekker gek doen mag!</p>
      <div class="opts">${v.map(x=>`<button class="voice" data-k="${x[0]}"><span class="e">${x[1]}</span><span><span style="font-size:16px;color:var(--soft)">${x[2]}</span><br><span class="${x[4]}">${x[3]}</span></span></button>`).join("")}</div>
      <div id="fb"></div>`));
    bindX();
    app.querySelectorAll(".voice").forEach(b=>b.onclick=()=>{
      if(b.classList.contains("on")) return; b.classList.add("on"); on++; SND.pop();
      if(on===3){
        $("#fb").innerHTML=`<div class="card mt"><h3 class="center">Welke stem werkt het best?</h3><div class="opts">
          ${shuffle(v).map(x=>`<button class="opt" data-k="${x[0]}"><span class="ic">${x[1]}</span>${x[2]}</button>`).join("")}</div><div id="fb2"></div></div>`;
        $("#fb").scrollIntoView({behavior:"smooth",block:"start"});
        let ans=false;
        $("#fb").querySelectorAll(".opt").forEach(o=>o.onclick=()=>{
          if(ans) return; ans=true; ctx.total++; logAnswer({ type: 'stem', q: 'Welke stem werkt het best?', k: o.dataset.k, lvl: LEVEL });
          if(o.dataset.k==="beer"){ ctx.ok++; SND.good(); o.classList.add("right"); $("#fb2").innerHTML=`<div class="fb good"><b>Ja!</b> De Beer-stem is rustig én stevig. Dan weten ze: jij meent het.</div>`; }
          else { SND.bad(); o.classList.add("wrong"); $("#fb2").innerHTML=`<div class="fb bad">${o.dataset.k==="muis"?"Muis-stem is zo zacht, dan luistert niemand.":"Draak-stem klinkt eng en boos, dan wordt het ruzie."} De <b>Beer-stem</b> werkt het best: rustig én stevig.</div>`; }
          $("#fb2").innerHTML+=`<div class="mt center"><button class="btn green" id="nx">Verder ➜</button></div>`;
          $("#nx").onclick=()=>{SND.tap();done();};
          $("#nx").scrollIntoView({behavior:"smooth",block:"end"});
        });
      }
    });
  },

  /* --- gedachten-bubbels --- */
  gedachten(a, ctx, done, head){
    let score=0, left=a.secs, running=false;
    show(head(`<div class="row between"><span class="score">💚 <span id="sc">0</span> / ${a.target}</span><span class="pill">⏱️ <span id="tl">${a.secs}</span></span></div>
      <div class="arena mt" id="ar"><div class="center" style="padding-top:22%"><p><b>💚 kracht-gedachte = 1 punt<br>🌧️ gemene gedachte omdraaien = 2 punten</b></p><button class="btn big green" id="go">Start! 💭</button></div></div>`));
    bindX();
    const ar=$("#ar");
    $("#go").onclick=()=>{
      ar.innerHTML=""; running=true;
      const spawn=()=>{
        if(!running) return;
        const gem=Math.random()<.42;
        const b=document.createElement("button");
        b.className="tb "+(gem?"g":"k");
        let flip=null;
        if(gem){ const g=pick(GEMEEN); b.textContent="🌧️ "+g[0]; flip=g[1]; } else b.textContent="💚 "+pick(KRACHT);
        const w=ar.clientWidth; b.style.left=Math.max(6,Math.random()*(w-240))+"px";
        const dur=(a.fast?5:6.5)+Math.random()*2; b.style.animationDuration=dur+"s";
        b.onpointerdown=(e)=>{
          e.preventDefault();
          if(b.dataset.used) return; b.dataset.used=1;
          if(gem){ score+=(has("schild")?4:2); SND.good(); b.className="tb flipped"; b.textContent="✨ "+flip; b.style.animationPlayState="paused";
            const t=document.createElement("div"); t.className="toast"; t.innerHTML="🔄 Omgedraaid: <b>"+flip+"</b>"; ar.appendChild(t);
            setTimeout(()=>{t.remove(); b.remove();},1500);
          } else { score+=1; SND.pop(); b.style.transition="transform .2s, opacity .2s"; b.style.opacity="0"; setTimeout(()=>b.remove(),220); }
          $("#sc").textContent=score;
        };
        b.addEventListener("animationend",()=>b.remove());
        ar.appendChild(b);
        later(spawn, (a.fast?750:950)+Math.random()*400);
      };
      spawn();
      const tick=()=>{ left--; const tl=$("#tl"); if(tl) tl.textContent=left;
        if(left<=0){ running=false; end(); } else later(tick,1000); };
      later(tick,1000);
    };
    function end(){
      clearTimers();
      S.bestThoughts=Math.max(S.bestThoughts||0,score); save();
      ctx.total++; ctx.ok += Math.min(1, score/a.target); logAnswer({ type: 'gedachten', q: 'Gedachten omdraaien', k: score >= a.target ? 'beer' : 'deels', score, target: a.target, lvl: LEVEL });
      SND.win(); if(score>=a.target) confetti(50);
      show(head(`<div class="grow"></div>${MASCOT()}<h2 class="center">${score} punten!</h2>
        <p class="center">${score>=a.target?"Wauw, jij bent een echte gedachten-vanger!":"Goed geoefend! Hoe vaker je het doet, hoe beter je wordt."}</p>
        <div class="card mt"><p class="center"><b>Onthoud:</b> als je hoofd zegt <i>“Ik kan niks”</i>, zeg jij terug: <b>“Ik kan veel, en de rest leer ik nog!”</b></p></div>
        <div class="mt2 center"><button class="btn big green" id="nx">Verder ➜</button></div><div class="grow"></div>`));
      bindX(); $("#nx").onclick=()=>{SND.tap();done();};
    }
  },

  /* --- zelf oplossen of hulp halen --- */
  sorteer(a, ctx, done, head){
    const pool = a.pool==="houd" ? HOUD : SORT;
    const keys = a.pool==="houd" ? ["vast","mee"] : ["zelf","hulp"];
    const items=shuffle(pool).slice(0,a.n||6); let n=0;
    function draw(){
      const it=items[n];
      show(head(`<div class="card"><div class="sitemoji">${it.e}</div><div class="sit center">${it.t}</div></div>
        <p class="center" style="font-weight:800;color:var(--soft)">${n+1}/${items.length}</p>
        <div class="row" style="gap:14px;align-items:stretch">
          ${keys.map(k=>`<button class="opt" data-a="${k}" style="flex:1;flex-direction:column;text-align:center"><span class="ic" style="font-size:54px">${SORT_LABELS[k].e}</span>${SORT_LABELS[k].t}</button>`).join("")}
        </div><div id="fb"></div>`));
      bindX();
      let ans=false;
      app.querySelectorAll(".opt").forEach(b=>b.onclick=()=>{
        if(ans) return; ans=true; ctx.total++;
        const ok=b.dataset.a===it.a; logAnswer({ type: 'sorteer', q: it.t, k: ok ? 'beer' : 'fout', want: it.a, lvl: LEVEL });
        app.querySelectorAll(".opt").forEach(x=>{ x.disabled=true; if(x.dataset.a===it.a) x.classList.add("right"); else x.classList.add(ok?"dim":"wrong"); });
        if(ok){ ctx.ok++; SND.good(); } else SND.bad();
        $("#fb").innerHTML=`<div class="fb ${ok?"good":"bad"}"><b>${ok?"Goed!":"Net niet."}</b> ${it.u}</div><div class="mt center"><button class="btn green" id="nx">Verder ➜</button></div>`;
        $("#nx").scrollIntoView({behavior:"smooth",block:"end"});
        $("#nx").onclick=()=>{ SND.tap(); n++; if(n<items.length) draw(); else done(); };
      });
    }
    draw();
  }
};

