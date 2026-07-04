(function () {
  // Etapa 8 — Eventos históricos / mundo (apenas lore e estado local)
  // Objetivo: criar "linhas de evento" e permitir que escolhas alterem micro-diálogos.

  const LS_KEY = 'sl_eventos_etapa8_v1';

  const defaultState = {
    // quais eventos o jogador “conhece”/“acionou”
    unlocked: [],
    // id do evento mais recente visto
    lastSeenId: null,
  };

  const events = [
    {
      id: 'eclipse-violet',
      titulo: 'O Primeiro Eclipse do Sistema',
      desc: 'Uma noite em que as sombras parecem lembrar do futuro.',
      rewardPreview: 'reputa + pequena (visual)',
    },
    {
      id: 'zero-circle',
      titulo: 'A Fundação do Círculo do Zero',
      desc: 'Os juramentos ficam mais curtos — mas mais perigosos.',
      rewardPreview: 'título provável (visual)',
    },
    {
      id: 'division-fragments',
      titulo: 'A Divisão do Mar de Fragmentos',
      desc: 'Ruas mudam de nome e o mapa “erra” de propósito.',
      rewardPreview: 'rotas alternativas (visual)',
    },
    {
      id: 'fall-violet-seal',
      titulo: 'A Queda do Sinete Violet',
      desc: 'NPCs começam a falar como se já tivessem te conhecido.',
      rewardPreview: 'diálogo reativo (visual)',
    },
    {
      id: 'week-shadows',
      titulo: 'A Semana das Sombras',
      desc: 'Um evento recente: portais abrem com pressa e fecham como culpa.',
      rewardPreview: 'evento ativo (visual)',
    },
  ];

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

  function unlockEvent(id) {
    if (!events.some(e => e.id === id)) return;
    if (!state.unlocked.includes(id)) state.unlocked.push(id);
    state.lastSeenId = id;
    save(state);
  }

  function markSeenLatest() {
    if (state.unlocked.length === 0) return;
    const last = state.lastSeenId || state.unlocked[state.unlocked.length - 1];
    state.lastSeenId = last;
    save(state);
  }

  function getTimeline() {
    const unlockedSet = new Set(state.unlocked);
    return events.map((e) => ({ ...e, unlocked: unlockedSet.has(e.id) }));
  }

  // Micro-diálogos que “mudam” com base no estado desbloqueado
  function getReactiveDialogues() {
    const last = events.find(e => e.id === state.lastSeenId) || events[0];

    const spoken = {
      neutral: '“As histórias não acabam. Só mudam de lugar quando você olha.”',
      reativo:
        state.unlocked.length > 2
          ? `“Você tocou muitos capítulos. Até ${last?.titulo} te reconhece.”`
          : `“O capítulo ainda está pequeno… mas ${last?.titulo} já está no caminho.”`,
    };

    // Também integra com Etapa 7 (se existir)
    const bundle7 = window.SL_Etapa7 && window.SL_Etapa7.getDialogueBundle
      ? window.SL_Etapa7.getDialogueBundle()
      : null;

    return {
      neutral: spoken.neutral,
      reativo: spoken.reativo,
      bundle7,
    };
  }

  window.SL_Etapa8 = {
    state,
    events,
    unlockEvent,
    getTimeline,
    getReactiveDialogues,
    markSeenLatest,
  };
})();

