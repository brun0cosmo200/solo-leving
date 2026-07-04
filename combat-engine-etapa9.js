(function () {
  'use strict';

  // ============================================================
  // Etapa 9 — MOTOR de combate (window.SL_CombatEtapa9)
  //
  // Esse arquivo não existia: "combat-etapa9.js" contém a UI inteira
  // (injeta #view-combate, botões, QTE, HUD) mas depende de
  // window.SL_CombatEtapa9 para os números reais (HP/MP/stamina/combo,
  // dano, crítico, resolução de esquiva/parry). Sem ele, todo clique em
  // Ataque Rápido/Carregado/Esquivar/Parry silenciosamente não fazia nada
  // (os métodos abaixo existiam só como chamadas pendentes, `c9()`
  // sempre retornava null).
  // ============================================================

  // --- Tunáveis ------------------------------------------------
  const STAMINA_COST_QUICK   = 4;
  const STAMINA_COST_CHARGED = 12;

  const COOLDOWN_QUICK_MS   = 380;  // evita spam de clique
  const COOLDOWN_CHARGED_MS = 900;

  const MISS_CHANCE_QUICK   = 0.06; // 6%
  const MISS_CHANCE_CHARGED = 0.10; // 10% — mais arriscado, mais lento

  const CRIT_CHANCE_BASE     = 0.12;
  const CRIT_CHANCE_PER_COMBO = 0.015; // cada estágio de combo soma um pouco de crítico
  const CRIT_MULTIPLIER      = 1.8;

  const COMBO_MAX_STACK          = 8;
  const COMBO_DAMAGE_PER_STACK_Q = 0.06; // ataque rápido escala bem com combo
  const COMBO_DAMAGE_PER_STACK_C = 0.035; // carregado escala menos (já é forte sozinho)

  // Janela do QTE chega escalada para 0..240ms (ver scaleQteDelta em combat-etapa9.js,
  // que mapeia os 1400ms visuais para essa faixa). Os comentários no HTML injetado
  // já descrevem a "zona perfeita" como ~28% da barra ≈ 70ms aqui.
  const PERFECT_WINDOW_MS = 70;
  const LATE_WINDOW_MS    = 200; // depois disso, mesmo clicando, conta como reação tardia

  // --- Estado ----------------------------------------------------
  // Os valores reais de hp/mp são sobrescritos por combat-etapa9.js no
  // início de cada luta (puxando do personagem salvo). Os defaults aqui
  // só evitam undefined antes da primeira luta.
  const state = {
    hp: 120, maxHp: 120,
    mp: 100, maxMp: 100,
    stamina: 100, maxStamina: 100,
    combo: { count: 0 },
    lastQuickAt: 0,
    lastChargedAt: 0,
  };

  // --- Hooks visuais (setEffects) ---------------------------------
  let hooks = {
    screenShake: null,
    spawnParticles: null,
    slowMotion: null,
    playSfx: null,
    changeCameraImpact: null,
    cinematicCut: null,
  };

  function setEffects(next) {
    hooks = Object.assign({}, hooks, next || {});
  }

  function callHook(name, payload) {
    const fn = hooks[name];
    if (typeof fn !== 'function') return;
    try { fn(payload); } catch (e) { /* um hook visual nunca pode travar o combate */ }
  }

  // --- Helpers -----------------------------------------------------
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function rollCrit() {
    const stacks = Math.min(state.combo.count, COMBO_MAX_STACK);
    const chance = CRIT_CHANCE_BASE + stacks * CRIT_CHANCE_PER_COMBO;
    return Math.random() < chance;
  }

  // --- Ações ofensivas -----------------------------------------------
  function attackQuick({ element, baseDamage = 10 } = {}) {
    const now = Date.now();
    if (now - state.lastQuickAt < COOLDOWN_QUICK_MS) {
      return { ok: false, reason: 'cooldown' };
    }
    if (state.stamina < STAMINA_COST_QUICK) {
      return { ok: false, reason: 'stamina' };
    }

    state.stamina = clamp(state.stamina - STAMINA_COST_QUICK, 0, state.maxStamina);
    state.lastQuickAt = now;

    if (Math.random() < MISS_CHANCE_QUICK) {
      state.combo.count = 0;
      return { ok: true, missed: true, dmg: 0, crit: false };
    }

    const stacks = Math.min(state.combo.count, COMBO_MAX_STACK);
    const crit = rollCrit();
    let dmg = Math.round(baseDamage * (1 + stacks * COMBO_DAMAGE_PER_STACK_Q));
    if (crit) {
      dmg = Math.round(dmg * CRIT_MULTIPLIER);
      callHook('spawnParticles', { x: 50, y: 30 });
    }

    state.combo.count = stacks + 1;

    return { ok: true, missed: false, dmg, crit, element: element || null };
  }

  function attackCharged({ element, baseDamage = 20 } = {}) {
    const now = Date.now();
    if (now - state.lastChargedAt < COOLDOWN_CHARGED_MS) {
      return { ok: false, reason: 'cooldown' };
    }
    if (state.stamina < STAMINA_COST_CHARGED) {
      return { ok: false, reason: 'stamina' };
    }

    state.stamina = clamp(state.stamina - STAMINA_COST_CHARGED, 0, state.maxStamina);
    state.lastChargedAt = now;

    if (Math.random() < MISS_CHANCE_CHARGED) {
      state.combo.count = 0;
      return { ok: true, missed: true, dmg: 0, crit: false };
    }

    const stacks = Math.min(state.combo.count, COMBO_MAX_STACK);
    const crit = rollCrit();
    let dmg = Math.round(baseDamage * (1 + stacks * COMBO_DAMAGE_PER_STACK_C));
    if (crit) {
      dmg = Math.round(dmg * CRIT_MULTIPLIER);
      callHook('changeCameraImpact', { intensity: 1.2 });
    }

    state.combo.count = Math.min(stacks + 1, COMBO_MAX_STACK);
    callHook('screenShake', { intensity: crit ? 1.1 : 0.7, duration: 140 });

    return { ok: true, missed: false, dmg, crit, element: element || null };
  }

  // --- Defesa (QTE) --------------------------------------------------
  // type: 'dodge' | 'parry'. qteDeltaMs já vem escalado para 0..240 por
  // combat-etapa9.js. Resultado classifica a reação — quem aplica o dano
  // reduzido ou total é o chamador (resolveIncoming em combat-etapa9.js).
  function resolveDefense({ type, qteDeltaMs = 0 } = {}) {
    if (qteDeltaMs > LATE_WINDOW_MS) {
      return { result: 'late', type: type || null };
    }

    const perfect = qteDeltaMs <= PERFECT_WINDOW_MS;

    if (type === 'dodge') return { result: perfect ? 'perfect-dodge' : 'dodge' };
    if (type === 'parry') return { result: perfect ? 'perfect-block' : 'parry' };

    return { result: 'late', type: type || null };
  }

  // --- Dano recebido ---------------------------------------------------
  function applyDamage({ amount = 0, element, source } = {}) {
    const dmg = Math.max(0, Math.round(amount));
    state.hp = clamp(state.hp - dmg, 0, state.maxHp);
    if (dmg > 0) callHook('screenShake', { intensity: 0.5, duration: 100 });
    return { ok: true, hp: state.hp, dmg };
  }

  // ============================================================
  window.SL_CombatEtapa9 = {
    state,
    setEffects,
    attackQuick,
    attackCharged,
    resolveDefense,
    applyDamage,
  };
})();
