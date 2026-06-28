(function(){
  // Etapa 14 — wrapper de eventos VFX
  const fx = () => window.SL_EffectsEtapa14;

  function play({ type, payload } = {}){
    const fxt = fx();
    if(!fxt || !type) return false;
    const p = payload || {};

    const map = {
      killstreak: fxt.killStreakPulse,
      streak: fxt.killStreakPulse,
      overdrive: fxt.bossOverdrive,
      boss: fxt.bossOverdrive,
    };

    const fn = map[type] || null;
    if(typeof fn !== 'function') return false;
    fn(p);
    return true;
  }

  window.SL_EventosEtapa14 = { play };
})();

