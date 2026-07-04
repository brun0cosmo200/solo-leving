(function(){
  // Etapa 13 — Efeitos avançados (placeholder leve para manter pipeline)
  // Objetivo: garantir disponibilidade de hooks extras para etapas 13/14.
  const fx11 = window.SL_EffectsEtapa11;

  const LS_KEY = 'sl_effects_etapa13_v1';
  const defaultState = { enabled: true, reducedMotion: false };

  function load(){
    try{
      const raw = localStorage.getItem(LS_KEY);
      if(!raw) return { ...defaultState };
      const parsed = JSON.parse(raw);
      return { ...defaultState, ...(parsed && typeof parsed === 'object' ? parsed : {}) };
    }catch{ return { ...defaultState }; }
  }
  function save(s){ localStorage.setItem(LS_KEY, JSON.stringify(s)); }

  const state = load();

  function shouldAnimate(){
    if(!state.enabled) return false;
    if(state.reducedMotion) return false;
    return true;
  }

  function setEnabled(v){ state.enabled = !!v; save(state); }
  function setReducedMotion(v){ state.reducedMotion = !!v; save(state); }

  // “Avançados” mapeados para efeitos existentes de forma conservadora
  function screenVibration(p={}){
    if(!shouldAnimate()) return;
    const intensity = p.intensity ?? 1;
    const duration = p.duration ?? 160;
    if(fx11 && fx11.screenTremor) fx11.screenTremor({ intensity, duration });
  }

  function spectralSweep(p={}){
    if(!shouldAnimate()) return;
    const x = p.x ?? 50;
    const y = p.y ?? 50;
    const color = p.color ?? 'rgba(179,65,255,0.18)';
    if(fx11 && fx11.transitionCinematic) fx11.transitionCinematic({ duration: p.duration ?? 420 });
    if(fx11 && fx11.glow) fx11.glow({ x, y, color, radius: p.radius ?? 160, duration: p.duration ?? 240 });
  }

  function addPortalBurst(p={}){
    if(!shouldAnimate()) return;
    if(fx11 && fx11.portal){
      fx11.portal({
        x: p.x ?? 50,
        y: p.y ?? 50,
        duration: p.duration ?? 720,
        radius: p.radius ?? 160,
      });
    }
  }

  window.SL_EffectsEtapa13 = {
    state,
    setEnabled,
    setReducedMotion,
    // extras
    screenVibration,
    spectralSweep,
    addPortalBurst,
  };
})();

