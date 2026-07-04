(function(){
  // Etapa 12 — efeitos reusáveis em formato de eventos
  // Sem UI: apenas helpers para o motor do jogo chamar.

  const effects = () => window.SL_EffectsEtapa11;

  function play({ type, payload } = {}){
    const fx = effects();
    if(!fx || !type) return false;
    const p = payload || {};

    const map = {
      glow: fx.glow,
      aura: fx.aura,
      smoke: fx.smoke,
      raios: fx.lightning,
      lightning: fx.lightning,
      sangue: fx.blood,
      portal: fx.portal,
      brilho: fx.brilho,
      explosao: fx.explosion,
      explosion: fx.explosion,
      reflexos: fx.reflexos,
      reflexo: fx.reflexos,
      luz: fx.luzDinamica,
      bloom: fx.bloom,
      motionblur: fx.motionBlur,
      shake: fx.cameraImpactShake,
      tremor: fx.screenTremor,
      cinematic: fx.transitionCinematic,
      vignette: fx.vignette,
    };

    const fn = map[type] || null;
    if(typeof fn !== 'function') return false;
    fn(p);
    return true;
  }

  window.SL_EventosEtapa12 = { play };
})();

