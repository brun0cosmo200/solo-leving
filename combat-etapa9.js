(function () {
  // Etapa 9 — Sistema de combate (UI mínima; motor lógico para estados)
  // Objetivo: prover um "framework" semelhante ao combate de Solo Leveling.

  const LS_KEY = 'sl_combat_etapa9_v1';

  const defaultState = {
    hp: 100,
    maxHp: 100,
    mp: 100,
    maxMp: 100,

    stamina: 100,
    maxStamina: 100,

    // probabilidades
    critChance: 0.12, // 0..1
    missChance: 0.04, // 0..1
    accuracy: 0.85, // 0..1

    // resistências/ fraquezas por elemento
    elemental: {
      // Ex.: { fogo: 0.9, gelo: 1.2 }
      fogo: 1.0,
      gelo: 1.0,
      eletricidade: 1.0,
      sombra: 1.0,
      luz: 1.0,
    },

    // cooldowns
    cooldowns: {
      // attackName: timestamp(ms) quando pode usar novamente
    },

    // combo
    combo: {
      count: 0,
      aerial: false,
      timeoutAt: null, // ms
      lastAirAt: null,
    },

    // buffs temporários
    buffs: {
      // key: { until: timestamp }
    },
  };

  function load() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return { ...defaultState };
      const parsed = JSON.parse(raw);
      return deepMergeStructured(defaultState, parsed);
    } catch {
      return { ...defaultState };
    }
  }

  function save(next) {
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  }

  function deepMergeStructured(base, patch) {
    // merge simples/seguro para objetos
    if (!patch || typeof patch !== 'object') return base;
    const out = Array.isArray(base) ? base.slice() : { ...base };
    for (const k of Object.keys(patch)) {
      const pv = patch[k];
      const bv = out[k];
      if (pv && typeof pv === 'object' && !Array.isArray(pv) && bv && typeof bv === 'object' && !Array.isArray(bv)) {
        out[k] = deepMergeStructured(bv, pv);
      } else {
        out[k] = pv;
      }
    }
    return out;
  }

  let state = load();

  // ---------------------------------------------------------------------------
  // Tipos e constantes
  // ---------------------------------------------------------------------------
  const FLAGS = {
    // janela (ms) para eventos rápidos
    qteWindowMs: 240,
    perfectWindowMs: 70,
  };

  const ELEMENTS = ['fogo', 'gelo', 'eletricidade', 'sombra', 'luz'];

  // ---------------------------------------------------------------------------
  // Util
  // ---------------------------------------------------------------------------
  function now() {
    return Date.now();
  }

  function clamp01(x) {
    return Math.max(0, Math.min(1, x));
  }

  function clamp(x, a, b) {
    return Math.max(a, Math.min(b, x));
  }

  function withCooldown(key, ms) {
    const t = now();
    const readyAt = state.cooldowns[key] || 0;
    if (t < readyAt) return false;
    state.cooldowns[key] = t + ms;
    save(state);
    return true;
  }

  // ---------------------------------------------------------------------------
  // Defesa ofensiva: esquiva/parry com QTE
  // ---------------------------------------------------------------------------
  // Retorna: { result: 'miss'|'dodge'|'parry'|'perfect-dodge'|'perfect-block', qteDeltaMs }
  function resolveDefense({ type, qteDeltaMs }) {
    const d = Math.abs(qteDeltaMs ?? 9999);

    if (type === 'dodge') {
      if (d <= FLAGS.perfectWindowMs) return { result: 'perfect-dodge', qteDeltaMs: qteDeltaMs };
      if (d <= FLAGS.qteWindowMs) return { result: 'dodge', qteDeltaMs: qteDeltaMs };
      return { result: 'miss', qteDeltaMs: qteDeltaMs };
    }

    if (type === 'parry') {
      if (d <= FLAGS.perfectWindowMs) return { result: 'perfect-block', qteDeltaMs: qteDeltaMs };
      if (d <= FLAGS.qteWindowMs) return { result: 'parry', qteDeltaMs: qteDeltaMs };
      return { result: 'miss', qteDeltaMs: qteDeltaMs };
    }

    return { result: 'miss', qteDeltaMs: qteDeltaMs };
  }

  // ---------------------------------------------------------------------------
  // Chances e dano
  // ---------------------------------------------------------------------------
  function rollAttackOutcome({ element, baseAccuracy = null }) {
    const acc = clamp01(baseAccuracy ?? state.accuracy);

    // erro se random > accuracy
    const miss = Math.random() < clamp01(state.missChance) || Math.random() > acc;
    if (miss) return { missed: true, crit: false };

    // crítico
    const crit = Math.random() < clamp01(state.critChance);
    return { missed: false, crit };
  }

  function computeElementMultiplier(element) {
    const el = (element || 'sombra');
    if (!ELEMENTS.includes(el)) return 1.0;
    return Number(state.elemental?.[el] ?? 1.0);
  }

  function applyDamage({ amount, element, source = 'player' }) {
    // elemento modifica multiplicador (fraquezas elementais)
    const mult = computeElementMultiplier(element);
    const dmg = Math.max(0, Math.round(amount * mult));

    if (source === 'boss' || source === 'enemy') {
      state.hp = clamp(state.hp - dmg, 0, state.maxHp);
    } else {
      // player recebe dano: treat como inimigo -> hp do player
      state.hp = clamp(state.hp - dmg, 0, state.maxHp);
    }

    save(state);
    return { dmg, hp: state.hp };
  }

  function applyStaminaCost(cost) {
    const c = Math.max(0, Number(cost) || 0);
    state.stamina = clamp(state.stamina - c, 0, state.maxStamina);
    save(state);
    return state.stamina;
  }

  // ---------------------------------------------------------------------------
  // Animações/VFX/SFX — hooks (sem depender de assets)
  // ---------------------------------------------------------------------------
  // O app pode plugar callbacks para efeitos cinematográficos.
  const effects = {
    screenShake: null,
    slowMotion: null,
    spawnParticles: null,
    playSfx: null,
    changeCameraImpact: null,
    cinematicCut: null,
  };

  function setEffects(next) {
    Object.assign(effects, next || {});
  }

  // ---------------------------------------------------------------------------
  // Sistema de combo / combo aéreo
  // ---------------------------------------------------------------------------
  function resetCombo() {
    state.combo.count = 0;
    state.combo.aerial = false;
    state.combo.timeoutAt = null;
    state.combo.lastAirAt = null;
    save(state);
  }

  function registerComboHit({ aerial = false, timeoutMs = 900 } = {}) {
    const t = now();
    if (state.combo.timeoutAt && t > state.combo.timeoutAt) {
      state.combo.count = 0;
      state.combo.aerial = false;
    }

    state.combo.count += 1;

    if (aerial) {
      state.combo.aerial = true;
      state.combo.lastAirAt = t;
    }

    state.combo.timeoutAt = t + timeoutMs;
    save(state);
    return { count: state.combo.count, aerial: state.combo.aerial };
  }

  function getComboMultiplier() {
    const n = state.combo.count || 0;
    const base = 1.0;
    const bonus = Math.min(0.35, n * 0.08);
    return base + bonus;
  }

  // ---------------------------------------------------------------------------
  // Ataques: carregado e especiais (base lógico)
  // ---------------------------------------------------------------------------
  function canUseAttack(key, staminaCost = 0) {
    if (!withCooldown('tmp', 0)) {
      // ignore
    }
    if (state.stamina < staminaCost) return false;
    return true;
  }

  function attackCharged({ element = 'sombra', baseDamage = 20, staminaCost = 12, cooldownMs = 650, outcome = {} } = {}) {
    // outcome pode vir do resolveDefense/roll externo
    if (!withCooldown('attack_charged', cooldownMs)) return { ok: false, reason: 'cooldown' };
    if (state.stamina < staminaCost) return { ok: false, reason: 'stamina' };

    applyStaminaCost(staminaCost);

    if (effects.slowMotion) effects.slowMotion({ factor: 0.55, ms: 110 });
    if (effects.cinematicCut) effects.cinematicCut({ type: 'charged-start' });
    if (effects.spawnParticles) effects.spawnParticles({ key: 'charged', element });
    if (effects.playSfx) effects.playSfx({ key: 'charged', element });

    const roll = outcome && typeof outcome === 'object' && (outcome.missed !== undefined || outcome.crit !== undefined)
      ? outcome
      : rollAttackOutcome({ element });

    if (roll.missed) {
      resetCombo();
      return { ok: true, missed: true, crit: false, dmg: 0 };
    }

    const mult = computeElementMultiplier(element);
    const comboMult = getComboMultiplier();
    const critMult = roll.crit ? 1.65 : 1.0;

    const dmg = Math.round(baseDamage * comboMult * critMult * (mult || 1.0));

    if (effects.screenShake) effects.screenShake({ intensity: 0.65, ms: 140 });
    if (effects.changeCameraImpact) effects.changeCameraImpact({ strength: 1.0 });

    registerComboHit({ aerial: false });
    save(state);

    return { ok: true, missed: false, crit: !!roll.crit, dmg };
  }

  // Ataque normal (para compor combo)
  function attackQuick({ element = 'sombra', baseDamage = 12, staminaCost = 4, cooldownMs = 220, aerial = false } = {}) {
    if (!withCooldown('attack_quick', cooldownMs)) return { ok: false, reason: 'cooldown' };
    if (state.stamina < staminaCost) return { ok: false, reason: 'stamina' };

    applyStaminaCost(staminaCost);

    const roll = rollAttackOutcome({ element });
    if (roll.missed) {
      resetCombo();
      return { ok: true, missed: true, crit: false, dmg: 0 };
    }

    const comboMult = getComboMultiplier();
    const critMult = roll.crit ? 1.35 : 1.0;
    const mult = computeElementMultiplier(element);

    const dmg = Math.round(baseDamage * comboMult * critMult * mult);

    if (effects.spawnParticles) effects.spawnParticles({ key: 'hit', aerial, element });
    if (effects.playSfx) effects.playSfx({ key: 'hit', aerial, element });

    registerComboHit({ aerial });

    return { ok: true, missed: false, crit: !!roll.crit, dmg, aerial };
  }

  function quickTimeEvent({ expectedAction, playerAction, deltaMs }) {
    // placeholder genérico: esperada vs realizada
    // Retorna uma classificação para o consumidor.
    if (playerAction !== expectedAction) {
      return { ok: false, result: 'fail', deltaMs };
    }

    const abs = Math.abs(deltaMs ?? 9999);
    if (abs <= FLAGS.perfectWindowMs) return { ok: true, result: 'perfect', deltaMs };
    if (abs <= FLAGS.qteWindowMs) return { ok: true, result: 'success', deltaMs };
    return { ok: true, result: 'miss', deltaMs };
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------
  window.SL_CombatEtapa9 = {
    state,
    setEffects,
    resolveDefense,

    rollAttackOutcome,
    computeElementMultiplier,

    attackQuick,
    attackCharged,
    quickTimeEvent,

    registerComboHit,
    getComboMultiplier,
    resetCombo,

    applyDamage,
    applyStaminaCost,
  };
})();

