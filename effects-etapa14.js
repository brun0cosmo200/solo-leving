(function(){
  // Etapa 14 — Efeitos (camada superior)
  // Reaproveita Etapa 13/11 para garantir consistência.
  const fx13 = window.SL_EffectsEtapa13;
  const fx11 = window.SL_EffectsEtapa11;

  const LS_KEY = 'sl_effects_etapa14_v1';
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

  function killStreakPulse(p={}){
    if(!shouldAnimate()) return;
    const x = p.x ?? 50;
    const y = p.y ?? 50;
    const duration = p.duration ?? 320;
    const color = p.color ?? 'rgba(255,210,76,0.22)';

    if(fx11 && fx11.reflexos) fx11.reflexos({ x, y, duration });
    if(fx11 && fx11.brilho) fx11.brilho({ x, y, color, duration, radius: p.radius ?? 130 });
    if(fx13 && fx13.screenVibration) fx13.screenVibration({ intensity: p.intensity ?? 1.0, duration: Math.max(120, Math.floor(duration*0.5)) });
  }

  function bossOverdrive(p={}){
    if(!shouldAnimate()) return;
    const duration = p.duration ?? 650;
    if(fx13 && fx13.spectralSweep) fx13.spectralSweep({ x: p.x ?? 50, y: p.y ?? 50, duration, radius: p.radius ?? 190 });
    if(fx11 && fx11.lightning) fx11.lightning({ x: p.x ?? 50, y: p.y ?? 50, duration: Math.floor(duration*0.65) });
    if(fx11 && fx11.bloom) fx11.bloom({ intensity: p.intensity ?? 1.25, duration: Math.floor(duration*0.35) });
  }

  window.SL_EffectsEtapa14 = {
    state,
    setEnabled,
    setReducedMotion,
    killStreakPulse,
    bossOverdrive,
  };
})();

