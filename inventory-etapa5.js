(function () {
  const LS_KEY = 'sl_inventory_state_v1';

  const RARITIES = [
    'Comum',
    'Incomum',
    'Raro',
    'Épico',
    'Lendário',
    'Mítico',
    'Divino',
  ];

  // Identidade visual (Glow conforme raridade + cor de borda/tag via classes)
  const RARITY_STYLES = {
    'Comum': { glow: 'rgba(255,255,255,.10)', tag: 'tag--dim', class: 'item-card--c-comum' },
    'Incomum': { glow: 'rgba(47,216,255,.18)', tag: 'tag--azure', class: 'item-card--c-incomum' },
    'Raro': { glow: 'rgba(42,17,69,.25)', tag: 'tag--violet', class: 'item-card--c-raro' },
    'Épico': { glow: 'rgba(179,65,255,.28)', tag: 'tag--violet', class: 'item-card--c-epico' },
    'Lendário': { glow: 'rgba(255,210,76,.35)', tag: 'tag--gold', class: 'item-card--c-lendario' },
    'Mítico': { glow: 'rgba(255,43,78,.22)', tag: 'tag--crimson', class: 'item-card--c-mitico' },
    'Divino': { glow: 'rgba(255,210,76,.50)', tag: 'tag--gold', class: 'item-card--c-divino' },
  };

  // Mock de imagens realistas: gradient com pseudo-arte e um "canvas"-looking (sem assets externos)
  function itemImageDataUrl(seed) {
    // Gera uma imagem SVG data URL (aparenta ser uma arte de item)
    const s = String(seed);
    const hue = (hash(s) % 360 + 360) % 360;
    const hue2 = (hue + 35) % 360;
    const glow = `hsla(${hue}, 90%, 65%, .55)`;

    const svg = `
      <svg xmlns='http://www.w3.org/2000/svg' width='512' height='512' viewBox='0 0 512 512'>
        <defs>
          <linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'>
            <stop offset='0' stop-color='hsl(${hue}, 60%, 18%)'/>
            <stop offset='0.55' stop-color='hsl(${hue2}, 70%, 10%)'/>
            <stop offset='1' stop-color='hsl(${hue}, 65%, 22%)'/>
          </linearGradient>
          <radialGradient id='g' cx='50%' cy='40%' r='65%'>
            <stop offset='0' stop-color='${glow}'/>
            <stop offset='0.6' stop-color='rgba(255,255,255,0.06)'/>
            <stop offset='1' stop-color='rgba(0,0,0,0)'/>
          </radialGradient>
          <filter id='soft'>
            <feGaussianBlur stdDeviation='10' result='b'/>
            <feColorMatrix in='b' type='matrix' values='1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 .9 0' result='c'/>
            <feMerge>
              <feMergeNode in='c'/>
              <feMergeNode in='SourceGraphic'/>
            </feMerge>
          </filter>
        </defs>
        <rect width='512' height='512' fill='url(#bg)'/>
        <circle cx='256' cy='210' r='180' fill='url(#g)' filter='url(#soft)'/>
        <path d='M120 350 C160 280 190 260 256 150 C320 260 350 280 392 350 Z' fill='rgba(255,255,255,0.07)' stroke='rgba(255,255,255,0.12)'/>
        <path d='M170 360 C205 300 220 290 256 230 C292 290 307 300 340 360 Z' fill='rgba(0,0,0,0.18)' stroke='rgba(255,255,255,0.10)'/>
        <circle cx='256' cy='250' r='76' fill='rgba(255,255,255,0.05)' stroke='rgba(255,255,255,0.12)'/>
        <path d='M256 170 L310 260 L256 350 L202 260 Z' fill='rgba(255,255,255,0.05)' stroke='rgba(255,255,255,0.18)'/>
        <text x='256' y='290' text-anchor='middle' font-size='34' font-family='Orbitron, Rajdhani, sans-serif' fill='rgba(255,255,255,0.40)'>SL</text>
      </svg>
    `;

    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.trim());
  }

  function hash(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  function defaultInventory() {
    // 14 itens mock para preencher a view atual (que mostra 8)
    return Array.from({ length: 14 }).map((_, i) => makeItem(i + 1));
  }

  function makeItem(idx) {
    const rarity = pickRarityByIndex(idx);
    const effect = effectForRarity(rarity);
    const type = pickTypeByIndex(idx);
    const category = type;

    const minLevel = Math.max(1, Math.floor(idx / 2) + (RARITIES.indexOf(rarity) - 1) * 3);
    const durability = clamp(18 - idx, 1, 100);

    return {
      id: 'it_' + idx,
      seed: 'seed_' + idx,
      rarity,
      name: nameForItem(idx, rarity, type),
      description: descriptionForItem(idx, type),
      history: historyForItem(idx, rarity),
      origin: originForItem(idx, type),
      type,
      category,
      weightKg: round1(0.2 + idx * 0.17 + RARITIES.indexOf(rarity) * 0.05),
      price: Math.floor(120 + idx * 90 + RARITIES.indexOf(rarity) * 520),
      durability,
      minLevel,
      visualEffect: effect,
    };
  }

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function round1(n) {
    return Math.round(n * 10) / 10;
  }

  function pickRarityByIndex(i) {
    // Distribuição: mais comuns no começo, mais raros no final
    const t = i / 14;
    if (t < 0.16) return 'Comum';
    if (t < 0.34) return 'Incomum';
    if (t < 0.50) return 'Raro';
    if (t < 0.66) return 'Épico';
    if (t < 0.80) return 'Lendário';
    if (t < 0.92) return 'Mítico';
    return 'Divino';
  }

  function pickTypeByIndex(i) {
    const types = ['Arma', 'Armadura', 'Consumível', 'Acessório', 'Material', 'Orbe', 'Pergaminho'];
    return types[(i - 1) % types.length];
  }

  function nameForItem(i, rarity, type) {
    const adjectives = ['Sombrio', 'Espectral', 'Cauterizado', 'Arcano', 'Vazio', 'Ancestral', 'Imaculado', 'Infernal'];
    const base = ['Aço', 'Lâmina', 'Égide', 'Colar', 'Orbe', 'Runa', 'Arco', 'Anel', 'Círculo', 'Chave'];
    const adj = adjectives[(i + RARITIES.indexOf(rarity)) % adjectives.length];
    const b = base[i % base.length];
    const prefix = rarity === 'Comum' ? '' : rarity === 'Incomum' ? 'Selo ' : rarity === 'Raro' ? 'Marca ' : '';
    const core = type === 'Arma' ? b : type === 'Armadura' ? 'Égide ' + b : b;
    return `${prefix}${adj} ${core}`.replace('  ', ' ');
  }

  function descriptionForItem(i, type) {
    const flavor = {
      'Arma': 'Vibra com intenção de corte, como se as sombras caçassem primeiro.',
      'Armadura': 'Seu peso parece esquecer o mundo ao ser vestido.',
      'Consumível': 'Uma centelha engolida pela noite, devolvendo fôlego ao corpo.',
      'Acessório': 'Conduz ciclos internos, afinando o destino a cada passo.',
      'Material': 'Extraído de um fragmento de realidade que recusou morrer.',
      'Orbe': 'Armazena ecos de mana e os devolve em silêncio.',
      'Pergaminho': 'As palavras são lâminas — e o pergaminho sabe quando abrir.'
    };
    return `${flavor[type] || 'Revela segredos ao contato com o usuário.'} Uso imprevisível no Submundo.`;
  }

  function historyForItem(i, rarity) {
    const lines = [
      'Foi registrado nos arquivos do Sistema após uma perda impossível.',
      'Cruza fronteiras onde rank e moral deixam de fazer sentido.',
      'Durante eras de caos, foi confundido com um símbolo de esperança.'
    ];
    const extra = {
      'Comum': 'Começou como sucata e terminou como ferramenta fiel.',
      'Incomum': 'Um artesão anônimo jurou que “ouvia” o metal.',
      'Raro': 'A primeira vez que brilhou, alguém perdeu o medo.',
      'Épico': 'Mantém a promessa de transformar dor em avanço.',
      'Lendário': 'Diz-se que foi tocado por um monarca invisível.',
      'Mítico': 'O eco dentro do item responde apenas ao nome verdadeiro.',
      'Divino': 'Não pertence a esta linha do mundo. Apenas visita.'
    };
    return `${lines[i % lines.length]} ${extra[rarity] || ''}`.trim();
  }

  function originForItem(i, type) {
    const origins = ['Seul', 'A Floresta Sombria', 'Dungeon de Ferro', 'Torre do Sistema', 'Porto de Vidro', 'Vazio Ancestral', 'Santuário do Rank'];
    const o = origins[(i + (type.length % 3)) % origins.length];
    return o;
  }

  function effectForRarity(rarity) {
    const effects = {
      'Comum': 'Brilho discreto e ruído de fundo nas bordas.',
      'Incomum': 'Efeito sonoro leve + glow azul sutil ao selecionar.',
      'Raro': 'Partículas violetas orbitam lentamente ao redor do item.',
      'Épico': 'Aura intensa com pulsos em 2 ritmos diferentes.',
      'Lendário': 'Glow dourado e trilha luminosa ao passar o cursor.',
      'Mítico': 'Chamas espectrais (crimson) e distorção no contorno.',
      'Divino': 'Luz branca-ouro com halo e silêncio absoluto ao selecionar.'
    };
    return effects[rarity] || effects['Comum'];
  }

  function loadInventory() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return defaultInventory();
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return defaultInventory();
      return parsed;
    } catch {
      return defaultInventory();
    }
  }

  function saveInventory(items) {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  }

  function installStylesOnce() {
    if (document.getElementById('etapa5-inv-styles')) return;

    const style = document.createElement('style');
    style.id = 'etapa5-inv-styles';
    style.textContent = `
      .item-card.etapa5-item{
        position:relative;
        overflow:hidden;
      }
      .item-card.etapa5-item .etapa5-art{
        width:100%;
        height:92px;
        border-radius:2px;
        border:1px solid rgba(255,255,255,.06);
        background: rgba(255,255,255,.02);
        display:flex;
        align-items:center;
        justify-content:center;
        margin-bottom: var(--sp-2);
      }
      .item-card.etapa5-item .etapa5-art img{
        width:100%; height:100%; object-fit:cover;
        filter: saturate(1.05) contrast(1.04);
      }

      /* Glow por raridade */
      .etapa5-glow-comum{ box-shadow: none; border-color: rgba(255,255,255,.18); }
      .etapa5-glow-incomum{ box-shadow: 0 0 18px rgba(47,216,255,.15); border-color: rgba(47,216,255,.35); }
      .etapa5-glow-raro{ box-shadow: 0 0 18px rgba(179,65,255,.18); border-color: rgba(179,65,255,.45); }
      .etapa5-glow-epico{ box-shadow: 0 0 24px rgba(179,65,255,.35); border-color: rgba(179,65,255,.6); }
      .etapa5-glow-lendario{ box-shadow: 0 0 26px rgba(255,210,76,.42); border-color: rgba(255,210,76,.7); }
      .etapa5-glow-mitico{ box-shadow: 0 0 24px rgba(255,43,78,.35); border-color: rgba(255,43,78,.65); }
      .etapa5-glow-divino{ box-shadow: 0 0 34px rgba(255,210,76,.55), 0 0 16px rgba(255,255,255,.22); border-color: rgba(255,210,76,.9); }

      /* Animação ao selecionar */
      @keyframes etapa5SelectPulse{
        0%{ transform: translateY(0); filter: brightness(1); }
        40%{ transform: translateY(-2px); filter: brightness(1.15); }
        100%{ transform: translateY(0); filter: brightness(1); }
      }
      .etapa5-selected{
        animation: etapa5SelectPulse 520ms ease-out both;
      }

      /* Modal detalhes */
      .etapa5-modal-overlay{
        position:fixed; inset:0; z-index:500;
        background: rgba(0,0,0,.65);
        display:none;
        align-items:center;
        justify-content:center;
        padding: var(--sp-6);
      }
      .etapa5-modal-overlay.open{ display:flex; }
      .etapa5-modal{
        width: min(980px, 100%);
      }
      .etapa5-modal .panel__body{ padding: var(--sp-5); }
      .etapa5-modal-grid{ display:grid; grid-template-columns: 280px 1fr; gap: var(--sp-5); }
      .etapa5-modal-art{
        width:100%; height:280px;
        border:1px solid rgba(255,255,255,.06);
        background: rgba(255,255,255,.02);
        overflow:hidden;
        clip-path: polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px);
      }
      .etapa5-modal-art img{ width:100%; height:100%; object-fit:cover; }
      .etapa5-meta{
        display:grid; grid-template-columns: 1fr 1fr; gap: var(--sp-3);
      }
      .etapa5-meta .config-row{ border-bottom:none; padding: 0; }
      .etapa5-meta .config-row__label{ font-size: var(--fs-xs); color: var(--c-text-faint); text-transform:uppercase; letter-spacing:.08em; }
    `;

    document.head.appendChild(style);
  }

  function rarityToGlowClass(rarity) {
    switch (rarity) {
      case 'Comum': return 'etapa5-glow-comum';
      case 'Incomum': return 'etapa5-glow-incomum';
      case 'Raro': return 'etapa5-glow-raro';
      case 'Épico': return 'etapa5-glow-epico';
      case 'Lendário': return 'etapa5-glow-lendario';
      case 'Mítico': return 'etapa5-glow-mitico';
      case 'Divino': return 'etapa5-glow-divino';
      default: return '';
    }
  }

  function renderInventoryGrid(items) {
    const grid = document.querySelector('#view-inventario .ga');
    if (!grid) return;

    // Limpa grid e renderiza cards
    grid.innerHTML = '';

    const visibleCount = 8; // mantém compatível com o texto atual “Mostrando 8 de 136” (mock)
    const slice = items.slice(0, visibleCount);

    slice.forEach((it) => {
      const card = document.createElement('div');
      card.className = `item-card etapa5-item ${RARITY_STYLES[it.rarity]?.class || ''} ${rarityToGlowClass(it.rarity)}`;
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.dataset.itemId = it.id;

      const img = itemImageDataUrl(it.seed);
      const tagClass = RARITY_STYLES[it.rarity]?.tag || 'tag--dim';

      card.innerHTML = `
        <div class="etapa5-art"><img alt="${escapeHtml(it.name)}" src="${img}"></div>
        <div class="item-card__name">${escapeHtml(it.name)}</div>
        <div class="item-card__tag">${escapeHtml(it.type)} · ${escapeHtml(it.rarity)}</div>
      `;

      card.addEventListener('click', () => openItemModal(it, card));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openItemModal(it, card);
        }
      });

      grid.appendChild(card);
    });

    // Footer (mantém texto, mas atualiza contagem com base real)
    const footer = document.querySelector('#view-inventario .panel__footer span');
    if (footer) footer.textContent = `Mostrando ${Math.min(visibleCount, items.length)} de ${items.length}`;
  }

  function ensureModal() {
    let overlay = document.getElementById('etapa5-inv-modal-overlay');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'etapa5-inv-modal-overlay';
    overlay.className = 'etapa5-modal-overlay';
    overlay.innerHTML = `
      <div class="panel panel--azure etapa5-modal">
        <div class="panel__hdr">
          <span>Detalhes do Item</span>
          <div class="flex-gap2">
            <span class="tag tag--dim" id="etapa5-modal-rarity">—</span>
            <button class="btn btn--danger btn--sm" id="etapa5-modal-close" type="button">Fechar</button>
          </div>
        </div>
        <div class="panel__body">
          <div class="etapa5-modal-grid">
            <div class="etapa5-modal-art" id="etapa5-modal-art-wrap">
              <img id="etapa5-modal-art" alt="" src="" />
            </div>
            <div>
              <div class="page-title" style="font-size:1.6rem; margin-bottom:var(--sp-2);" id="etapa5-modal-name"></div>
              <div class="page-sub" style="margin-top:0;" id="etapa5-modal-desc"></div>

              <div class="divider"></div>

              <div class="etapa5-meta" style="margin-bottom:var(--sp-4);">
                <div class="config-row"><div class="config-row__info"><div class="config-row__label">Peso</div><div class="config-row__desc" id="etapa5-modal-weight"></div></div></div>
                <div class="config-row"><div class="config-row__info"><div class="config-row__label">Preço</div><div class="config-row__desc" id="etapa5-modal-price"></div></div></div>
                <div class="config-row"><div class="config-row__info"><div class="config-row__label">Durabilidade</div><div class="config-row__desc" id="etapa5-modal-durability"></div></div></div>
                <div class="config-row"><div class="config-row__info"><div class="config-row__label">Nível mínimo</div><div class="config-row__desc" id="etapa5-modal-minlevel"></div></div></div>
                <div class="config-row"><div class="config-row__info"><div class="config-row__label">Origem</div><div class="config-row__desc" id="etapa5-modal-origin"></div></div></div>
                <div class="config-row"><div class="config-row__info"><div class="config-row__label">Categoria</div><div class="config-row__desc" id="etapa5-modal-category"></div></div></div>
              </div>

              <div class="panel" style="margin-bottom:var(--sp-4); background: rgba(255,255,255,.02);">
                <div class="panel__hdr"><span>História</span><div class="panel__dot"></div></div>
                <div class="panel__body" style="padding: var(--sp-4);">
                  <div class="fs-sm text-dim" id="etapa5-modal-history"></div>
                </div>
              </div>

              <div class="panel" style="margin-bottom:0; background: rgba(255,255,255,.02);">
                <div class="panel__hdr"><span>Efeito Visual</span><div class="panel__dot"></div></div>
                <div class="panel__body" style="padding: var(--sp-4);">
                  <div class="fs-sm text-dim" id="etapa5-modal-effect"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    overlay.querySelector('#etapa5-modal-close').addEventListener('click', closeModal);

    function closeModal() {
      overlay.classList.remove('open');
      // remove selected pulse
      document.querySelectorAll('.etapa5-selected').forEach((x) => x.classList.remove('etapa5-selected'));
    }

    return overlay;
  }

  let modalCurrentCard = null;

  function openItemModal(item, cardEl) {
    ensureModal();
    const overlay = document.getElementById('etapa5-inv-modal-overlay');

    modalCurrentCard = cardEl || null;
    if (modalCurrentCard) {
      document.querySelectorAll('.etapa5-selected').forEach((x) => x.classList.remove('etapa5-selected'));
      modalCurrentCard.classList.add('etapa5-selected');
    }

    document.getElementById('etapa5-modal-rarity').textContent = item.rarity;
    const art = itemImageDataUrl(item.seed);

    document.getElementById('etapa5-modal-name').textContent = item.name;
    document.getElementById('etapa5-modal-desc').textContent = item.description;

    document.getElementById('etapa5-modal-art').src = art;
    document.getElementById('etapa5-modal-weight').textContent = `${item.weightKg} kg`;
    document.getElementById('etapa5-modal-price').textContent = `${item.price} 🪙`;
    document.getElementById('etapa5-modal-durability').textContent = `${item.durability}/100`;
    document.getElementById('etapa5-modal-minlevel').textContent = `${item.minLevel}`;
    document.getElementById('etapa5-modal-origin').textContent = item.origin;
    document.getElementById('etapa5-modal-category').textContent = item.category;

    document.getElementById('etapa5-modal-history').textContent = item.history;
    document.getElementById('etapa5-modal-effect').textContent = item.visualEffect;

    overlay.classList.add('open');
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '<')
      .replaceAll('>', '>')
      .replaceAll('"', '"')
      .replaceAll("'", '&#039;');
  }

  function init() {
    installStylesOnce();
    const items = loadInventory();

    // Renderiza quando a view de inventário existir e estiver na tela
    const invSection = document.getElementById('view-inventario');
    if (!invSection) return;

    renderInventoryGrid(items);

    // Re-render se o usuário navegar de volta (SPA)
    const observer = new MutationObserver(() => {
      const view = document.getElementById('view-inventario');
      if (view && view.classList.contains('active')) {
        renderInventoryGrid(items);
      }
    });

    observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class'] });
  }

  document.addEventListener('DOMContentLoaded', init);
})();

