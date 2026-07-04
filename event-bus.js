(function () {
  'use strict';

  // ============================================================
  // EVENT BUS — infraestrutura real de pub/sub.
  //
  // Antes disso, "eventos do jogo" não existiam como conceito no projeto:
  // dungeon.js usa um callback único (setOnVictory) trocado a cada sessão
  // de dungeon, e o resto do combate chama função direto. Isso funciona
  // pra "avisar quem está esperando agora", mas não dá pra ter N sistemas
  // (missão, telemetria, achievement, etc.) reagindo ao mesmo acontecimento
  // sem cada um pendurar mais um callback manual em cima do outro.
  //
  // Este módulo não substitui os callbacks existentes — dungeon.js e
  // combate-ui.js continuam funcionando exatamente como antes. Ele só dá
  // um canal adicional, best-effort, pra quem quiser ouvir sem precisar
  // ser registrado manualmente por quem dispara o evento.
  // ============================================================

  const listeners = new Map(); // eventName -> Set<fn>

  function on(eventName, fn) {
    if (typeof fn !== 'function') return () => {};
    if (!listeners.has(eventName)) listeners.set(eventName, new Set());
    listeners.get(eventName).add(fn);
    // retorna unsubscribe, pra quem se inscrever poder se desinscrever depois
    return () => off(eventName, fn);
  }

  function off(eventName, fn) {
    const set = listeners.get(eventName);
    if (set) set.delete(fn);
  }

  function emit(eventName, payload) {
    const set = listeners.get(eventName);
    if (!set || set.size === 0) return;
    // Cópia do set: um handler pode se desinscrever durante a própria chamada
    for (const fn of Array.from(set)) {
      try {
        fn(payload);
      } catch (e) {
        // Um listener quebrado não pode derrubar o jogo nem os outros listeners.
        console.warn('[EventBus] listener falhou para "' + eventName + '":', e);
      }
    }
  }

  window.SL_EventBus = { on, off, emit };
})();