(function () {
  'use strict';

  // ============================================================
  // MISSION MANAGER — fatia vertical de prova.
  //
  // Propositalmente contém UMA missão hardcoded, não um sistema de
  // definição de missões em dados externos. O objetivo aqui não é
  // "sistema de missões completo" — é provar que o event bus resolve o
  // problema (progresso atualiza sozinho, sem polling, sem gambiarra) antes
  // de generalizar pra N tipos de objetivo, pré-requisito, flag global etc.
  // Generalizar em cima disso sem essa prova seria construir os 6 sistemas
  // do documento em cima de uma suposição não testada.
  // ============================================================

  const LS_KEY = 'sl_missions_v1';

  const MISSION_DEF = {
    id: 'm-lobos-sombra',
    nome: 'Caçada aos Lobos',
    descricao: 'Derrote 5 Lobos das Sombras em qualquer combate.',
    objetivo: { tipo: 'kill', alvo: 'lobo-sombra', quantidade: 5 },
    recompensa: { xp: 100, coins: 200 },
  };

  const defaultState = {
    progresso: 0,
    concluida: false,
    recompensaRecebida: false,
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
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  }

  let state = load();

  // ------------------------------------------------------------
  // Escuta o evento real de combate. Isso é o núcleo da prova: nenhuma
  // dungeon, nenhuma tela de combate precisa saber que essa missão existe.
  // ------------------------------------------------------------
  function onEnemyDefeated(payload) {
    if (state.concluida) return;
    if (!payload || payload.id !== MISSION_DEF.objetivo.alvo) return;

    state.progresso = Math.min(MISSION_DEF.objetivo.quantidade, state.progresso + 1);
    if (state.progresso >= MISSION_DEF.objetivo.quantidade) {
      state.concluida = true;
    }
    save(state);
    notifyUI();
  }

  if (window.SL_EventBus) {
    window.SL_EventBus.on('enemy:defeated', onEnemyDefeated);
  }

  // ------------------------------------------------------------
  // Recompensa — mesma lógica de level-up de dungeon.js (grantBonus),
  // duplicada aqui de propósito: o projeto não tem um módulo compartilhado
  // pra "aplicar XP/coins ao personagem", cada arquivo já faz a própria
  // cópia (auth-player.js, dungeon.js). Seguindo a convenção existente em
  // vez de introduzir um refactor que ninguém pediu nesta tarefa.
  // ------------------------------------------------------------
  function claimReward() {
    if (!state.concluida) return { ok: false, reason: 'not-completed' };
    if (state.recompensaRecebida) return { ok: false, reason: 'already-claimed' };

    const LS = 'sl_auth_state_v1';
    try {
      const raw = localStorage.getItem(LS);
      if (!raw) return { ok: false, reason: 'no-character' };
      const auth = JSON.parse(raw);
      const ch = auth.character;
      if (!ch) return { ok: false, reason: 'no-character' };

      ch.xp = (ch.xp || 0) + MISSION_DEF.recompensa.xp;
      ch.coins = (ch.coins || 0) + MISSION_DEF.recompensa.coins;

      let leveled = false;
      while (ch.xp >= ch.xpMax) {
        ch.xp -= ch.xpMax;
        ch.level = (ch.level || 1) + 1;
        ch.xpMax = Math.floor(100 + Math.pow(ch.level, 1.45) * 25);
        ch.hpMax = Math.round((ch.hpMax || 120) * 1.08);
        ch.hp = ch.hpMax;
        ch.manaMax = Math.round((ch.manaMax || 100) * 1.06);
        ch.mana = ch.manaMax;
        leveled = true;
      }
      const lv = ch.level || 1;
      ch.rank = lv >= 100 ? 'S' : lv >= 80 ? 'A' : lv >= 60 ? 'B' : lv >= 40 ? 'C' : lv >= 20 ? 'D' : 'E';

      localStorage.setItem(LS, JSON.stringify(auth));
      if (window.AuthPlayer) window.AuthPlayer.renderPlayerHUD();
      if (window.SL_HomeView) window.SL_HomeView.render();

      state.recompensaRecebida = true;
      save(state);
      notifyUI();

      return { ok: true, leveled, level: ch.level };
    } catch (e) {
      console.warn('[MissionManager] claimReward error', e);
      return { ok: false, reason: 'error' };
    }
  }

  // ------------------------------------------------------------
  // UI hook — pra quem renderiza a view de missões saber quando redesenhar
  // sem precisar dar polling no state.
  // ------------------------------------------------------------
  let uiListener = null;
  function onUIUpdate(fn) {
    uiListener = typeof fn === 'function' ? fn : null;
  }
  function notifyUI() {
    if (uiListener) uiListener(getMissionView());
  }

  function getMissionView() {
    return {
      ...MISSION_DEF,
      progresso: state.progresso,
      concluida: state.concluida,
      recompensaRecebida: state.recompensaRecebida,
    };
  }

  window.SL_MissionManager = { getMissionView, claimReward, onUIUpdate };
})();