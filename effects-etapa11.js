(function(){
  // Etapa 11 — Efeitos (somente VFX hooks e utilitários)
  const LS_KEY = 'sl_effects_etapa11_v1';

  const defaultState = {
    enabled: true,
    quality: 'alto',
    reducedMotion: false,

    // parâmetros globais (podem ser ajustados pelo app)
    intensity: {
      glow: 1.0,
      aura: 1.0,
      smoke: 1.0,
      lightning: 1.0,
      blood: 1.0,
      portal: 1.0,
      bloom: 1.0,
      cameraShake: 1.0,
      motionBlur: 1.0,
      vignette: 1.0,
    },
  };

  function load(){
    try{
      const raw = localStorage.getItem(LS_KEY);
      if(!raw) return { ...defaultState };
      const parsed = JSON.parse(raw);
      return { ...defaultState, ...(parsed && typeof parsed === 'object' ? parsed : {}) };
    }catch{ return { ...defaultState }; }
  }

  function save(next){
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  }

  let state = load();

  // -------------------------------------------------------------------------
  // Helpers DOM
  // -------------------------------------------------------------------------
  function getStage(){
    // Usa apenas o elemento particles existente para renderizações leves.
    // Se não existir, cria um container mínimo.
    let el = document.getElementById('effects-stage');
    if(!el){
      el = document.createElement('div');
      el.id = 'effects-stage';
      el.style.position = 'fixed';
      el.style.inset = '0';
      el.style.pointerEvents = 'none';
      el.style.zIndex = '1000';
      el.style.overflow = 'hidden';
      document.body.appendChild(el);
    }
    return el;
  }

  function shouldAnimate(){
    if(!state.enabled) return false;
    if(state.reducedMotion) return false;
    return true;
  }

  function createParticle({ x=50, y=50, size=2, color='rgba(179,65,255,0.8)', count=18, duration=650, drift=40 } = {}){
    if(!shouldAnimate()) return;
    const stage = getStage();
    for(let i=0;i<count;i++){
      const p = document.createElement('span');
      p.style.position='absolute';
      p.style.left = x + '%';
      p.style.top = y + '%';
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.borderRadius = '50%';
      p.style.background = color;
      p.style.boxShadow = `0 0 ${Math.max(4,size*2)}px ${color}`;
      p.style.opacity='0.75';
      const dx = (Math.random()*2-1)*drift;
      const dy = (Math.random()*2-1)*drift;
      p.style.transform = 'translate(0,0)';
      p.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;
      stage.appendChild(p);
      requestAnimationFrame(()=>{
        p.style.transform = `translate(${dx}px, ${dy}px)`;
        p.style.opacity = '0';
      });
      setTimeout(()=>p.remove(), duration+40);
    }
  }

  function flash({ x=50, y=50, color='rgba(255,210,76,0.35)', duration=220, radius=140 } = {}){
    if(!shouldAnimate()) return;
    const stage = getStage();
    const el = document.createElement('div');
    el.style.position='absolute';
    el.style.left = x+'%';
    el.style.top = y+'%';
    el.style.width = radius+'px';
    el.style.height = radius+'px';
    el.style.marginLeft = (-radius/2)+'px';
    el.style.marginTop = (-radius/2)+'px';
    el.style.borderRadius='50%';
    el.style.background = color;
    el.style.filter='blur(6px)';
    el.style.opacity='0.85';
    el.style.transition=`opacity ${duration}ms ease-out, transform ${duration}ms ease-out`;
    stage.appendChild(el);
    requestAnimationFrame(()=>{
      el.style.opacity='0';
      el.style.transform='scale(1.25)';
    });
    setTimeout(()=>el.remove(), duration+60);
  }

  // -------------------------------------------------------------------------
  // API — VFX hooks (usado pelo combate/boss)
  // -------------------------------------------------------------------------
  function setEnabled(v){
    state.enabled = !!v;
    save(state);
  }

  function setQuality(q){
    state.quality = q;
    save(state);
  }

  function setReducedMotion(v){
    state.reducedMotion = !!v;
    save(state);
  }

  // Glow/Aura/Fumaça/Raios/Portal/Explosões/Reflexos/Bloom/Shakes
  function glow({ x=50, y=50, color='rgba(179,65,255,0.35)', radius=120, duration=240 } = {}){
    flash({ x,y,color,duration,radius });
    createParticle({ x,y,size:2,color, count:14, duration:duration+120, drift:30 });
  }

  function aura({ x=50, y=50, color='rgba(47,216,255,0.18)', radius=170, duration=520 } = {}){
    flash({ x,y,color,duration, radius });
  }

  function smoke({ x=50, y=50, color='rgba(120,120,160,0.25)', count=22, duration=650 } = {}){
    if(!shouldAnimate()) return;
    createParticle({ x,y,size:3,color,count,duration,drift:60 });
  }

  function lightning({ x=50, y=50, color='rgba(47,216,255,0.65)', count=26, duration=460 } = {}){
    if(!shouldAnimate()) return;
    createParticle({ x,y,size:2,color,count,duration,drift:55 });
    // “traço” visual simples
    const stage = getStage();
    const trace = document.createElement('div');
    trace.style.position='absolute';
    trace.style.left = x+'%';
    trace.style.top = y+'%';
    trace.style.width='2px';
    trace.style.height='180px';
    trace.style.background = color;
    trace.style.boxShadow = `0 0 18px ${color}`;
    trace.style.transform = 'translate(-50%, -50%) rotate('+(Math.random()*20-10)+'deg) scaleY(0.2)';
    trace.style.transformOrigin='top';
    trace.style.opacity='0.9';
    trace.style.transition=`transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;
    stage.appendChild(trace);
    requestAnimationFrame(()=>{
      trace.style.opacity='0';
      trace.style.transform = 'translate(-50%, -50%) rotate('+(Math.random()*20-10)+'deg) scaleY(1)';
    });
    setTimeout(()=>trace.remove(), duration+70);
  }

  function blood({ x=50, y=50, color='rgba(255,43,78,0.55)', count=34, duration=420 } = {}){
    if(!shouldAnimate()) return;
    createParticle({ x,y,size:3,color,count,duration,drift:65 });
  }

  function portal({ x=50, y=50, color='rgba(179,65,255,0.45)', radius=150, duration=720 } = {}){
    if(!shouldAnimate()) return;
    flash({ x,y,color,duration:duration*0.35,radius });
    const stage = getStage();
    const ring = document.createElement('div');
    ring.style.position='absolute';
    ring.style.left = x+'%';
    ring.style.top = y+'%';
    ring.style.width = radius+'px';
    ring.style.height = radius+'px';
    ring.style.marginLeft = (-radius/2)+'px';
    ring.style.marginTop = (-radius/2)+'px';
    ring.style.borderRadius='50%';
    ring.style.border = '2px solid rgba(179,65,255,0.45)';
    ring.style.boxShadow = `0 0 36px ${color}`;
    ring.style.opacity='0.9';
    ring.style.filter='blur(0.5px)';
    ring.style.transition=`transform ${duration}ms ease-out, opacity ${duration}ms ease-out, border-color ${duration}ms ease-out`;
    stage.appendChild(ring);
    requestAnimationFrame(()=>{
      ring.style.opacity='0';
      ring.style.transform='scale(1.35) rotate('+(Math.random()*60-30)+'deg)';
      ring.style.borderColor='rgba(255,210,76,0.35)';
    });
    setTimeout(()=>ring.remove(), duration+120);
    createParticle({ x,y,size:2,color,count:30,duration:duration,drift:85 });
  }

  function brilho({ x=50, y=50, color='rgba(255,210,76,0.5)', duration=260, radius=120 } = {}){
    glow({ x,y,color,radius,duration });
  }

  function explosion({ x=50, y=50, color='rgba(179,65,255,0.35)', duration=360 } = {}){
    if(!shouldAnimate()) return;
    const stage = getStage();
    const el = document.createElement('div');
    el.style.position='absolute';
    el.style.left=x+'%'; el.style.top=y+'%';
    el.style.width='10px'; el.style.height='10px';
    el.style.borderRadius='50%';
    el.style.background=color;
    el.style.boxShadow=`0 0 24px ${color}`;
    el.style.opacity='0.9';
    el.style.transform='translate(-50%,-50%) scale(0.3)';
    el.style.transition=`transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;
    stage.appendChild(el);
    requestAnimationFrame(()=>{
      el.style.opacity='0';
      el.style.transform='translate(-50%,-50%) scale(2.0)';
    });
    setTimeout(()=>el.remove(), duration+80);
    createParticle({ x,y,size:2,color,count:44,duration:duration+120,drift:120 });
  }

  function reflexos({ x=50, y=50, color='rgba(47,216,255,0.15)', duration=520 } = {}){
    // reflexo = flash + partículas
    aura({ x,y,color, radius:190, duration });
  }

  function luzDinamica({ color='rgba(255,210,76,0.18)', x=50, y=50, duration=380 } = {}){
    // “dynamic light” simplificado
    flash({ x,y,color,duration,radius:220 });
  }

  function bloom({ intensity=1, duration=220 } = {}){
    // Hook sem shader real: altera filtro do body (fallback)
    if(!shouldAnimate()) return;
    const body = document.body;
    const prev = body.style.filter;
    const blur = (6 * (intensity||1));
    body.style.transition = `filter ${duration}ms ease-out`;
    body.style.filter = `blur(${blur*0.15}px) saturate(${1+intensity*0.4})`;
    setTimeout(()=>{ body.style.filter = prev || ''; }, duration+40);
  }

  function motionBlur({ intensity=1, duration=220 } = {}){
    if(!shouldAnimate()) return;
    // fallback: pequena animação com opacidade
    const stage = getStage();
    const overlay = document.createElement('div');
    overlay.style.position='absolute';
    overlay.style.inset='0';
    overlay.style.background='rgba(0,0,0,0.1)';
    overlay.style.backdropFilter='blur(3px)';
    overlay.style.opacity='0';
    overlay.style.transition=`opacity ${duration}ms ease-out`;
    stage.appendChild(overlay);
    requestAnimationFrame(()=>{ overlay.style.opacity=String(0.25*(intensity||1)); });
    setTimeout(()=>overlay.remove(), duration+60);
  }

  function cameraImpactShake({ intensity=1, duration=120 } = {}){
    if(!shouldAnimate()) return;
    const stage = document.documentElement;
    const root = document.body;
    const prev = root.style.transform;
    const amp = 4 * (intensity||1);
    const start = Date.now();

    function tick(){
      const t = Date.now()-start;
      if(t>=duration){
        root.style.transform = prev;
        return;
      }
      const k = 1 - t/duration;
      const dx = (Math.random()*2-1)*amp*k;
      const dy = (Math.random()*2-1)*amp*k;
      root.style.transform = `translate(${dx}px, ${dy}px)`;
      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  function transitionCinematic({ duration=420 } = {}){
    if(!shouldAnimate()) return;
    const stage = getStage();
    const wipe = document.createElement('div');
    wipe.style.position='absolute';
    wipe.style.left='-10%';
    wipe.style.top='-10%';
    wipe.style.width='120%';
    wipe.style.height='120%';
    wipe.style.background='linear-gradient(120deg, rgba(179,65,255,0.0), rgba(179,65,255,0.18), rgba(0,0,0,0.0))';
    wipe.style.transform='translateX(-30%)';
    wipe.style.opacity='0.0';
    wipe.style.transition=`transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;
    stage.appendChild(wipe);
    requestAnimationFrame(()=>{
      wipe.style.opacity='1';
      wipe.style.transform='translateX(30%)';
    });
    setTimeout(()=>wipe.remove(), duration+80);
  }

  function screenTremor({ intensity=1, duration=180 } = {}){
    cameraImpactShake({ intensity, duration });
  }

  function vignette({ enabled=true, intensity=0.35, duration=200 } = {}){
    if(!shouldAnimate()) return;
    const prev = document.body.style.background;
    const alpha = enabled ? intensity : 0;
    document.body.style.transition = `background ${duration}ms ease-out`;
    document.body.style.background = `radial-gradient(circle at center, rgba(0,0,0,0) 40%, rgba(0,0,0,${alpha}) 100%), var(--c-void)`;
    setTimeout(()=>{ document.body.style.background = prev || ''; }, duration+60);
  }

  // expose window hook for compatibility com combate-etapa9 hooks
  window.SL_EffectsEtapa11 = {
    state,
    setEnabled,
    setQuality,
    setReducedMotion,

    // primitives
    glow,
    aura,
    smoke,
    lightning,
    blood,
    portal,
    brilho,
    explosion,
    reflexos,
    luzDinamica,
    bloom,
    motionBlur,
    cameraImpactShake,
    transitionCinematic,
    screenTremor,
    vignette,
    createParticle,
    flash,
  };
})();

