(function(){
  // Etapa 13 — wrapper de eventos VFX
  const fx = () => window.SL_EffectsEtapa13;

  function play({ type, payload } = {}){
    const fxt = fx();
    if(!fxt || !type) return false;
    const p = payload || {};

    const map = {
      vibrate: fxt.screenVibration,
      vibra: fxt.screenVibration,
      sweep: fxt.spectralSweep,
      portalburst: fxt.addPortalBurst,
      portal: fxt.addPortalBurst,
    };

    const fn = map[type] || null;
    if(typeof fn !== 'function') return false;
    fn(p);
    return true;
  }

  window.SL_EventosEtapa13 = { play };
})();

