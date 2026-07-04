(function () {
  'use strict';

  // ============================================================
  // INIMIGOS
  // ============================================================
  const ENEMIES = {
    'lobo-sombra': {
      id: 'lobo-sombra', nome: 'Lobo das Sombras', icon: '🐺', rank: 'E',
      hp: 160, attackDamage: 10, attackIntervalMs: 3000, element: 'sombra',
      xpReward: 45, coinReward: 80,
      dropTable: [
        { nome: 'Garras Corrompidas', chance: 0.40 },
        { nome: 'Essência de Sombra',  chance: 0.18 },
      ],
    },
    'goblin-feral': {
      id: 'goblin-feral', nome: 'Goblin Feroz', icon: '👺', rank: 'E',
      hp: 110, attackDamage: 8, attackIntervalMs: 2400, element: 'fogo',
      xpReward: 30, coinReward: 50,
      dropTable: [{ nome: 'Faca Enferrujada', chance: 0.35 }],
    },
    'guardiao-fenda': {
      id: 'guardiao-fenda', nome: 'Guardião da Fenda', icon: '🗿', rank: 'D',
      hp: 380, attackDamage: 18, attackIntervalMs: 2800, element: 'eletricidade',
      xpReward: 110, coinReward: 190,
      dropTable: [
        { nome: 'Núcleo de Pedra Sombria', chance: 0.30 },
        { nome: 'Cristal de Fenda',        chance: 0.12 },
      ],
    },
    'boss-sentinela': {
      id: 'boss-sentinela', nome: 'Sentinela das Sombras', icon: '💀', rank: 'C',
      hp: 1000, attackDamage: 26, attackIntervalMs: 2200, element: 'sombra',
      xpReward: 320, coinReward: 500, isBoss: true, bossId: 'boss-shadow-warden',
      dropTable: [
        { nome: 'Fragmento de Relíquia', chance: 0.45 },
        { nome: 'Selo da Sentinela',     chance: 0.25 },
        { nome: 'Costura de Aura (raro)', chance: 0.12 },
      ],
    },
  };

  // ============================================================
  // CALLBACKS DE DUNGEON
  // ============================================================
  let _onVictory      = null; // (rewards) => void
  let _onDefeat       = null; // () => void
  let _dungeonContext = null; // { dungeonNome, roomLabel, roomNum, totalRooms, isBoss }

  // ============================================================
  // ESTADO INTERNO
  // ============================================================
  const combat = {
    active: false,
    enemy: null,
    enemyHp: 0,
    enemyMaxHp: 0,
    incomingAttack: false,
    attackInterval: null,
    qteStart: 0,
    qteTimeout: null,
    qteVisualMs: 1400,
  };

  // ============================================================
  // DOM / UTIL
  // ============================================================
  function el(id)        { return document.getElementById(id); }
  function setText(id,v) { const e = el(id); if (e) e.textContent = String(v); }
  function setPct(id,p)  { const e = el(id); if (e) e.style.width = Math.max(0,Math.min(100,p))+'%'; }
  function fx()          { return window.SL_EffectsEtapa11 || null; }
  function c9()          { return window.SL_CombatEtapa9   || null; }

  function toast(msg) {
    const c = el('toasts'); if (!c) return;
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    c.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(()=>t.remove(),260); }, 1800);
  }

  // ============================================================
  // INJEÇÃO DE HTML
  // ============================================================
  function inject() {
    if (el('view-combate')) return;

    const html = `
<section class="view" id="view-combate">
<div style="max-width:660px;margin:0 auto;padding-bottom:var(--sp-8);">

  <!-- Contexto de dungeon (oculto fora de dungeon) -->
  <div id="ci-dungeon-ctx" style="display:none;margin-bottom:var(--sp-3);">
    <div style="
      background:rgba(179,65,255,.10);border:1px solid rgba(179,65,255,.25);
      padding:var(--sp-2) var(--sp-4);display:flex;align-items:center;justify-content:space-between;
      font-family:var(--font-heading);font-size:var(--fs-xs);
    ">
      <span id="ci-ctx-dungeon" style="color:var(--c-violet-core);"></span>
      <span id="ci-ctx-room"    style="color:var(--c-text-faint);"></span>
    </div>
    <!-- Dots de sala -->
    <div id="ci-ctx-dots" style="display:flex;gap:6px;padding:var(--sp-2) var(--sp-4) 0;"></div>
  </div>

  <!-- Painel do inimigo -->
  <div class="panel panel--crimson mb4">
    <div class="panel__hdr">
      <span id="ci-enemy-name">—</span>
      <div style="display:flex;gap:8px;align-items:center;">
        <span id="ci-phase-badge" class="tag tag--crimson" style="display:none;"></span>
        <div class="panel__dot"></div>
      </div>
    </div>
    <div class="panel__body">
      <div style="text-align:center;font-size:5rem;margin-bottom:var(--sp-3);position:relative;">
        <span id="ci-enemy-icon">💀</span>
        <div id="ci-hit-flash" style="position:absolute;inset:0;border-radius:50%;background:rgba(255,43,78,0);transition:background 80ms;pointer-events:none;"></div>
      </div>
      <div class="stat-bar mb4">
        <div class="stat-bar__label">
          <span class="text-faint fs-xs uppercase">Vida</span>
          <span id="ci-enemy-hp-txt" class="font-display fs-xs text-crimson">—</span>
        </div>
        <div class="stat-bar__track">
          <div class="stat-bar__fill stat-bar--hp" id="ci-enemy-hp-fill" style="width:100%;transition:width 200ms ease-out;"></div>
        </div>
      </div>
      <div id="ci-log" style="
        height:80px;overflow:hidden;display:flex;flex-direction:column-reverse;gap:2px;
        font-family:var(--font-heading);font-size:var(--fs-xs);color:var(--c-text-faint);
        padding:var(--sp-2);background:rgba(0,0,0,.28);
        border:1px solid rgba(255,255,255,.04);
      "></div>
    </div>
  </div>

  <!-- QTE -->
  <div id="ci-qte" style="display:none;margin-bottom:var(--sp-4);">
    <div style="
      background:rgba(255,43,78,.14);border:1px solid var(--c-crimson-core);
      padding:var(--sp-3) var(--sp-4);display:flex;align-items:center;gap:var(--sp-4);
    ">
      <span style="font-family:var(--font-heading);font-size:var(--fs-sm);color:var(--c-crimson-core);white-space:nowrap;">⚠️ ATAQUE!</span>
      <div style="flex:1;height:10px;background:rgba(255,255,255,.06);position:relative;overflow:hidden;">
        <div style="position:absolute;top:0;left:0;width:28%;height:100%;background:rgba(47,216,255,.30);"></div>
        <div id="ci-qte-bar" style="position:absolute;top:0;right:0;height:100%;width:100%;background:linear-gradient(90deg,var(--c-gold-core),var(--c-crimson-core));"></div>
      </div>
      <span style="font-family:var(--font-heading);font-size:var(--fs-xs);color:var(--c-text-faint);white-space:nowrap;">Esquiva / Parry</span>
    </div>
  </div>

  <!-- HUD do jogador -->
  <div class="panel mb4">
    <div class="panel__body" style="padding:var(--sp-3) var(--sp-4);">
      <div class="stat-bar mb2">
        <div class="stat-bar__label">
          <span class="text-faint fs-xs">HP</span>
          <span id="ci-player-hp-txt" class="font-display fs-xs text-crimson">—</span>
        </div>
        <div class="stat-bar__track"><div class="stat-bar__fill stat-bar--hp" id="ci-player-hp-fill" style="width:100%;transition:width 200ms ease-out;"></div></div>
      </div>
      <div class="stat-bar mb2">
        <div class="stat-bar__label">
          <span class="text-faint fs-xs">MP</span>
          <span id="ci-player-mp-txt" class="font-display fs-xs text-azure">—</span>
        </div>
        <div class="stat-bar__track"><div class="stat-bar__fill stat-bar--mp" id="ci-player-mp-fill" style="width:100%;transition:width 200ms ease-out;"></div></div>
      </div>
      <div class="stat-bar">
        <div class="stat-bar__label">
          <span class="text-faint fs-xs">Stamina</span>
          <span id="ci-player-st-txt" class="font-display fs-xs text-gold">—</span>
        </div>
        <div class="stat-bar__track"><div class="stat-bar__fill" id="ci-player-st-fill" style="width:100%;background:linear-gradient(90deg,var(--c-gold-deep),var(--c-gold-core));transition:width 200ms ease-out;"></div></div>
      </div>
    </div>
  </div>

  <!-- Ações -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3);margin-bottom:var(--sp-3);">
    <button class="btn btn--primary" id="ci-btn-quick"   onclick="SL_CombatUI.doQuickAttack()">
      ⚡ Ataque Rápido<br><span style="font-size:.65rem;opacity:.55;">4 Stamina · Combo</span>
    </button>
    <button class="btn btn--skill"   id="ci-btn-charged" onclick="SL_CombatUI.doChargedAttack()">
      💥 Carregado<br><span style="font-size:.65rem;opacity:.55;">12 Stamina · Dano maior</span>
    </button>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3);margin-bottom:var(--sp-3);">
    <button class="btn" id="ci-btn-dodge" onclick="SL_CombatUI.doDefense('dodge')"
      style="border-color:var(--c-azure-core);color:var(--c-azure-core);">
      🌀 Esquivar<br><span style="font-size:.65rem;opacity:.55;">Zona azul = perfeito</span>
    </button>
    <button class="btn" id="ci-btn-parry" onclick="SL_CombatUI.doDefense('parry')"
      style="border-color:var(--c-gold-core);color:var(--c-gold-core);">
      🛡️ Parry<br><span style="font-size:.65rem;opacity:.55;">Clique no ataque!</span>
    </button>
  </div>

  <!-- Consumíveis -->
  <div id="ci-consumables-row" style="display:none;margin-bottom:var(--sp-3);">
    <div style="font-family:var(--font-heading);font-size:var(--fs-xs);color:var(--c-text-faint);margin-bottom:var(--sp-2);">Itens</div>
    <div id="ci-consumables" style="display:flex;gap:var(--sp-2);flex-wrap:wrap;"></div>
  </div>

  <div style="text-align:center;">
    <button class="btn btn--danger btn--sm" onclick="SL_CombatUI.flee()">Fugir da batalha</button>
  </div>

</div>

<!-- Overlay de resultado (só aparece fora de dungeon) -->
<div id="ci-result" style="
  display:none;position:fixed;inset:0;z-index:500;
  background:rgba(6,5,10,.93);backdrop-filter:blur(8px);
  flex-direction:column;align-items:center;justify-content:center;
  gap:var(--sp-5);text-align:center;padding:var(--sp-6);
">
  <div id="ci-result-icon"  style="font-size:5rem;"></div>
  <div id="ci-result-title" style="font-family:var(--font-display);font-size:var(--fs-xl);letter-spacing:.06em;"></div>
  <div id="ci-result-body"  style="font-family:var(--font-heading);font-size:var(--fs-sm);color:var(--c-text-dim);max-width:340px;line-height:1.9;white-space:pre-line;"></div>
  <button class="btn btn--primary" onclick="SL_CombatUI.closeResult()">Continuar</button>
</div>
</section>`;

    const main = document.querySelector('#app-root .app-main');
    if (main) main.insertAdjacentHTML('beforeend', html);
  }

  // ============================================================
  // LOG
  // ============================================================
  function log(msg, color) {
    const box = el('ci-log'); if (!box) return;
    const line = document.createElement('div');
    line.style.color = color || 'var(--c-text-faint)';
    line.textContent = msg;
    box.insertBefore(line, box.firstChild);
    while (box.children.length > 7) box.removeChild(box.lastChild);
  }

  // ============================================================
  // HUD
  // ============================================================
  function refreshPlayerHUD() {
    const s = c9() && c9().state; if (!s) return;
    const hpPct = s.maxHp      ? (s.hp      / s.maxHp)      * 100 : 0;
    const mpPct = s.maxMp      ? (s.mp      / s.maxMp)      * 100 : 0;
    const stPct = s.maxStamina ? (s.stamina / s.maxStamina) * 100 : 0;
    setText('ci-player-hp-txt', `${Math.max(0,s.hp)} / ${s.maxHp}`);
    setText('ci-player-mp-txt', `${Math.max(0,s.mp)} / ${s.maxMp}`);
    setText('ci-player-st-txt', `${Math.round(Math.max(0,s.stamina))} / ${s.maxStamina}`);
    setPct('ci-player-hp-fill', hpPct);
    setPct('ci-player-mp-fill', mpPct);
    setPct('ci-player-st-fill', stPct);
  }

  function refreshEnemyHUD() {
    const pct = combat.enemyMaxHp ? (combat.enemyHp / combat.enemyMaxHp) * 100 : 0;
    setText('ci-enemy-hp-txt', `${Math.max(0,combat.enemyHp)} / ${combat.enemyMaxHp}`);
    setPct('ci-enemy-hp-fill', pct);
  }

  function refreshDungeonCtx() {
    const ctx     = _dungeonContext;
    const ctxEl   = el('ci-dungeon-ctx');
    if (!ctxEl) return;

    if (!ctx) { ctxEl.style.display = 'none'; return; }

    ctxEl.style.display = 'block';
    setText('ci-ctx-dungeon', ctx.dungeonNome);
    setText('ci-ctx-room',    `Sala ${ctx.roomNum} / ${ctx.totalRooms}`);

    const dots = el('ci-ctx-dots');
    if (dots) {
      dots.innerHTML = Array.from({ length: ctx.totalRooms }, (_, i) => {
        const done    = i < ctx.roomNum - 1;
        const current = i === ctx.roomNum - 1;
        return `<div style="
          width:26px;height:5px;border-radius:3px;
          background:${done ? 'var(--c-gold-core)' : current ? 'var(--c-violet-core)' : 'rgba(255,255,255,.10)'};
        "></div>`;
      }).join('');
    }
  }

  function refreshConsumables() {
    const row  = el('ci-consumables-row');
    const box  = el('ci-consumables');
    if (!box || !row) return;

    const shop = window.SL_ShopUI;
    if (!shop) { row.style.display = 'none'; return; }

    const inv = shop.loadConsumables();
    const items = shop.SHOP_ITEMS.filter(i => (inv[i.id] || 0) > 0);

    if (!items.length) { row.style.display = 'none'; return; }

    row.style.display = 'block';
    box.innerHTML = items.map(item => `
      <button class="btn btn--sm" onclick="SL_CombatUI.useConsumable('${item.id}')"
        style="font-family:var(--font-heading);font-size:var(--fs-xs);gap:4px;">
        ${item.icon} ${item.nome}
        <span style="opacity:.5;">(${inv[item.id]})</span>
      </button>
    `).join('');
  }

  function flashEnemyHit() {
    const f = el('ci-hit-flash'); if (!f) return;
    f.style.background = 'rgba(255,43,78,.55)';
    setTimeout(() => { f.style.background = 'rgba(255,43,78,0)'; }, 110);
  }

  // ============================================================
  // STAMINA REGEN
  // ============================================================
  let _staminaRegen = null;

  function startStaminaRegen() {
    clearInterval(_staminaRegen);
    _staminaRegen = setInterval(() => {
      if (!combat.active) { clearInterval(_staminaRegen); return; }
      const s = c9() && c9().state; if (!s) return;
      if (s.stamina < s.maxStamina) {
        s.stamina = Math.min(s.maxStamina, s.stamina + 8);
        refreshPlayerHUD();
      }
    }, 800);
  }

  // ============================================================
  // QTE
  // ============================================================
  function showQTE() {
    combat.incomingAttack = true;
    combat.qteStart       = Date.now();
    const qteEl = el('ci-qte');
    const bar   = el('ci-qte-bar');
    if (qteEl) qteEl.style.display = 'block';
    if (bar) {
      bar.style.transition = 'none';
      bar.style.width = '100%';
      requestAnimationFrame(() => {
        bar.style.transition = `width ${combat.qteVisualMs}ms linear`;
        bar.style.width = '0%';
      });
    }
    combat.qteTimeout = setTimeout(() => {
      if (combat.incomingAttack) resolveIncoming(null);
    }, combat.qteVisualMs);
  }

  function hideQTE() {
    const qteEl = el('ci-qte');
    if (qteEl) qteEl.style.display = 'none';
    combat.incomingAttack = false;
    if (combat.qteTimeout) { clearTimeout(combat.qteTimeout); combat.qteTimeout = null; }
  }

  function scaleQteDelta(elapsed) {
    return Math.round((elapsed / combat.qteVisualMs) * 240);
  }

  function resolveIncoming(defenseType) {
    hideQTE();
    if (!combat.active) return;

    const enemy  = combat.enemy;
    const engine = c9();
    const bridge = window.SL_BridgeEtapa11;

    if (defenseType) {
      const elapsed     = Date.now() - combat.qteStart;
      const engineDelta = scaleQteDelta(elapsed);
      const result      = engine.resolveDefense({ type: defenseType, qteDeltaMs: engineDelta });
      if (bridge) bridge.observeDefenseResult(result);

      if (result.result === 'perfect-dodge' || result.result === 'perfect-block') {
        log(`✨ ${result.result === 'perfect-dodge' ? 'Esquiva Perfeita' : 'Parry Perfeito'}! Sem dano.`, 'var(--c-azure-core)');
        if (fx()) fx().lightning({ x:50, y:50 });
        return;
      }
      if (result.result === 'dodge' || result.result === 'parry') {
        const reduced = Math.round(enemy.attackDamage * 0.35);
        engine.applyDamage({ amount: reduced, element: enemy.element, source: 'boss' });
        log(`🛡️ ${defenseType === 'dodge' ? 'Esquiva' : 'Parry'} — dano reduzido: ${reduced}`, 'var(--c-gold-core)');
        if (fx()) fx().smoke({ x:50, y:50 });
        refreshPlayerHUD(); checkPlayerDead(); return;
      }
    }

    engine.applyDamage({ amount: enemy.attackDamage, element: enemy.element, source: 'boss' });
    log(`💢 ${enemy.nome} causou ${enemy.attackDamage} de dano!`, 'var(--c-crimson-core)');
    if (fx()) { fx().blood({ x:50, y:60 }); fx().cameraImpactShake({ intensity:.8, duration:140 }); }
    refreshPlayerHUD(); checkPlayerDead();
  }

  function checkPlayerDead() {
    const s = c9() && c9().state;
    if (s && s.hp <= 0) endCombat(false);
  }

  // ============================================================
  // RECOMPENSAS
  // ============================================================
  function grantRewards(enemy) {
    const LS = 'sl_auth_state_v1';
    try {
      const raw  = localStorage.getItem(LS); if (!raw) return {};
      const auth = JSON.parse(raw);
      const ch   = auth.character;        if (!ch) return {};

      ch.xp    = (ch.xp    || 0) + enemy.xpReward;
      ch.coins = (ch.coins || 0) + enemy.coinReward;

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
      ch.rank  = lv>=100?'S':lv>=80?'A':lv>=60?'B':lv>=40?'C':lv>=20?'D':'E';

      localStorage.setItem(LS, JSON.stringify(auth));
      if (window.AuthPlayer) window.AuthPlayer.renderPlayerHUD();

      return { xp: enemy.xpReward, coins: enemy.coinReward, leveled, level: ch.level, rank: ch.rank };
    } catch (e) { console.warn('[CombatUI] grantRewards', e); return {}; }
  }

  function rollDrops(enemy) {
    return (enemy.dropTable || []).filter(d => Math.random() < d.chance).map(d => d.nome);
  }

  function getPlayerLevel() {
    try {
      const raw = localStorage.getItem('sl_auth_state_v1');
      const ch  = raw && JSON.parse(raw).character;
      return (ch && ch.level) || 1;
    } catch { return 1; }
  }

  // ============================================================
  // INICIAR / ENCERRAR
  // ============================================================
  function startFight(enemyId) {
    const enemy = ENEMIES[enemyId];
    if (!enemy) { console.warn('[CombatUI] enemy not found:', enemyId); return; }

    inject();

    // Reseta engine com HP real do personagem
    const engine = c9();
    if (engine) {
      try {
        const raw = localStorage.getItem('sl_auth_state_v1');
        const ch  = raw && JSON.parse(raw).character;
        engine.state.hp         = ch ? ch.hpMax  : 120;
        engine.state.maxHp      = engine.state.hp;
        engine.state.mp         = ch ? ch.manaMax : 100;
        engine.state.maxMp      = engine.state.mp;
        engine.state.stamina    = 100;
        engine.state.maxStamina = 100;
      } catch {}

      if (fx()) {
        engine.setEffects({
          screenShake:        (p) => fx().cameraImpactShake(p),
          spawnParticles:     (p) => fx().explosion({ x:50, y:30, ...p }),
          slowMotion:         ()  => {},
          playSfx:            ()  => {},
          changeCameraImpact: ()  => {},
          cinematicCut:       ()  => {},
        });
      }
    }

    if (enemy.isBoss && window.SL_BossEtapa10) {
      window.SL_BossEtapa10.setBoss(enemy.bossId, { hp: enemy.hp });
      window.SL_BossEtapa10.setCallbacks({
        onCutscene:    ({ text }) => log(`📖 ${text}`, 'var(--c-violet-core)'),
        onMusicChange: () => {},
        onDrop:        (d)  => log(`🎁 Drop: ${d.nome}`, 'var(--c-gold-core)'),
      });
    }

    combat.active         = true;
    combat.enemy          = enemy;
    combat.enemyHp        = enemy.hp;
    combat.enemyMaxHp     = enemy.hp;
    combat.incomingAttack = false;

    clearInterval(combat.attackInterval);
    if (combat.qteTimeout) clearTimeout(combat.qteTimeout);

    setText('ci-enemy-name', enemy.nome);
    setText('ci-enemy-icon', enemy.icon);
    const badge = el('ci-phase-badge');
    if (badge) { badge.textContent = 'Rank ' + enemy.rank; badge.style.display = 'inline-block'; }

    el('ci-log')    && (el('ci-log').innerHTML    = '');
    el('ci-result') && (el('ci-result').style.display = 'none');

    refreshEnemyHUD();
    refreshPlayerHUD();
    refreshDungeonCtx();
    refreshConsumables();
    startStaminaRegen();

    log(`⚔️ ${enemy.nome} aparece!`, 'var(--c-text-dim)');

    combat.attackInterval = setInterval(() => {
      if (!combat.active || combat.incomingAttack) return;
      if (enemy.isBoss && window.SL_BossEtapa10) {
        const act = window.SL_BossEtapa10.bossAct();
        if (act.ok) log(`👁️ Boss usa: ${act.attackName}`, 'var(--c-text-faint)');
      }
      showQTE();
      log(`⚠️ ${enemy.nome} está atacando — reaja!`, 'var(--c-crimson-core)');
    }, enemy.attackIntervalMs);

    if (window.ALL_PAGES && !window.ALL_PAGES.includes('combate')) window.ALL_PAGES.push('combate');
    if (typeof window.navigate === 'function') window.navigate('combate');
  }

  function endCombat(victory) {
    combat.active = false;
    clearInterval(combat.attackInterval);
    clearInterval(_staminaRegen);
    hideQTE();

    if (victory) {
      const rewards = grantRewards(combat.enemy);
      const drops   = rollDrops(combat.enemy);

      if (window.SL_EventBus) {
        window.SL_EventBus.emit('enemy:defeated', { id: combat.enemy.id, rank: combat.enemy.rank });
      }

      // Se estiver em modo dungeon, passa controle pra dungeon
      if (typeof _onVictory === 'function') {
        _onVictory({ ...rewards, drops });
        return;
      }

      // Fora de dungeon: mostra overlay normal
      const overlay = el('ci-result');
      if (!overlay) return;
      overlay.style.display = 'flex';
      el('ci-result-icon').textContent  = '🏆';
      setText('ci-result-title', 'VITÓRIA');
      el('ci-result-title').style.color = 'var(--c-gold-core)';
      let body = `+${rewards.xp} XP  ·  +${rewards.coins} 🪙`;
      if (drops.length) body += `\n🎁 ${drops.join(', ')}`;
      if (rewards.leveled) body += `\n\n🆙 LEVEL UP! → Lv. ${rewards.level}  [${rewards.rank}]`;
      setText('ci-result-body', body);
      if (fx()) { fx().explosion({ x:50, y:40 }); fx().brilho({ x:50, y:40 }); }

    } else {
      if (typeof _onDefeat === 'function') {
        _onDefeat();
        return;
      }
      const overlay = el('ci-result');
      if (!overlay) return;
      overlay.style.display = 'flex';
      el('ci-result-icon').textContent  = '💀';
      setText('ci-result-title', 'DERROTA');
      el('ci-result-title').style.color = 'var(--c-crimson-core)';
      setText('ci-result-body', 'Você foi derrotado.\nRetorne e tente novamente.');
      if (fx()) fx().vignette({ enabled:true, intensity:.6 });
    }
  }

  function flee() {
    if (!combat.active) return;
    // Limpa callbacks de dungeon ao fugir
    _onVictory = null; _onDefeat = null; _dungeonContext = null;
    endCombat(false);
    const overlay = el('ci-result');
    if (!overlay) return;
    overlay.style.display = 'flex';
    el('ci-result-icon').textContent  = '🏃';
    setText('ci-result-title', 'RECUO');
    el('ci-result-title').style.color = 'var(--c-text-dim)';
    setText('ci-result-body', 'Você fugiu da batalha.');
    refreshDungeonCtx();
  }

  function closeResult() {
    const overlay = el('ci-result');
    if (overlay) overlay.style.display = 'none';
    if (typeof window.navigate === 'function') window.navigate('home');
  }

  // ============================================================
  // AÇÕES DO JOGADOR
  // ============================================================
  function getDmgBoost() {
    if (window._combatDmgBoostCharges > 0) {
      const boost = window._combatDmgBoost || 1;
      window._combatDmgBoostCharges--;
      if (window._combatDmgBoostCharges <= 0) {
        window._combatDmgBoost = 1;
        window._combatDmgBoostCharges = 0;
      }
      return boost;
    }
    return 1;
  }

  function doQuickAttack() {
    if (!combat.active) return;
    const engine = c9(); if (!engine) return;
    const lv     = getPlayerLevel();
    const result = engine.attackQuick({ element:'sombra', baseDamage: 12 + Math.round((lv-1)*2.5) });
    if (!result.ok) { log(result.reason==='cooldown'?'⏳ Cooldown!':'⚡ Sem stamina!','var(--c-text-faint)'); return; }
    if (result.missed) { log('❌ Errou! Combo resetado.','var(--c-text-faint)'); return; }

    const boost = getDmgBoost();
    const dmg   = Math.round(result.dmg * boost);
    const boostTxt = boost > 1 ? ` ✨×${boost.toFixed(2)}` : '';
    dealDamageToEnemy(dmg);
    log(`⚡ Rápido — ${dmg} dano${result.crit?' 💥 CRÍTICO':''}${boostTxt} [combo ×${engine.state.combo.count}]`,
      result.crit?'var(--c-gold-core)':'var(--c-text)');
    flashEnemyHit();
    if (fx()) fx().glow({ x:50, y:30, color:'rgba(47,216,255,0.3)' });
    refreshPlayerHUD();
  }

  function doChargedAttack() {
    if (!combat.active) return;
    const engine = c9(); if (!engine) return;
    const lv     = getPlayerLevel();
    const result = engine.attackCharged({ element:'sombra', baseDamage: 22 + Math.round((lv-1)*4) });
    if (!result.ok) { log(result.reason==='cooldown'?'⏳ Cooldown!':'⚡ Sem stamina!','var(--c-text-faint)'); return; }
    if (result.missed) { log('❌ Errou! Combo resetado.','var(--c-text-faint)'); return; }

    const boost = getDmgBoost();
    const dmg   = Math.round(result.dmg * boost);
    const boostTxt = boost > 1 ? ` ✨×${boost.toFixed(2)}` : '';
    dealDamageToEnemy(dmg);
    log(`💥 Carregado — ${dmg} dano${result.crit?' 💥 CRÍTICO':''}${boostTxt}`,
      result.crit?'var(--c-gold-core)':'var(--c-violet-core)');
    flashEnemyHit();
    if (fx()) { fx().explosion({ x:50, y:30 }); if (result.crit) fx().bloom({ intensity:1.2 }); }
    refreshPlayerHUD();
  }

  function doDefense(type) {
    if (!combat.active) return;
    if (!combat.incomingAttack) { log('Nenhum ataque chegando.','var(--c-text-faint)'); return; }
    resolveIncoming(type);
  }

  function dealDamageToEnemy(dmg) {
    combat.enemyHp = Math.max(0, combat.enemyHp - dmg);
    if (combat.enemy.isBoss && window.SL_BridgeEtapa11) {
      window.SL_BridgeEtapa11.bossDamageFromPlayerAttack({ attackDamage: dmg });
    }
    refreshEnemyHUD();
    if (combat.enemyHp <= 0) endCombat(true);
  }

  function useConsumable(itemId) {
    const shop = window.SL_ShopUI;
    if (!shop) return;
    const result = shop.useConsumable(itemId);
    if (!result.ok) { log(result.reason || 'Sem estoque.','var(--c-text-faint)'); return; }
    log(`🧪 ${result.item.nome} usado! ${result.effectDesc}`, 'var(--c-azure-core)');
    refreshPlayerHUD();
    refreshConsumables();
  }

  // ============================================================
  // API PÚBLICA DOS HOOKS DE DUNGEON
  // ============================================================
  function setOnVictory(cb)      { _onVictory      = cb; }
  function setOnDefeat(cb)       { _onDefeat        = cb; }
  function setDungeonContext(ctx){ _dungeonContext   = ctx; if (el('ci-dungeon-ctx')) refreshDungeonCtx(); }

  // ============================================================
  // BOOT
  // ============================================================
  document.addEventListener('DOMContentLoaded', () => {
    inject();
    if (window.ALL_PAGES && !window.ALL_PAGES.includes('combate')) window.ALL_PAGES.push('combate');
  });

  // ============================================================
  // API PÚBLICA
  // ============================================================
  window.SL_CombatUI = {
    ENEMIES,
    startFight,
    doQuickAttack,
    doChargedAttack,
    doDefense,
    useConsumable,
    flee,
    closeResult,
    // hooks de dungeon
    setOnVictory,
    setOnDefeat,
    setDungeonContext,
  };
})();