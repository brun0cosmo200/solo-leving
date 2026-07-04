(function () {
  // Etapa 10 — Sistema de Boss (fases, cutscenes, mecânicas, drops, IA)
  // Motor lógico e callbacks para o app renderizar cutscenes/sons/animações.

  const LS_KEY = 'sl_boss_etapa10_v1';

  const defaultState = {
    bossId: null,
    phaseIndex: 0,
    hp: 1000,
    maxHp: 1000,
    enraged: false,
    // memória para IA
    memory: {
      lastPlayerAction: null,
      timesPerfectDodge: 0,
      timesPerfectBlock: 0,
      playerAggroScore: 0,
      // cooldown de habilidades do boss
      bossCooldowns: {},
    },
    dropsUnlocked: [],
  };

  function load() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return { ...defaultState };
      const parsed = JSON.parse(raw);
      return { ...defaultState, ...(parsed && typeof parsed === 'object' ? parsed : {}) };
    } catch {
      return { ...defaultState };
    }
  }

  function save(next) {
    localStorage.setItem(LS_KEY, JSON.stringify(next || {}));
  }

  let state = load();

  // ---------------------------------------------------------------------------
  // Definição do boss (modelo extensível)
  // ---------------------------------------------------------------------------
  const BOSS_LIBRARY = {
    // Exemplo genérico; você pode criar novos bosses adicionando aqui.
    'boss-shadow-warden': {
      id: 'boss-shadow-warden',
      nome: 'Sentinela das Sombras',
      musicaPorFase: ['shadow_ambient_a', 'shadow_ambient_b', 'shadow_ambient_c'],
      phases: [
        {
          index: 0,
          name: 'Fase 1 — Observador',
          hpAbove: 0.66, // acima de 66%
          music: 'shadow_ambient_a',
          cutscenes: [
            { key: 'intro', text: 'O ar se condensa ao redor do caçador…' },
          ],
          uniqueAttacks: [
            { key: 'slash-wave', name: 'Lâmina-onda', staminaCost: 0, cooldownMs: 1200 },
            { key: 'stalk-step', name: 'Passo de caça', staminaCost: 0, cooldownMs: 900 },
          ],
          transitions: [
            { trigger: 'hpBelow', value: 0.66, toPhase: 1 },
          ],
        },
        {
          index: 1,
          name: 'Fase 2 — Pressão',
          hpAbove: 0.33,
          music: 'shadow_ambient_b',
          cutscenes: [
            { key: 'phase2', text: 'As sombras se dividem… como se tivessem aprendido seu ritmo.' },
          ],
          uniqueAttacks: [
            { key: 'parry-breach', name: 'Ruptura de Postura', cooldownMs: 1400 },
            { key: 'emberless-ring', name: 'Anel sem Brasa', cooldownMs: 1100 },
          ],
          transitions: [
            { trigger: 'hpBelow', value: 0.33, toPhase: 2 },
          ],
        },
        {
          index: 2,
          name: 'Fase 3 — Monarca',
          hpAbove: 0,
          music: 'shadow_ambient_c',
          cutscenes: [
            { key: 'phase3', text: 'O Boss transforma a própria dor em lâmina.' },
            { key: 'final-shift', text: 'Mudança de forma — agora as sombras respiram contigo.' },
          ],
          uniqueAttacks: [
            { key: 'vortex-perfect', name: 'Vórtice Perfeito', cooldownMs: 1700 },
            { key: 'finisher-ink', name: 'Assinatura de Tinta', cooldownMs: 2200 },
          ],
          transitions: [
            { trigger: 'hpBelow', value: 0.02, toPhase: 3 },
          ],
        },
        {
          index: 3,
          name: 'Fase 4 — Ruptura',
          hpAbove: 0,
          music: 'shadow_ambient_c',
          cutscenes: [
            { key: 'break', text: 'O Sistema perde 1 segundo do controle.' },
          ],
          uniqueAttacks: [
            { key: 'last-mirror', name: 'Espelho do Predador', cooldownMs: 1800 },
          ],
          transitions: [],
        },
      ],
      drops: [
        { key: 'relic-fragment', nome: 'Fragmento de Relíquia', chance: 0.45 },
        { key: 'boss-token', nome: 'Selo da Sentinela', chance: 0.25 },
        { key: 'aura-stitch', nome: 'Costura de Aura (raro)', chance: 0.12 },
      ],
      transformations: [
        { key: 'phase2-shift', atPhase: 1, name: 'Split' },
        { key: 'phase3-shift', atPhase: 2, name: 'Monarca das Sombras' },
      ],
    },
  };

  // ---------------------------------------------------------------------------
  // Cutscenes / efeitos (callbacks)
  // ---------------------------------------------------------------------------
  const callbacks = {
    onCutscene: null, // ({text,key}) => void
    onMusicChange: null, // (musicId) => void
    onDrop: null, // (drop) => void
    onBossAction: null, // (attackKey) => void
    onBossAI: null, // (info) => void
  };

  function setCallbacks(next) {
    Object.assign(callbacks, next || {});
  }

  // ---------------------------------------------------------------------------
  // Controle por fases
  // ---------------------------------------------------------------------------
  function setBoss(bossId, { hp = 1000 } = {}) {
    const boss = BOSS_LIBRARY[bossId];
    if (!boss) throw new Error('Boss desconhecido: ' + bossId);

    state.bossId = bossId;
    state.phaseIndex = 0;
    state.maxHp = hp;
    state.hp = hp;
    state.enraged = false;
    state.memory = {
      ...defaultState.memory,
      bossCooldowns: {},
    };
    state.dropsUnlocked = [];

    save(state);

    // cutscene de intro
    const phase0 = boss.phases[0];
    if (phase0?.cutscenes?.length) {
      phase0.cutscenes.forEach(c => fireCutscene(c));
    }
    changeMusic(phase0?.music);

    return { ok: true, boss };
  }

  function changeMusic(musicId) {
    if (!musicId) return;
    if (callbacks.onMusicChange) callbacks.onMusicChange(musicId);
  }

  function fireCutscene(c) {
    if (!c) return;
    if (callbacks.onCutscene) callbacks.onCutscene({ text: c.text, key: c.key, bossId: state.bossId });
  }

  function fireBossAction(attackKey) {
    if (callbacks.onBossAction) callbacks.onBossAction({ attackKey, phaseIndex: state.phaseIndex });
  }

  function unlockDrops() {
    const boss = BOSS_LIBRARY[state.bossId];
    if (!boss) return [];

    const unlocked = [];
    for (const d of boss.drops) {
      if (state.dropsUnlocked.includes(d.key)) continue;
      if (Math.random() < d.chance) {
        unlocked.push(d);
        state.dropsUnlocked.push(d.key);
      }
    }

    save(state);
    for (const d of unlocked) {
      if (callbacks.onDrop) callbacks.onDrop(d);
    }

    return unlocked;
  }

  function currentBoss() {
    return BOSS_LIBRARY[state.bossId];
  }

  function phase() {
    const b = currentBoss();
    return b?.phases?.[state.phaseIndex] || null;
  }

  // ---------------------------------------------------------------------------
  // IA inteligente
  // ---------------------------------------------------------------------------
  function bossObservePlayerAction(action) {
    // action pode ser: 'dodge','parry','charged','aerial','qte-perfect', etc.
    state.memory.lastPlayerAction = action;

    if (action === 'perfect-dodge') state.memory.timesPerfectDodge += 1;
    if (action === 'perfect-block') state.memory.timesPerfectBlock += 1;

    // heurística de agressividade
    if (action === 'charged' || action === 'combo-aerial') state.memory.playerAggroScore += 2;
    if (action === 'turtle' || action === 'block' || action === 'dodge') state.memory.playerAggroScore -= 1;

    state.memory.playerAggroScore = clamp(state.memory.playerAggroScore, 0, 20);
    save(state);

    if (callbacks.onBossAI) callbacks.onBossAI({ observed: action, playerAggroScore: state.memory.playerAggroScore });
  }

  function clamp(x, a, b) {
    return Math.max(a, Math.min(b, x));
  }

  function isCooldownReady(key) {
    const cd = state.memory.bossCooldowns?.[key] || 0;
    return Date.now() >= cd;
  }

  function setCooldown(key, ms) {
    state.memory.bossCooldowns[key] = Date.now() + ms;
  }

  // Seleção de ataque com base na fase e na memória
  function chooseNextAttack() {
    const p = phase();
    if (!p) return null;

    const available = (p.uniqueAttacks || []).filter(a => isCooldownReady(a.key));
    if (available.length === 0) return null;

    // IA: se jogador está performando perfect, tenta mecânica de "ruptura".
    const wantsPerfectPunish = (state.memory.timesPerfectDodge + state.memory.timesPerfectBlock) >= 3;

    let weighted = [];
    for (const a of available) {
      let w = 1;
      if (wantsPerfectPunish && /vortex|perfect|breach|ruptura/i.test(a.key)) w += 2.5;
      if (state.memory.playerAggroScore >= 10 && /finisher|vortex/i.test(a.key)) w += 2.0;
      if (state.memory.playerAggroScore < 3 && /stalk|slash|ring/i.test(a.key)) w += 1.4;
      weighted.push({ a, w });
    }

    const total = weighted.reduce((s, x) => s + x.w, 0);
    let r = Math.random() * total;
    for (const x of weighted) {
      r -= x.w;
      if (r <= 0) return x.a;
    }
    return weighted[0].a;
  }

  // ---------------------------------------------------------------------------
  // Atualização do Boss (transição de fases, drops, etc)
  // ---------------------------------------------------------------------------
  function updateBoss({ damageTaken = 0 } = {}) {
    if (damageTaken > 0) {
      state.hp = clamp(state.hp - damageTaken, 0, state.maxHp);
      save(state);
    }

    const b = currentBoss();
    if (!b) return { ok: false, reason: 'no-boss' };

    const hpRatio = state.maxHp ? state.hp / state.maxHp : 0;
    const p = b.phases[state.phaseIndex];

    // transitions
    if (p?.transitions?.length) {
      for (const tr of p.transitions) {
        if (tr.trigger === 'hpBelow' && hpRatio <= tr.value) {
          return goToPhase(tr.toPhase);
        }
      }
    }

    // derrota final
    if (state.hp <= 0) {
      // cutscene final
      fireCutscene({ key: 'defeat', text: 'O Boss colapsa — a sombra se recolhe.' });
      changeMusic(null);
      unlockDrops();
      return { ok: true, defeated: true, dropsUnlocked: state.dropsUnlocked.slice() };
    }

    return { ok: true, phaseIndex: state.phaseIndex, hpRatio };
  }

  function goToPhase(nextIndex) {
    const b = currentBoss();
    if (!b) return { ok: false };
    if (nextIndex < 0 || nextIndex >= b.phases.length) return { ok: false, reason: 'phase-range' };

    state.phaseIndex = nextIndex;

    // transformação
    for (const tr of (b.transformations || [])) {
      if (tr.atPhase === nextIndex) {
        fireCutscene({ key: tr.key, text: `Transformação: ${tr.name}` });
      }
    }

    const p = b.phases[nextIndex];
    if (p?.cutscenes?.length) p.cutscenes.forEach(c => fireCutscene(c));

    changeMusic(p?.music);

    // mecânicas próprias: ajuste de agressividade/ enraged
    state.enraged = nextIndex >= 2;
    if (state.enraged) state.memory.playerAggroScore = clamp(state.memory.playerAggroScore + 3, 0, 20);

    save(state);

    return { ok: true, phaseIndex: state.phaseIndex, phaseName: p?.name };
  }

  // ---------------------------------------------------------------------------
  // Execução de uma ação do boss
  // ---------------------------------------------------------------------------
  function bossAct() {
    const attack = chooseNextAttack();
    if (!attack) {
      if (callbacks.onBossAI) callbacks.onBossAI({ decision: 'idle', phaseIndex: state.phaseIndex });
      return { ok: false, reason: 'no-attack' };
    }

    setCooldown(attack.key, attack.cooldownMs || 1000);
    fireBossAction(attack.key);

    return { ok: true, attackKey: attack.key, attackName: attack.name, phaseIndex: state.phaseIndex };
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------
  window.SL_BossEtapa10 = {
    state,
    setCallbacks,
    setBoss,
    bossObservePlayerAction,
    updateBoss,
    bossAct,
    currentBoss,
    unlockDrops,
    phase,
  };
})();

