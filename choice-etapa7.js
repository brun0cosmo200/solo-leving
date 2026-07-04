(function () {
  // Etapa 7 — Dialog hooks / reações futuras (sem combate)
  // Serve como "ponte" para a Etapa 6 e para etapas futuras.

  const LS_KEY = 'sl_etapa7_choices_v1';

  const defaultState = {
    lastPlayedAt: null,
    // Ex.: escolhas do jogador em diálogos de lore
    dialogueTone: 'neutro', // neutro|resoluto|tremendo
    oathStrength: 0, // 0..3
    chosenRelic: null,
    chosenPortal: null,
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

  const state = load();

  // Diálogos que serão modificados por escolhas
  const dialogues = {
    greeting: {
      neutro: '“Você voltou. O Sistema registrou o seu peso no mundo.”',
      resoluto: '“A sua sombra não hesita. O Sistema também não.”',
      tremendo: '“Mesmo com medo, você avança. Isso é raro.”',
    },
    oath: {
      0: '“Juras não movem portais sozinhos. Mas você ainda está aprendendo.”',
      1: '“Seu juramento tem forma. Pequenas portas começam a reagir.”',
      2: '“Quando você promete, o mundo escuta. Até a relíquia.”',
      3: '“Seu juramento é uma chave. O Sistema teme perder o controle.”',
    },
    portalEcho: {
      true: '“Este portal conhece seu nome.”',
      false: '“Este portal ainda não decidiu se confia em você.”',
    },
    relicEcho: {
      true: '“A relíquia reconheceu a sua respiração.”',
      false: '“A relíquia está em silêncio. Por enquanto.”',
    },
  };

  function applyChoiceTone(tone) {
    if (!['neutro', 'resoluto', 'tremendo'].includes(tone)) tone = 'neutro';
    state.dialogueTone = tone;
    state.lastPlayedAt = Date.now();
    save(state);
  }

  function applyOathStrength(level) {
    const l = Math.max(0, Math.min(3, parseInt(level, 10) || 0));
    state.oathStrength = l;
    state.lastPlayedAt = Date.now();
    save(state);
  }

  function applyChosenPortal(portalName) {
    state.chosenPortal = portalName || null;
    state.lastPlayedAt = Date.now();
    save(state);
  }

  function applyChosenRelic(relicName) {
    state.chosenRelic = relicName || null;
    state.lastPlayedAt = Date.now();
    save(state);
  }

  function getDialogueBundle() {
    // Integra com Etapa 6 se existir
    const lore6Choice = window.SL_LoreEtapa6 && window.SL_LoreEtapa6_loadChoiceState
      ? window.SL_LoreEtapa6_loadChoiceState()
      : {};

    // Heurística: usa chosenPortal/Relic do player; se não houver, tenta ler hooks do clã/família
    const hasPortal = !!state.chosenPortal;
    const hasRelic = !!state.chosenRelic;

    // Porta "eco" do mundo pode mudar com família/origem
    const greeting = dialogues.greeting[state.dialogueTone] || dialogues.greeting.neutro;

    const oath = dialogues.oath[state.oathStrength] || dialogues.oath[0];

    const portalEcho = dialogues.portalEcho[hasPortal ? 'true' : 'false'];
    const relicEcho = dialogues.relicEcho[hasRelic ? 'true' : 'false'];

    const familyHook =
      lore6Choice?.personagem?.family?.[Object.keys(lore6Choice?.personagem?.family || {})[0]]
        ?.npcSay;

    return {
      greeting,
      oath,
      portalEcho,
      relicEcho,
      familyHook: familyHook || null,
    };
  }

  // Export global
  window.SL_Etapa7 = {
    state,
    applyChoiceTone,
    applyOathStrength,
    applyChosenPortal,
    applyChosenRelic,
    getDialogueBundle,
  };
})();

