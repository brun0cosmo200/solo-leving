(function () {
  'use strict';

  // ============================================================
  // DUNGEONS
  // ============================================================
  const DUNGEONS = {
    'fenda-sussurro': {
      id:    'fenda-sussurro',
      nome:  'Fenda do Sussurro Violeta',
      icon:  '🌀',
      rank:  'E',
      desc:  'Portal instável em Seul. Recomendado para iniciantes.',
      lore:  'O ar aqui cheira a promessas quebradas.',
      rooms: [
        { enemy: 'goblin-feral',   label: 'Sala 1 — Entrada'         },
        { enemy: 'lobo-sombra',    label: 'Sala 2 — Passagem Sombria' },
        { enemy: 'boss-sentinela', label: 'Sala Final — Sentinela',  isBoss: true },
      ],
      xpBonus:    120,
      coinBonus:  200,
    },

    'arco-martelo': {
      id:    'arco-martelo',
      nome:  'Arco do Martelo Calmo',
      icon:  '⚒️',
      rank:  'D',
      desc:  'Forja abandonada no Círculo de Cinza. Inimigos mais resistentes.',
      lore:  'Cada batida do martelo ainda ecoa nas paredes.',
      rooms: [
        { enemy: 'lobo-sombra',    label: 'Sala 1 — Forja'           },
        { enemy: 'guardiao-fenda', label: 'Sala 2 — Câmara do Cinzel' },
        { enemy: 'boss-sentinela', label: 'Sala Final — Sentinela',   isBoss: true },
      ],
      xpBonus:    200,
      coinBonus:  380,
    },

    'vazio-ancestral': {
      id:    'vazio-ancestral',
      nome:  'Domínio do Vazio Ancestral',
      icon:  '🕳️',
      rank:  'C',
      desc:  'Onde o mapa não aponta direção. Só os fortes retornam.',
      lore:  'Quem tenta atravessar volta com memórias que não são suas.',
      rooms: [
        { enemy: 'guardiao-fenda', label: 'Sala 1 — Limiar'           },
        { enemy: 'guardiao-fenda', label: 'Sala 2 — Abismo Menor'     },
        { enemy: 'lobo-sombra',    label: 'Sala 3 — Corredor do Eco'  },
        { enemy: 'boss-sentinela', label: 'Sala Final — Monarca',     isBoss: true },
      ],
      xpBonus:    380,
      coinBonus:  650,
    },
  };

  // ============================================================
  // ESTADO
  // ============================================================
  const state = {
    active:       false,
    def:          null,
    roomIndex:    0,
    totalRooms:   0,
    accXp:        0,   // XP acumulado nas salas (sem bônus)
    accCoins:     0,
  };

  // ============================================================
  // DOM HELPERS
  // ============================================================
  function el(id)         { return document.getElementById(id); }
  function setText(id, v) { const e = el(id); if (e) e.textContent = String(v); }

  function toast(msg) {
    // Reusa toast do AuthPlayer se existir; senão cria próprio
    const container = el('toasts') || (() => {
      const c = document.createElement('div');
      c.id = 'toasts';
      document.body.appendChild(c);
      return c;
    })();
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    container.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 260); }, 2200);
  }

  // ============================================================
  // RANK GATE
  // ============================================================
  const RANK_ORDER = ['E', 'D', 'C', 'B', 'A', 'S'];

  function getPlayerCharacter() {
    try {
      const raw = localStorage.getItem('sl_auth_state_v1');
      const parsed = raw && JSON.parse(raw);
      return (parsed && parsed.character) || null;
    } catch {
      return null;
    }
  }

  function canEnter(dungeonRank) {
    const ch = getPlayerCharacter();
    const playerRank = (ch && ch.rank) || 'E';
    const pIdx = RANK_ORDER.indexOf(playerRank);
    const dIdx = RANK_ORDER.indexOf(dungeonRank);
    if (pIdx === -1 || dIdx === -1) return true; // rank desconhecido: não trava por erro de dado
    return pIdx >= dIdx;
  }

  // ============================================================
  // OVERLAYS (injetados dinamicamente)
  // ============================================================

  // — Intro (antes da primeira sala) —
  function injectIntroOverlay() {
    if (el('dungeon-intro-overlay')) return;
    const div = document.createElement('div');
    div.id = 'dungeon-intro-overlay';
    div.style.cssText = `
      position:fixed;inset:0;z-index:700;
      background:rgba(6,5,10,.96);backdrop-filter:blur(10px);
      display:none;flex-direction:column;align-items:center;justify-content:center;
      gap:20px;text-align:center;padding:32px;
    `;
    div.innerHTML = `
      <div id="di-icon"   style="font-size:4.5rem;"></div>
      <div id="di-rank"   class="tag tag--crimson" style="display:inline-block;"></div>
      <div id="di-nome"   style="font-family:var(--font-display);font-size:1.9rem;letter-spacing:.06em;"></div>
      <div id="di-lore"   style="font-family:var(--font-heading);font-size:.9rem;color:var(--c-text-dim);max-width:320px;line-height:1.8;"></div>
      <div id="di-rooms"  style="font-family:var(--font-heading);font-size:.8rem;color:var(--c-text-faint);"></div>
      <button class="btn btn--primary" onclick="window.SL_DungeonUI._confirmStart()">
        Entrar na Dungeon
      </button>
      <button class="btn btn--sm" onclick="window.SL_DungeonUI._cancelIntro()" style="opacity:.55;">
        Cancelar
      </button>
    `;
    document.body.appendChild(div);
  }

  function showIntro(def) {
    injectIntroOverlay();
    setText('di-icon',  def.icon);
    setText('di-rank',  'Rank ' + def.rank);
    setText('di-nome',  def.nome);
    setText('di-lore',  def.lore);
    setText('di-rooms', def.rooms.length + ' sala' + (def.rooms.length > 1 ? 's' : '') +
      ' · Bônus: +' + def.xpBonus + ' XP  +' + def.coinBonus + ' 🪙');
    el('dungeon-intro-overlay').style.display = 'flex';
  }

  function hideIntro() {
    const o = el('dungeon-intro-overlay');
    if (o) o.style.display = 'none';
  }

  // — Transição entre salas —
  function injectTransitionOverlay() {
    if (el('dungeon-transition-overlay')) return;
    const div = document.createElement('div');
    div.id = 'dungeon-transition-overlay';
    div.style.cssText = `
      position:fixed;inset:0;z-index:650;
      background:rgba(6,5,10,.92);backdrop-filter:blur(8px);
      display:none;flex-direction:column;align-items:center;justify-content:center;
      gap:16px;text-align:center;padding:32px;
      transition:opacity 300ms ease;
    `;
    div.innerHTML = `
      <div id="dtr-icon"   style="font-size:3rem;"></div>
      <div id="dtr-label"  style="font-family:var(--font-heading);font-size:1.1rem;color:var(--c-violet-core);"></div>
      <div id="dtr-sub"    style="font-family:var(--font-heading);font-size:.8rem;color:var(--c-text-faint);"></div>
      <!-- barra de progresso das salas -->
      <div style="display:flex;gap:8px;margin-top:8px;" id="dtr-progress"></div>
    `;
    document.body.appendChild(div);
  }

  function showTransition(roomIndex, def, afterMs, cb) {
    injectTransitionOverlay();
    const overlay = el('dungeon-transition-overlay');
    const room    = def.rooms[roomIndex];

    setText('dtr-icon',  room.isBoss ? '💀' : '⚔️');
    setText('dtr-label', room.label);
    setText('dtr-sub',   `${roomIndex + 1} / ${def.rooms.length} — ${def.nome}`);

    // Dots de progresso
    const prog = el('dtr-progress');
    if (prog) {
      prog.innerHTML = def.rooms.map((r, i) => {
        const done    = i < roomIndex;
        const current = i === roomIndex;
        return `<div style="
          width:28px;height:6px;border-radius:3px;
          background:${done ? 'var(--c-gold-core)' : current ? 'var(--c-violet-core)' : 'rgba(255,255,255,.12)'};
          transition:background .3s;
        "></div>`;
      }).join('');
    }

    overlay.style.opacity = '0';
    overlay.style.display = 'flex';
    requestAnimationFrame(() => { overlay.style.opacity = '1'; });

    setTimeout(() => {
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.style.display = 'none';
        if (typeof cb === 'function') cb();
      }, 310);
    }, afterMs);
  }

  // — Completo —
  function injectCompleteOverlay() {
    if (el('dungeon-complete-overlay')) return;
    const div = document.createElement('div');
    div.id = 'dungeon-complete-overlay';
    div.style.cssText = `
      position:fixed;inset:0;z-index:700;
      background:rgba(6,5,10,.96);backdrop-filter:blur(10px);
      display:none;flex-direction:column;align-items:center;justify-content:center;
      gap:20px;text-align:center;padding:32px;
    `;
    div.innerHTML = `
      <div style="font-size:4rem;">🏰</div>
      <div style="font-family:var(--font-display);font-size:2rem;color:var(--c-gold-core);letter-spacing:.06em;">DUNGEON CONCLUÍDA</div>
      <div id="dc-nome"     style="font-family:var(--font-heading);font-size:1rem;color:var(--c-violet-core);"></div>
      <div id="dc-rewards"  style="
        font-family:var(--font-heading);font-size:.9rem;
        color:var(--c-text-dim);line-height:2.2;white-space:pre-line;
      "></div>
      <button class="btn btn--legendary" onclick="window.SL_DungeonUI._closeComplete()">
        Sair da Dungeon
      </button>
    `;
    document.body.appendChild(div);
  }

  function showComplete(def, bonusResult) {
    injectCompleteOverlay();
    setText('dc-nome', def.nome);

    let body = `Salas concluídas: ${def.rooms.length}\n\n`;
    body    += `Bônus de conclusão:\n`;
    body    += `+${def.xpBonus} XP  ·  +${def.coinBonus} 🪙`;
    if (bonusResult && bonusResult.leveled) {
      body += `\n\n🆙 LEVEL UP! → Lv. ${bonusResult.level}  [${bonusResult.rank}]`;
    }
    setText('dc-rewards', body);

    el('dungeon-complete-overlay').style.display = 'flex';

    const fx = window.SL_EffectsEtapa11;
    if (fx) {
      fx.explosion({ x: 50, y: 40 });
      setTimeout(() => fx.brilho({ x: 50, y: 40 }), 220);
      setTimeout(() => fx.portal({ x: 50, y: 50 }), 450);
    }
  }

  // — HUD de contexto no combat UI —
  function updateCombatContext() {
    if (!state.def) return;
    const room = state.def.rooms[state.roomIndex];
    if (!room) return;
    if (window.SL_CombatUI && window.SL_CombatUI.setDungeonContext) {
      window.SL_CombatUI.setDungeonContext({
        dungeonNome: state.def.nome,
        roomLabel:   room.label,
        roomNum:     state.roomIndex + 1,
        totalRooms:  state.totalRooms,
        isBoss:      !!room.isBoss,
      });
    }
  }

  // ============================================================
  // RECOMPENSAS
  // ============================================================
  function grantBonus(def) {
    const LS = 'sl_auth_state_v1';
    try {
      const raw = localStorage.getItem(LS);
      if (!raw) return {};
      const auth = JSON.parse(raw);
      const ch   = auth.character;
      if (!ch) return {};

      ch.xp    = (ch.xp    || 0) + def.xpBonus;
      ch.coins = (ch.coins || 0) + def.coinBonus;

      let leveled = false;
      while (ch.xp >= ch.xpMax) {
        ch.xp   -= ch.xpMax;
        ch.level = (ch.level || 1) + 1;
        ch.xpMax = Math.floor(100 + Math.pow(ch.level, 1.45) * 25);
        ch.hpMax   = Math.round((ch.hpMax   || 120) * 1.08);
        ch.hp      = ch.hpMax;
        ch.manaMax = Math.round((ch.manaMax  || 100) * 1.06);
        ch.mana    = ch.manaMax;
        leveled    = true;
      }

      const lv = ch.level || 1;
      ch.rank  = lv >= 100 ? 'S' : lv >= 80 ? 'A' : lv >= 60 ? 'B' : lv >= 40 ? 'C' : lv >= 20 ? 'D' : 'E';

      localStorage.setItem(LS, JSON.stringify(auth));
      if (window.AuthPlayer) window.AuthPlayer.renderPlayerHUD();

      return { leveled, level: ch.level, rank: ch.rank };
    } catch (e) {
      console.warn('[DungeonUI] grantBonus error', e);
      return {};
    }
  }

  // ============================================================
  // FLUXO PRINCIPAL
  // ============================================================
  function startDungeon(dungeonId) {
    const def = DUNGEONS[dungeonId];
    if (!def) { console.warn('[DungeonUI] dungeon not found:', dungeonId); return; }

    if (!canEnter(def.rank)) {
      const ch = getPlayerCharacter();
      const playerRank = (ch && ch.rank) || 'E';
      toast(`🔒 Requer Rank ${def.rank} — você é Rank ${playerRank}.`);
      return;
    }

    // Reseta estado
    state.active      = true;
    state.def         = def;
    state.roomIndex   = 0;
    state.totalRooms  = def.rooms.length;
    state.accXp       = 0;
    state.accCoins    = 0;

    showIntro(def);
  }

  // Chamado pelo botão "Entrar na Dungeon"
  function _confirmStart() {
    hideIntro();
    _startNextRoom();
  }

  function _cancelIntro() {
    hideIntro();
    state.active = false;
    state.def    = null;
  }

  function _startNextRoom() {
    if (!state.active || !state.def) return;

    if (state.roomIndex >= state.def.rooms.length) {
      _completeDungeon();
      return;
    }

    showTransition(state.roomIndex, state.def, 1800, () => {
      updateCombatContext();
      _launchRoomCombat();
    });
  }

  function _launchRoomCombat() {
    const combatUI = window.SL_CombatUI;
    if (!combatUI) {
      console.warn('[DungeonUI] SL_CombatUI não encontrado.');
      return;
    }

    const room = state.def.rooms[state.roomIndex];

    // Registra callback pra quando o jogador vencer esta sala
    combatUI.setOnVictory((rewards) => {
      state.accXp    += (rewards && rewards.xp)    || 0;
      state.accCoins += (rewards && rewards.coins) || 0;
      state.roomIndex++;

      // Pequena pausa antes de avançar
      setTimeout(_startNextRoom, 700);
    });

    combatUI.setOnDefeat(() => {
      // Dungeon falhou — limpa tudo
      state.active = false;
      if (combatUI.setOnVictory) combatUI.setOnVictory(null);
      if (combatUI.setOnDefeat)  combatUI.setOnDefeat(null);
      if (combatUI.setDungeonContext) combatUI.setDungeonContext(null);
      toast('💀 Dungeon encerrada — você foi derrotado.');
    });

    combatUI.startFight(room.enemy);
  }

  function _completeDungeon() {
    state.active = false;

    const combatUI = window.SL_CombatUI;
    if (combatUI) {
      if (combatUI.setOnVictory)     combatUI.setOnVictory(null);
      if (combatUI.setOnDefeat)      combatUI.setOnDefeat(null);
      if (combatUI.setDungeonContext) combatUI.setDungeonContext(null);
    }

    const bonusResult = grantBonus(state.def);

    if (window.SL_EventBus) {
      window.SL_EventBus.emit('dungeon:completed', { id: state.def.id, rank: state.def.rank });
    }

    showComplete(state.def, bonusResult);
  }

  function _closeComplete() {
    const o = el('dungeon-complete-overlay');
    if (o) o.style.display = 'none';
    if (typeof window.navigate === 'function') window.navigate('mapa');
  }

  function enterBestAvailable() {
    const unlocked = Object.values(DUNGEONS).filter((def) => canEnter(def.rank));
    if (unlocked.length === 0) {
      toast('Nenhuma dungeon disponível no seu rank ainda.');
      return;
    }
    // Maior rank primeiro (RANK_ORDER é crescente em dificuldade)
    unlocked.sort((a, b) => RANK_ORDER.indexOf(b.rank) - RANK_ORDER.indexOf(a.rank));
    startDungeon(unlocked[0].id);
  }

  // ============================================================
  // RENDER DA LISTA NO MAPA (view-mapa)
  // ============================================================
  function rankBadgeClass(rank) {
    const map = { E: 'rank-badge--e', D: 'rank-badge--d', C: 'rank-badge--c', B: 'rank-badge--b', A: 'rank-badge--a', S: 'rank-badge--s' };
    return map[rank] || 'rank-badge--e';
  }

  function renderMapaDungeonList() {
    const container = el('mapa-dungeon-list');
    if (!container) return;

    const ch = getPlayerCharacter();
    const playerRank = (ch && ch.rank) || 'E';

    container.innerHTML = Object.values(DUNGEONS).map((def) => {
      const unlocked = canEnter(def.rank);
      return `
        <div class="mission-item" style="${unlocked ? '' : 'opacity:.45;'}cursor:pointer;" onclick="window.SL_DungeonUI.startDungeon('${def.id}')">
          <div class="mission-item__icon">${def.icon}</div>
          <div class="mission-item__info">
            <div class="mission-item__name">${def.nome}</div>
            <div class="mission-item__desc">${def.rooms.length} sala${def.rooms.length > 1 ? 's' : ''}${unlocked ? '' : ' · 🔒 requer Rank ' + def.rank}</div>
          </div>
          <div class="rank-badge ${rankBadgeClass(def.rank)}">${def.rank}</div>
        </div>`;
    }).join('') || '<div class="fs-xs text-faint" style="padding:var(--sp-4);">Nenhuma dungeon disponível.</div>';
  }

  function patchNavigateForMapa() {
    const orig = window.navigate;
    if (typeof orig !== 'function') return false;
    if (orig.__slDungeonMapPatched) return true;
    const patched = function (page) {
      orig(page);
      if (page === 'mapa') setTimeout(renderMapaDungeonList, 30);
    };
    patched.__slDungeonMapPatched = true;
    window.navigate = patched;
    return true;
  }

  // ============================================================
  // BOOT — injeta overlays ao carregar
  // ============================================================
  document.addEventListener('DOMContentLoaded', () => {
    injectIntroOverlay();
    injectTransitionOverlay();
    injectCompleteOverlay();
    if (!patchNavigateForMapa()) setTimeout(patchNavigateForMapa, 400);
    setTimeout(renderMapaDungeonList, 300);
  });

  // ============================================================
  // API PÚBLICA
  // ============================================================
  window.SL_DungeonUI = {
    DUNGEONS,
    startDungeon,
    canEnter,
    enterBestAvailable,
    getPlayerCharacter,
    RANK_ORDER,
    // internos chamados pelos botões dos overlays
    _confirmStart,
    _cancelIntro,
    _closeComplete,
  };
})();