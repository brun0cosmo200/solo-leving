// Minimal client-side simulation for Etapa 3 (Login) + Etapa 4 (Player system)
// No backend. Uses localStorage as mock persistence.

(function () {
  const LS_KEY = 'sl_auth_state_v1';

  const App = {
    auth: {
      state: loadState(),
    },
    player: {
      buildInitialCharacter: PlayerDefaults,
    },
  };

  function loadState() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return { loggedIn: false, accountId: null, character: null };
      const parsed = JSON.parse(raw);
      return {
        loggedIn: !!parsed.loggedIn,
        accountId: parsed.accountId != null ? parsed.accountId : null,
        character: parsed.character != null ? parsed.character : null,
      };
    } catch (e) {
      return { loggedIn: false, accountId: null, character: null };
    }
  }

  function saveState() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(App.auth.state));
    } catch (e) {
      // Não deixa uma falha de storage (quota, modo privado, etc.) travar o
      // fluxo de login/criação de personagem — o estado em memória continua
      // funcionando nesta sessão mesmo sem persistir.
      console.warn('Falha ao salvar estado de auth/player:', e);
    }
  }

  // -------------------- Router helpers --------------------
  // showView: usado apenas para as telas de auth (login/registro/recuperação/
  // criação de personagem/loading). Garante que #auth-flow fique visível e
  // #app-root (o jogo em si) fique escondido.
  function showView(viewId) {
    const authFlow = document.getElementById('auth-flow');
    const appRoot = document.getElementById('app-root');
    if (appRoot) appRoot.classList.remove('active');
    if (authFlow) authFlow.classList.add('active');

    document.querySelectorAll('#auth-flow .view').forEach((v) => v.classList.remove('active'));
    const el = document.getElementById(viewId);
    if (el) el.classList.add('active');
  }

  // showApp: caminho inverso — esconde o fluxo de auth e mostra o jogo,
  // sempre abrindo na Home.
  function showApp() {
    const authFlow = document.getElementById('auth-flow');
    const appRoot = document.getElementById('app-root');
    if (authFlow) authFlow.classList.remove('active');
    if (appRoot) appRoot.classList.add('active');

    document.querySelectorAll('#app-root .view').forEach((v) => v.classList.remove('active'));
    const home = document.getElementById('view-home');
    if (home) home.classList.add('active');
  }

  // -------------------- Toast --------------------
  function toast(msg) {
    const container = document.getElementById('toasts');
    if (!container) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    container.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => {
      t.classList.remove('show');
      setTimeout(() => t.remove(), 260);
    }, 1400);
  }

  // -------------------- UI helpers --------------------
  function setText(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = String(value);
  }

  function setProgressBarWidth(trackId, fillId, percent) {
    // trackId is unused; keeping signature for future.
    const fill = document.getElementById(fillId);
    if (!fill) return;
    const p = Math.max(0, Math.min(100, Number(percent) || 0));
    fill.style.width = p.toFixed(0) + '%';
  }

  // -------------------- Etapa 3 + 4 API --------------------
  window.AuthPlayer = {
    init() {
      if (App.auth.state.loggedIn && App.auth.state.character) {
        this.gotoWelcome();
      } else {
        showView('view-login');
      }

      // Wire forms
      const formLogin = document.getElementById('form-login');
      const formRegister = document.getElementById('form-register');
      const formRecovery = document.getElementById('form-recovery');
      const formCharacter = document.getElementById('form-character');

      if (formLogin) {
        formLogin.addEventListener('submit', (e) => {
          e.preventDefault();
          this.doLogin(new FormData(formLogin));
        });
      }

      if (formRegister) {
        formRegister.addEventListener('submit', (e) => {
          e.preventDefault();
          this.doRegister(new FormData(formRegister));
        });
      }

      if (formRecovery) {
        formRecovery.addEventListener('submit', (e) => {
          e.preventDefault();
          this.doRecovery(new FormData(formRecovery));
        });
      }

      if (formCharacter) {
        formCharacter.addEventListener('submit', (e) => {
          e.preventDefault();
          this.selectCharacter(new FormData(formCharacter));
        });
      }

      // Wire navigation buttons (optional)
      const btnToRegister = document.getElementById('go-register');
      const btnToRecovery = document.getElementById('go-recovery');

      if (btnToRegister) btnToRegister.addEventListener('click', () => showView('view-register'));
      if (btnToRecovery) btnToRecovery.addEventListener('click', () => showView('view-recovery'));

      // "Voltar ao login" aparece em mais de uma tela (registro e recuperação),
      // então amarra por classe em vez de um único #id.
      document.querySelectorAll('.js-back-to-login').forEach((el) => {
        el.addEventListener('click', () => showView('view-login'));
      });

      // Character family quick buttons
      document.querySelectorAll('[data-character-family]').forEach((el) => {
        el.addEventListener('click', () => {
          const family = el.getAttribute('data-character-family');
          const famSel = document.getElementById('char-family');
          if (famSel && family) famSel.value = family;
        });
      });
    },

    doLogin(fd) {
      const username = (fd.get('username') || '').toString().trim();
      if (!username) return toast('Informe seu nome de usuário.');

      App.auth.state.loggedIn = true;
      App.auth.state.accountId = 'acc_' + hash(username);

      if (App.auth.state.character) {
        this.gotoLoading(() => this.gotoWelcome());
      } else {
        this.gotoLoading(() => showView('view-character'));
      }

      saveState();
      toast('Login efetuado.');
    },

    doRegister(fd) {
      const username = (fd.get('username') || '').toString().trim();
      const email = (fd.get('email') || '').toString().trim();
      if (!username) return toast('Informe um nome de usuário.');
      if (!email) return toast('Informe um e-mail válido.');

      App.auth.state.loggedIn = true;
      App.auth.state.accountId = 'acc_' + hash(username);
      App.auth.state.character = null;
      saveState();

      this.gotoLoading(() => showView('view-character'));
      toast('Cadastro concluído.');
    },

    doRecovery(fd) {
      const email = (fd.get('email-recovery') || '').toString().trim();
      if (!email) return toast('Informe seu e-mail de recuperação.');

      toast('Se o e-mail existir, você receberá instruções.');
      showView('view-login');
    },

    selectCharacter(fd) {
      const char = this.buildCharacterFromForm(fd);
      App.auth.state.character = char;
      saveState();

      this.gotoLoading(() => this.gotoWelcome());
      toast('Personagem criado com sucesso.');
    },

    buildCharacterFromForm(fd) {
      const d = PlayerDefaults();

      const name = (fd.get('char-name') || '').toString().trim();
      d.name = name || 'Caçador';

      d.clazz = (fd.get('char-classe') || '').toString().trim() || 'Vigilante';
      d.family = (fd.get('char-family') || '').toString().trim() || 'Violet';
      d.origin = (fd.get('char-origin') || '').toString().trim() || 'Sistema';

      d.level = toInt(fd.get('char-level'), d.level);
      d.xp = toInt(fd.get('char-xp'), d.xp);

      // Derived values
      d.rank = rankFromLevel(d.level);
      d.title = titleFromRank(d.rank);
      d.reputation = reputationForRank(d.rank);

      d.xpMax = xpMaxFromLevel(d.level);

      d.mana = toInt(fd.get('char-mana'), d.mana);
      d.manaMax = d.mana;

      d.hp = toInt(fd.get('char-hp'), d.hp);
      d.hpMax = d.hp;

      d.energy = toInt(fd.get('char-energy'), d.energy);
      d.energyMax = d.energy;

      d.attributePoints = toInt(fd.get('attr-points'), d.attributePoints);
      d.skillPoints = toInt(fd.get('skill-points'), d.skillPoints);

      d.coins = toInt(fd.get('coins'), d.coins);

      // labels
      d.clazzLabel = d.clazz;
      d.familyLabel = d.family;

      return d;
    },

    gotoLoading(after) {
      showView('view-loading');

      const loaderText = document.getElementById('loading-text');
      if (loaderText) loaderText.textContent = 'Conectando...';

      const steps = [
        ['Inicializando...', 350],
        ['Carregando identidade...', 520],
        ['Sincronizando progresso...', 520],
      ];

      let elapsed = 0;
      let idx = 0;

      const total = steps.reduce((a, s) => a + s[1], 0);

      const interval = setInterval(() => {
        elapsed += 80;
        while (idx < steps.length && elapsed >= steps.slice(0, idx + 1).reduce((a, s) => a + s[1], 0)) {
          idx++;
        }
        const cur = steps[Math.min(idx, steps.length - 1)];
        if (loaderText && cur) loaderText.textContent = cur[0];
        if (elapsed >= total) {
          clearInterval(interval);
          if (typeof after === 'function') after();
        }
      }, 80);

      // fallback
      setTimeout(() => {
        clearInterval(interval);
        if (typeof after === 'function') after();
      }, total + 120);
    },

    gotoWelcome() {
      showApp();
      this.renderPlayerHUD();
      toast('Bem-vindo ao Sistema.');
    },

    logout() {
      // Mantém o personagem salvo (é um "slot" único local, não multi-conta
      // de verdade) — só desloga e volta pra tela de login.
      App.auth.state.loggedIn = false;
      App.auth.state.accountId = null;
      saveState();
      showView('view-login');
      toast('Você saiu do Sistema.');
    },

    renderPlayerHUD() {
      const ch = App.auth.state.character;
      if (!ch) return;

      // --- Header HUD (IDs que existem no HTML) ---
      setText('hud-name', ch.name);
      setText('hud-sub', 'Lv. ' + ch.level + ' · ' + ch.title);

      const hpPct = ch.hpMax ? (ch.hp   / ch.hpMax)   * 100 : 0;
      const mpPct = ch.manaMax ? (ch.mana / ch.manaMax) * 100 : 0;
      const xpPct = ch.xpMax  ? (ch.xp   / ch.xpMax)  * 100 : 0;
      setProgressBarWidth('track-hp', 'hud-hp-fill', hpPct);
      setProgressBarWidth('track-mp', 'hud-mp-fill', mpPct);
      setProgressBarWidth('track-xp', 'hud-xp-fill', xpPct);

      // Rank hex no header
      const rankHex = document.getElementById('rank-hex-hud');
      if (rankHex) {
        rankHex.textContent = ch.rank;
        rankHex.className   = 'rank-hex ' + rankToBadgeClass(ch.rank);
      }

      // --- View de Perfil (IDs adicionados ao HTML) ---
      setText('p-name',       ch.name.toUpperCase());
      setText('p-sub',        ch.name + ' · ID #' + String(App.auth.state.accountId || '000001').slice(-6));
      setText('p-titulo',     ch.title);
      setText('p-rank-label', 'Rank ' + ch.rank);
      setText('p-classe',     ch.clazzLabel || ch.clazz);
      setText('p-attr-points', ch.attributePoints);

      // Rank badge do perfil (letra + classe CSS)
      const rankBadge = document.getElementById('p-rank');
      if (rankBadge) {
        rankBadge.textContent = ch.rank;
        rankBadge.className   = 'rank-badge ' + rankToBadgeClass(ch.rank);
      }
    },
  };

  // -------------------- Model --------------------
  function PlayerDefaults() {
    const initial = {
      name: 'Caçador',
      clazz: 'Vigilante',
      family: 'Violet',
      origin: 'Sistema',

      level: 1,
      xp: 0,
      xpMax: 100,

      mana: 50,
      manaMax: 100,
      hp: 120,
      hpMax: 200,
      energy: 40,
      energyMax: 100,

      rank: 'E',
      title: 'Iniciante',
      reputation: 0,

      attributePoints: 3,
      skillPoints: 2,

      coins: 1000,

      // labels
      clazzLabel: 'Vigilante',
      familyLabel: 'Violet',
    };

    initial.rank = rankFromLevel(initial.level);
    initial.title = titleFromRank(initial.rank);
    initial.reputation = reputationForRank(initial.rank);
    initial.xpMax = xpMaxFromLevel(initial.level);

    // keep derived resources consistent with defaults
    initial.manaMax = initial.manaMax;
    initial.hpMax = initial.hpMax;
    initial.energyMax = initial.energyMax;

    return initial;
  }

  function toInt(v, fallback) {
    if (v === null || v === undefined || v === '') return fallback;
    const n = Number(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(0, Math.floor(n));
  }

  function rankFromLevel(level) {
    const lv = Number(level) || 1;
    if (lv >= 100) return 'S';
    if (lv >= 80) return 'A';
    if (lv >= 60) return 'B';
    if (lv >= 40) return 'C';
    if (lv >= 20) return 'D';
    return 'E';
  }

  function titleFromRank(rank) {
    switch (rank) {
      case 'S':
        return 'Monarca das Sombras';
      case 'A':
        return 'Associação de Caçadores';
      case 'B':
        return 'Caçador de Elite';
      case 'C':
        return 'Guardião Menor';
      case 'D':
        return 'Caçador em Formação';
      default:
        return 'Iniciante';
    }
  }

  function reputationForRank(rank) {
    const base = { E: 10, D: 30, C: 80, B: 150, A: 300, S: 650 };
    return base[rank] != null ? base[rank] : 10;
  }

  function xpMaxFromLevel(level) {
    const lv = Number(level) || 1;
    return Math.floor(100 + Math.pow(lv, 1.45) * 25);
  }

  function rankToBadgeClass(rank) {
    const map = {
      E: 'rank-badge--e',
      D: 'rank-badge--d',
      C: 'rank-badge--c',
      B: 'rank-badge--b',
      A: 'rank-badge--a',
      S: 'rank-badge--s',
    };
    return map[rank] || 'rank-badge--e';
  }

  function hash(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h).toString(16);
  }

  // -------------------- Auto-init --------------------
  document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('view-login') && document.getElementById('app-root')) {
      window.AuthPlayer.init();
    }
  });
})();