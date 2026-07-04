(function () {
  // Lore Etapa 6 — apenas dados/estado local.
  // O requisito diz: "Agora desenvolva somente a Lore."

  const LS_KEY = 'sl_lore_choice_v1';

  const lore = {
    // Continentes
    continentes: [
      {
        nome: 'Terras de Seul',
        descricao:
          'O continente mais conectado ao Sistema. Portais aparecem com mais frequência nas noites de baixa mana.',
      },
      {
        nome: 'Círculo de Cinza',
        descricao:
          'Regiões queimadas por eventos antigos. Espíritos contam que a primeira divindade foi selada aqui.',
      },
      {
        nome: 'Mar de Fragmentos',
        descricao:
          'A água carrega destroços de relíquias e navios que "chegaram antes" do tempo.',
      },
    ],

    // Reinos
    reinos: [
      {
        nome: 'Reino da Névoa Carmesim',
        continente: 'Círculo de Cinza',
        descricao:
          'Governado por juramentos antigos. Todo acordo termina quando um sino toca ao contrário.',
      },
      {
        nome: 'A Colônia do Porto de Vidro',
        continente: 'Terras de Seul',
        descricao:
          'Comércio e vigilância ritual. As rotas marítimas mudam conforme a reputação dos caçadores.',
      },
      {
        nome: 'Domínio do Vazio Ancestral',
        continente: 'Mar de Fragmentos',
        descricao:
          'Onde o mapa não aponta direção. Quem tenta atravessar volta com memórias que não são suas.',
      },
    ],

    // Famílias
    familias: [
      {
        nome: 'Casa Violet',
        origem: 'Seul',
        simbolo: 'Fita violeta em espiral',
      },
      {
        nome: 'Lin de Ferro-Quente',
        origem: 'Distrito da Forja',
        simbolo: 'Chama aprisionada em metal',
      },
      {
        nome: 'Casa do Espelho Partido',
        origem: 'Porto de Vidro',
        simbolo: 'Metade refletindo o futuro',
      },
    ],

    // Clãs
    clãs: [
      {
        nome: 'Clã dos Sussurros',
        familiaAssociada: 'Casa Violet',
        foco: 'inteligência, memórias e pacto com sombras',
      },
      {
        nome: 'Clã do Martelo Calmo',
        familiaAssociada: 'Lin de Ferro-Quente',
        foco: 'vontade, armaduras e juramentos de guerra',
      },
      {
        nome: 'Clã do Reflexo Rasgado',
        familiaAssociada: 'Casa do Espelho Partido',
        foco: 'proteção, portais e negociação com relíquias',
      },
    ],

    // Guildas
    guildas: [
      {
        nome: 'Exército das Sombras',
        origem: 'Terras de Seul',
        lema: 'O Sistema observa. Nós também.',
      },
      {
        nome: 'Ordem do Cinzel Inverso',
        origem: 'Círculo de Cinza',
        lema: 'A forja não cura — muda.',
      },
      {
        nome: 'Liga do Porto Veloz',
        origem: 'Porto de Vidro',
        lema: 'Chegar é uma habilidade.',
      },
    ],

    // Religiões
    religioes: [
      {
        nome: 'Círculo do Zero',
        crença: 'a divindade nasceu quando tudo decidiu parar de existir por um instante',
      },
      {
        nome: 'O Adeus em Dois Passos',
        crença: 'toda alma precisa de duas despedidas: uma para o mundo e outra para o Sistema',
      },
      {
        nome: 'Oráculo das Fendas',
        crença: 'portais são cartas abertas — e o destino escreve de volta',
      },
    ],

    // Facções
    facções: [
      {
        nome: 'Guardas do Contorno',
        descricao:
          'Mantêm relíquias isoladas para evitar "ecos" que atravessam o tempo.',
      },
      {
        nome: 'Caçadores-Observadores',
        descricao:
          'Usam dados e encontros para prever eventos, pagando com memórias pequenas.',
      },
      {
        nome: 'Pastores do Vazio',
        descricao:
          'Negociam com o Vazio Ancestral em troca de passagem e silêncio',
      },
    ],

    // Raças
    raças: [
      {
        nome: 'Humanos de Interface',
        descricao:
          'Nasceram próximos a portais e carregam "ruído" em suas veias como se fossem mapas.',
      },
      {
        nome: 'Ancestrais de Névoa',
        descricao:
          'Criaturas que se materializam apenas quando alguém mente para si mesmo.',
      },
      {
        nome: 'Fragmentos Vivos',
        descricao:
          'Pedaços de relíquias com vontade própria. Preferem ser chamados de "coisa".'
      },
    ],

    // História principal
    historiaPrincipal: {
      resumo:
        'O Sistema começou como um experimento para medir a coragem. Com o tempo, o experimento virou destino — e as escolhas do jogador passaram a alterar pequenas reações no mundo.',
    },

    // Cronologia
    cronologia: [
      { ano: -1200, evento: 'O Primeiro Eclipse do Sistema' },
      { ano: -800, evento: 'A Fundação do Círculo do Zero' },
      { ano: -300, evento: 'Divisão do Mar de Fragmentos' },
      { ano: -70, evento: 'A Queda do Sinete Violet' },
      { ano: 12, evento: 'A Semana das Sombras (ocorrência recente)' },
    ],

    // NPCs importantes
    nps: [
      {
        nome: 'Ancião do Sistema',
        papel: 'mentor raro',
        local: 'Arquivo subterrâneo',
      },
      {
        nome: 'Mestra Lyra',
        papel: 'oráculo prático (treinamento)',
        local: 'Porto de Vidro',
      },
      {
        nome: 'Mercador do Caos',
        papel: 'vendedor de relíquias instáveis',
        local: 'entre portais',
      },
      {
        nome: 'Maestro Kang',
        papel: 'instrutor de juramentos',
        local: 'forja em Seul',
      },
    ],

    // Lendas
    lendas: [
      {
        nome: 'A Espiral que Nega o Tempo',
        descricao:
          'Dizem que uma família foi apagada do calendário — e ainda assim aparece nas sombras do dia seguinte.',
      },
      {
        nome: 'O Sino que Toca ao Contrário',
        descricao:
          'Toda promessa feita após o sino vira dívida antes de virar arma.',
      },
    ],

    // Relíquias
    relic: [
      {
        nome: 'Relíquia do Vidro Oco',
        tipo: 'portal/espelho',
        efeito:
          'O usuário pode "ver" uma rota alternativa do mapa — mas o mundo cobra juros em reputação.',
      },
      {
        nome: 'Sinete Violet Quebrado',
        tipo: 'juramento',
        efeito:
          'Amplifica famílias violetas; quando usado, pequenos diálogos reconhecem seu clã.',
      },
    ],

    // Portais
    portais: [
      {
        nome: 'Fenda do Sussurro Violeta',
        local: 'Rua sem nome em Seul',
        regra: 'o portal abre quando o jogador escolhe “ouvir” ao invés de “controlar”.',
      },
      {
        nome: 'Arco do Martelo Calmo',
        local: 'forja do Círculo de Cinza',
        regra: 'requer um juramento feito em voz alta.',
      },
    ],

    // Eventos históricos
    eventosHistoricos: [
      { nome: 'Queda do Sinete Violet', epoca: -70, efeitoNoMundo: 'NPCs passam a usar apelidos diferentes.' },
      { nome: 'Divisão do Mar de Fragmentos', epoca: -300, efeitoNoMundo: 'o comércio altera rotas.' },
    ],

    // Interação com escolhas do jogador
    // (requisito: "Cada escolha do jogador deve alterar pequenos diálogos no futuro.")
    // Aqui deixamos um mapa de "respostas" que pode ser usado por etapa futura.
    choiceDialogueHooks: {
      personagem: {
        family: {
          'Violet': {
            npcSay: '“Vejo seu nome na fita violeta. Não foi sorte.”',
          },
        },
        origin: {
          'Sistema': {
            npcSay: '“Você voltou porque o Sistema permitiu. Então o Sistema também aprendeu.”',
          },
          'Distrito': {
            npcSay: '“Distrito e sombra... ainda bem que você sabe onde pisar.”',
          },
        },
        clazz: {
          'Vigilante': {
            npcSay: '“Fique atento. O silêncio aqui é uma lâmina.”',
          },
        },
      },
    },
  };

  function loadChoiceState() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  function saveChoiceState(obj) {
    localStorage.setItem(LS_KEY, JSON.stringify(obj || {}));
  }

  // Exponibiliza global (para futuras etapas renderizarem a lore e os diálogos)
  window.SL_LoreEtapa6 = lore;
  window.SL_LoreEtapa6_loadChoiceState = loadChoiceState;
  window.SL_LoreEtapa6_saveChoiceState = saveChoiceState;
})();

